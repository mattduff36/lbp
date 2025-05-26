import { getPortfolioStructure, initializeDrive } from './googleDrive';
import { uploadToBlob, deleteFromBlob, listBlobFiles } from './blobStorage';
import { google } from 'googleapis';
import crypto from 'crypto';
import { PortfolioImage } from '@/app/components/types';

const SYNC_COOLDOWN = 60000; // 1 minute cooldown between any sync operations
let isSyncing = false;
let lastSyncAttempt = 0;

interface SyncCache {
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
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    console.error(`Error downloading file ${fileId}:`, error);
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
  if (isSyncing) {
    console.log('Sync already in progress, skipping.');
    return false;
  }

  const now = Date.now();
  if (now - lastSyncAttempt < SYNC_COOLDOWN) {
    console.log(`Global sync cooldown in effect (requested for ${categoryToSyncName || 'all'}). Skipping.`);
    return false;
  }

  lastSyncAttempt = now;
  isSyncing = true;
  const syncTypeMessage = categoryToSyncName ? `category: ${categoryToSyncName}` : 'all categories';
  console.log(`Attempting sync for ${syncTypeMessage}...`);

  try {
    const needsSyncCheckResult = await checkSyncNeeded(categoryToSyncName);
    if (!needsSyncCheckResult) {
      console.log(`No changes detected for ${syncTypeMessage}, skipping file operations.`);
      return true;
    }

    console.log(`Changes detected for ${syncTypeMessage}, starting sync process...`);
    const structure = await getPortfolioStructure();
    if (!structure || structure.subfolders.length === 0) {
      console.error('Failed to get portfolio structure or no subfolders found. Aborting sync.');
      return false;
    }

    const categoriesToProcess = categoryToSyncName
      ? structure.subfolders.filter(sf => sf.name.toLowerCase() === categoryToSyncName.toLowerCase())
      : structure.subfolders;

    if (categoryToSyncName && categoriesToProcess.length === 0) {
      console.warn(`Category "${categoryToSyncName}" not found in portfolio structure. Cannot sync.`);
      return false;
    }

    for (const categoryData of categoriesToProcess) {
      console.log(`Syncing files for category: ${categoryData.name}`);
      await syncCategory(categoryData);
    }

    console.log(`Portfolio sync completed for ${syncTypeMessage}.`);
    return true;
  } catch (error) {
    console.error(`Error during portfolio sync for ${syncTypeMessage}:`, error);
    return false;
  } finally {
    isSyncing = false;
  }
}; 