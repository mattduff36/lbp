import { getPortfolioStructure, initializeDrive } from './googleDrive';
import { uploadToBlob, deleteFromBlob, listBlobFiles } from './blobStorage';
import { google } from 'googleapis';
import crypto from 'crypto';
import { PortfolioImage } from '@/app/components/types';

// Retry utility
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3; 
const INITIAL_DELAY_MS = 2000; // Start with a 2-second delay

async function withRetry<T>(
  fn: () => Promise<T>,
  functionName: string = 'googleApiCall' // Default function name for logging
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message?.toLowerCase() || '';
      const errorCode = error.code?.toUpperCase() || '';
      const errorStatus = error.response?.status;

      if (
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('network error') ||
        errorCode === 'ECONNRESET' ||
        errorCode === 'ETIMEDOUT' ||
        (errorStatus && [500, 502, 503, 504].includes(errorStatus))
      ) {
        if (i < MAX_RETRIES - 1) {
          const delayTime = INITIAL_DELAY_MS * Math.pow(2, i);
          console.warn(`[${functionName}] Retryable error (attempt ${i + 1}/${MAX_RETRIES}). Retrying in ${delayTime}ms... Error: ${error.message}`);
          await delay(delayTime);
        } else {
          console.error(`[${functionName}] Max retries (${MAX_RETRIES}) reached for ${functionName}. Last error: ${error.message}`);
        }
      } else {
        console.error(`[${functionName}] Non-retryable error for ${functionName}: ${error.message}`, error);
        throw error; 
      }
    }
  }
  console.error(`[${functionName}] Failed after ${MAX_RETRIES} retries for ${functionName}.`);
  throw lastError; 
}

const SYNC_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
// let isSyncing = false; // Old global flag
// let lastSyncAttempt = 0; // Old global timestamp

// Category-specific sync status and cooldown tracking
const categorySyncStatus: Record<string, { isSyncing: boolean; lastSyncAttempt: number }> = {};

interface SyncCache { // This seems to be an old local cache structure, not currently used by syncPortfolio for cooldown.
  lastSync: number;
  fileHashes: Record<string, string>;
}

// Calculate file hash
const calculateFileHash = (buffer: Buffer): string => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

// Get existing files in blob storage
const getExistingFiles = async (prefix: string): Promise<string[]> => {
  try {
    const files = await listBlobFiles(prefix);
    return files.map(file => file.pathname);
  } catch (error) {
    console.error(`Error reading blob storage for prefix ${prefix}:`, error);
    return [];
  }
};

// Download image from Google Drive using the API
const downloadImage = async (fileId: string): Promise<Buffer> => {
  try {
    const drive = await initializeDrive();
    // Wrap the drive.files.get call with retry logic
    const response = await withRetry(() => drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    ), `downloadImage_get_${fileId}`);
    
    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    // Error logging handled by withRetry or the calling function (syncCategory)
    // console.error(`Error downloading file ${fileId}:`, error); // Original logging, can be removed.
    throw error;
  }
};

export const getLocalPortfolioImages = async (categoryName: string): Promise<PortfolioImage[]> => {
  const categoryLower = categoryName.toLowerCase();
  const prefix = `portfolio_images/${categoryLower}/`;

  try {
    const files = await listBlobFiles(prefix);
    return files.map(file => {
      const fileName = file.pathname.split('/').pop() || '';
      const fileId = fileName.split('.')[0];
      return {
        id: fileId,
        src: file.url,
        name: fileName,
        category: categoryLower,
      };
    });
  } catch (error) {
    console.error(`Error reading blob storage for category ${categoryLower}:`, error);
    return [];
  }
};

export const checkSyncNeeded = async (categoryName?: string): Promise<boolean> => {
  try {
    const structure = await getPortfolioStructure();
    if (!structure || structure.subfolders.length === 0) {
      console.error('Failed to get portfolio structure or no subfolders found.');
      return false;
    }

    const categoriesToCheck = categoryName
      ? structure.subfolders.filter(sf => sf.name.toLowerCase() === categoryName.toLowerCase())
      : structure.subfolders;

    for (const category of categoriesToCheck) {
      const currentCategoryNameLower = category.name.toLowerCase();
      const prefix = `portfolio_images/${currentCategoryNameLower}/`;
      const existingFiles = await getExistingFiles(prefix);
      
      const driveFileMap = new Map(category.files.map(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
        return [f.id, `${prefix}${f.id}.${ext}`];
      }));
      
      const driveFilePaths = new Set(driveFileMap.values());
      const localFilePaths = new Set(existingFiles);

      for (const driveFilePath of driveFilePaths) {
        if (!localFilePaths.has(driveFilePath)) {
          console.log(`Sync needed: New/missing file ${driveFilePath}`);
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking if sync is needed:', error);
    return false;
  }
};

// Sync a single category
const syncCategory = async (categoryData: { name: string; files: Array<{id: string, name: string}> }) => {
  const categoryNameLower = categoryData.name.toLowerCase();
  const prefix = `portfolio_images/${categoryNameLower}/`;
  const existingFiles = await getExistingFiles(prefix);
  const localFilePathsSet = new Set(existingFiles);

  const driveFilesToProcess = new Map<string, {id: string, name: string}>();
  categoryData.files.forEach(f => {
    const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${prefix}${f.id}.${ext}`;
    driveFilesToProcess.set(filePath, f);
  });

  // Download and upload new or changed files
  for (const [filePath, driveFile] of driveFilesToProcess) {
    if (!localFilePathsSet.has(filePath)) {
      console.log(`Processing file for ${categoryNameLower}: ${driveFile.name} (ID: ${driveFile.id}) as ${filePath}`);
      try {
        const fileBuffer = await downloadImage(driveFile.id);
        await uploadToBlob(fileBuffer, filePath);
        console.log(`Uploaded: ${filePath}`);
      } catch (error) {
        console.error(`Error processing ${driveFile.name} (ID: ${driveFile.id}):`, error);
      }
    }
  }

  // Remove files that no longer exist in Drive
  for (const localFilePath of existingFiles) {
    if (!driveFilesToProcess.has(localFilePath)) {
      try {
        await deleteFromBlob(localFilePath);
        console.log(`Removed: ${localFilePath}`);
      } catch (error) {
        console.error(`Error removing file ${localFilePath}:`, error);
      }
    }
  }
};

// Main sync function
export const syncPortfolio = async (categoryToSyncName?: string): Promise<boolean> => {
  // Vercel Build Context Check
  if (process.env.CI === 'true') {
    const buildSyncTypeMessage = categoryToSyncName ? `category: ${categoryToSyncName}` : 'all categories (global check)';
    console.log(`[syncPortfolio] In Vercel CI (build) environment, skipping actual sync for ${buildSyncTypeMessage}.`);
    return true; 
  }

  if (!categoryToSyncName) {
    console.warn('[syncPortfolio] Called without specific category. This mode of operation might be deprecated or requires review for cooldown/locking logic.');
    // Decide how to handle global sync attempt if ever needed. For now, we primarily expect per-category calls from cron.
    // Potentially, could iterate all known categories and check their individual cooldowns/locks.
    // Or, implement a separate global lock if a true "sync all at once without specific category context" is required.
    // For safety, returning false as this path is unclear for the new locking mechanism.
    return false; 
  }

  const categoryKey = categoryToSyncName.toLowerCase();
  if (!categorySyncStatus[categoryKey]) {
    categorySyncStatus[categoryKey] = { isSyncing: false, lastSyncAttempt: 0 };
  }

  if (categorySyncStatus[categoryKey].isSyncing) {
    console.log(`[syncPortfolio] Sync already in progress for category: ${categoryKey}, skipping.`);
    return false;
  }

  const now = Date.now();
  if (now - categorySyncStatus[categoryKey].lastSyncAttempt < SYNC_COOLDOWN) {
    console.log(`[syncPortfolio] Cooldown in effect for category: ${categoryKey}. Last attempt: ${new Date(categorySyncStatus[categoryKey].lastSyncAttempt).toISOString()}. Skipping.`);
    return false;
  }

  categorySyncStatus[categoryKey].lastSyncAttempt = now;
  categorySyncStatus[categoryKey].isSyncing = true;
  console.log(`[syncPortfolio] Attempting sync for category: ${categoryKey}...`);

  try {
    // Pass the specific categoryToSyncName to checkSyncNeeded
    const needsSyncCheckResult = await checkSyncNeeded(categoryToSyncName);
    if (!needsSyncCheckResult) {
      console.log(`[syncPortfolio] No changes detected for category: ${categoryKey}, skipping file operations.`);
      categorySyncStatus[categoryKey].isSyncing = false; // Release lock immediately
      // Update lastSyncAttempt here too, as an attempt was made and cooldown should apply even if no changes
      // categorySyncStatus[categoryKey].lastSyncAttempt = now; // Already set before try block
      return true;
    }

    console.log(`[syncPortfolio] Changes detected for category: ${categoryKey}, starting sync process...`);
    const structure = await getPortfolioStructure();
    if (!structure || structure.subfolders.length === 0) {
      console.error('[syncPortfolio] Failed to get portfolio structure or no subfolders found. Aborting sync for category: ', categoryKey);
      return false; // Error logged in getPortfolioStructure if it returns null
    }

    const categoryData = structure.subfolders.find(sf => sf.name.toLowerCase() === categoryKey);

    if (!categoryData) {
      console.warn(`[syncPortfolio] Category "${categoryKey}" not found in portfolio structure. Cannot sync.`);
      return false;
    }

    console.log(`[syncPortfolio] Syncing files for category: ${categoryData.name}`);
    await syncCategory(categoryData); // syncCategory processes one specific category

    console.log(`[syncPortfolio] Portfolio sync completed for category: ${categoryKey}.`);
    return true;
  } catch (error) {
    console.error(`[syncPortfolio] Error during portfolio sync for category: ${categoryKey}:`, error);
    return false;
  } finally {
    categorySyncStatus[categoryKey].isSyncing = false;
    // lastSyncAttempt is already updated at the start of the attempt for cooldown purposes.
  }
}; 