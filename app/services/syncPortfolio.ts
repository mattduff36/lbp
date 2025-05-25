import { getPortfolioStructure, initializeDrive } from './googleDrive';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import crypto from 'crypto';

const PORTFOLIO_DIR = path.join(process.cwd(), 'public', 'portfolio_images');
const CACHE_FILE = path.join(process.cwd(), '.sync-cache.json');
const SYNC_COOLDOWN = 60000; // 1 minute cooldown between any sync operations

interface SyncCache {
  lastSync: number; // Timestamp of the last successful sync completion (any category or global)
  fileHashes: Record<string, string>;
}

let isSyncing = false; // Global flag to prevent concurrent sync operations
let lastSyncAttempt = 0; // Timestamp of the last attempt to start a sync (any category or global)

// Read cache file
const readCache = (): SyncCache => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = fs.readFileSync(CACHE_FILE, 'utf-8');
      if (cacheData) {
        return JSON.parse(cacheData);
      }
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return { lastSync: 0, fileHashes: {} };
};

// Write cache file
const writeCache = (cache: SyncCache) => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
};

// Calculate file hash
const calculateFileHash = (filePath: string): string => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  } catch (error) {
    // console.error(`Error calculating hash for ${filePath}:`, error); // Can be noisy
    return '';
  }
};

// Ensure portfolio directory exists
const ensurePortfolioDir = () => {
  if (!fs.existsSync(PORTFOLIO_DIR)) {
    fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });
  }
};

// Ensure category directory exists
const ensureCategoryDir = (category: string) => {
  const categoryDir = path.join(PORTFOLIO_DIR, category.toLowerCase());
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
};

// Get existing files in a directory
const getExistingFiles = (dir: string): string[] => {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir);
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
};

// Download image from Google Drive using the API
const downloadImage = async (fileId: string, destinationPath: string): Promise<void> => {
  try {
    const drive = await initializeDrive();
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(destinationPath);
      response.data
        .on('error', (err: any) => {
          console.error(`Stream error downloading ${fileId} to ${destinationPath}:`, err);
          fs.unlink(destinationPath, () => {}); // Clean up partially downloaded file
          reject(err);
        })
        .pipe(fileStream)
        .on('error', (err: any) => { // Handle errors on the write stream as well
          console.error(`File stream error for ${destinationPath}:`, err);
          fs.unlink(destinationPath, () => {});
          reject(err);
        })
        .on('finish', () => {
          // fileStream.close(); // Not needed, 'finish' implies closed for writable streams when piping
          console.log(`Downloaded: ${destinationPath}`);
          resolve();
        });
    });
  } catch (error) {
    console.error(`Error initiating download for file ${fileId}:`, error);
    // Ensure a failed download doesn't leave an empty/partial file if possible, though unlink is in stream error handling
    if (fs.existsSync(destinationPath)) {
        // fs.unlinkSync(destinationPath); // Risky if another process just finished it
    }
    throw error;
  }
};

// Check if files need to be synced for specific category or all
export const checkSyncNeeded = async (categoryName?: string): Promise<boolean> => {
  try {
    const cache = readCache(); // Read cache for current hashes
    const structure = await getPortfolioStructure();
    if (!structure || structure.subfolders.length === 0) {
        console.log('No portfolio structure found or no subfolders to check.');
        return false;
    }

    const categoriesToCheck = categoryName
      ? structure.subfolders.filter(sf => sf.name.toLowerCase() === categoryName.toLowerCase())
      : structure.subfolders;

    if (categoryName && categoriesToCheck.length === 0) {
      console.warn(`Category "${categoryName}" not found in portfolio structure for sync check.`);
      return false; // Category to check doesn't exist
    }
    if (categoriesToCheck.length === 0 && !categoryName) {
        console.log('No categories to check for sync.');
        return false;
    }


    for (const category of categoriesToCheck) {
      const currentCategoryNameLower = category.name.toLowerCase();
      const categoryDir = path.join(PORTFOLIO_DIR, currentCategoryNameLower);
      ensureCategoryDir(currentCategoryNameLower); // Ensure dir exists before reading
      const existingLocalFiles = getExistingFiles(categoryDir);
      
      const driveFileMap = new Map(category.files.map(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
        return [f.id, `${f.id}.${ext}`]; // Store ID to filename mapping
      }));
      const driveFileNames = new Set(driveFileMap.values());
      const localFileNames = new Set(existingLocalFiles);

      // Check for new files in Drive or files missing locally
      for (const driveFileName of driveFileNames) {
        if (!localFileNames.has(driveFileName)) {
          console.log(`Sync needed: New/missing file ${driveFileName} in category ${currentCategoryNameLower}`);
          return true;
        }
      }

      // Check for local files not in Drive (to be deleted) or changed hashes
      for (const localFile of existingLocalFiles) {
        const localFilePath = path.join(categoryDir, localFile);
        const fileIdFromLocalName = localFile.split('.')[0];

        if (!driveFileMap.has(fileIdFromLocalName)) {
          console.log(`Sync needed: Local file ${localFile} no longer in Drive for category ${currentCategoryNameLower}`);
          return true; // Local file to be removed
        }
        
        // If file exists in both, check hash
        const currentHash = calculateFileHash(localFilePath);
        const cachedHash = cache.fileHashes[localFilePath];
        if (!currentHash) { // Hash calculation failed, might indicate file issue
            console.warn(`Could not calculate hash for ${localFilePath}, assuming sync is needed.`);
            return true;
        }
        if (currentHash !== cachedHash) {
          console.log(`Sync needed: Hash mismatch for ${localFile} in category ${currentCategoryNameLower}`);
          return true;
        }
      }
    }
    
    return false; // No changes detected in the checked categories
  } catch (error) {
    console.error('Error checking sync status:', error);
    return true; // Assume sync is needed if error occurs during check
  }
};

// Sync a single category, updates the passed cache object
const syncCategory = async (
    categoryData: { name: string; files: Array<{id: string, name: string}> },
    cache: SyncCache
) => {
  const categoryNameLower = categoryData.name.toLowerCase();
  ensureCategoryDir(categoryNameLower);
  const categoryDir = path.join(PORTFOLIO_DIR, categoryNameLower);
  const existingLocalFiles = getExistingFiles(categoryDir);
  const localFileNamesSet = new Set(existingLocalFiles);

  const driveFilesToProcess = new Map<string, {id: string, name: string}>();
  categoryData.files.forEach(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileNameOnDisk = `${f.id}.${ext}`;
      driveFilesToProcess.set(fileNameOnDisk, f);
  });

  // Download new or changed files
  for (const [fileNameOnDisk, driveFile] of driveFilesToProcess) {
    const filePath = path.join(categoryDir, fileNameOnDisk);
    let needsDownload = !localFileNamesSet.has(fileNameOnDisk);

    if (!needsDownload) { // File exists, check hash
      const currentHash = calculateFileHash(filePath);
      if (!currentHash || currentHash !== cache.fileHashes[filePath]) {
        console.log(`Hash mismatch or missing hash for ${filePath}, re-downloading.`);
        needsDownload = true;
      }
    }

    if (needsDownload) {
      console.log(`Processing file for ${categoryNameLower}: ${driveFile.name} (ID: ${driveFile.id}) as ${fileNameOnDisk}`);
      try {
        await downloadImage(driveFile.id, filePath);
        const newHash = calculateFileHash(filePath);
        if (newHash) {
            cache.fileHashes[filePath] = newHash;
        } else {
            console.warn(`Could not calculate hash for newly downloaded file ${filePath}. Cache not updated for this file.`);
        }
      } catch (error) {
        console.error(`Error downloading ${driveFile.name} (ID: ${driveFile.id}):`, error);
        // If download fails, ensure no stale hash in cache for this path
        delete cache.fileHashes[filePath];
      }
    }
  }

  // Remove local files that no longer exist in Drive for this category
  for (const localFileName of existingLocalFiles) {
    if (!driveFilesToProcess.has(localFileName)) {
      const filePath = path.join(categoryDir, localFileName);
      try {
        fs.unlinkSync(filePath);
        delete cache.fileHashes[filePath];
        console.log(`Removed: ${filePath}`);
      } catch (error) {
        console.error(`Error removing file ${filePath}:`, error);
      }
    }
  }
  // Cache is written by syncPortfolio after all categories (if global) or this category (if specific)
};

// Main sync function
export const syncPortfolio = async (categoryToSyncName?: string): Promise<boolean> => {
  if (isSyncing) {
    console.log('Sync already in progress, skipping.');
    return false; // Sync did not run
  }

  const now = Date.now();
  if (now - lastSyncAttempt < SYNC_COOLDOWN) {
    console.log(`Global sync cooldown in effect (requested for ${categoryToSyncName || 'all'}). Skipping.`);
    return false; // Sync did not run
  }

  lastSyncAttempt = now;
  isSyncing = true;
  const syncTypeMessage = categoryToSyncName ? `category: ${categoryToSyncName}` : 'all categories';
  console.log(`Attempting sync for ${syncTypeMessage}...`);

  try {
    const needsSyncCheckResult = await checkSyncNeeded(categoryToSyncName);
    if (!needsSyncCheckResult) {
      console.log(`No changes detected for ${syncTypeMessage}, skipping file operations.`);
      // Considered a successful sync check, even if no files moved.
      // Update lastSync time in cache if it was a specific category sync that was up-to-date.
      if (categoryToSyncName) {
        const cache = readCache();
        cache.lastSync = Date.now(); // Reflect that this category was checked
        writeCache(cache);
      }
      return true; 
    }

    console.log(`Changes detected for ${syncTypeMessage}, starting sync process...`);
    const structure = await getPortfolioStructure();
    if (!structure || structure.subfolders.length === 0) {
      console.error('Failed to get portfolio structure or no subfolders found. Aborting sync.');
      return false; // Sync could not proceed due to missing structure
    }

    ensurePortfolioDir();
    const cache = readCache();

    const categoriesToProcess = categoryToSyncName
      ? structure.subfolders.filter(sf => sf.name.toLowerCase() === categoryToSyncName.toLowerCase())
      : structure.subfolders;

    if (categoryToSyncName && categoriesToProcess.length === 0) {
      console.warn(`Category "${categoryToSyncName}" not found in portfolio structure. Cannot sync.`);
      return false; // Category to sync not found
    } else {
        for (const categoryData of categoriesToProcess) {
          console.log(`Syncing files for category: ${categoryData.name}`);
          await syncCategory(categoryData, cache);
        }
        cache.lastSync = Date.now();
        writeCache(cache);
        console.log(`Portfolio sync completed for ${syncTypeMessage}.`);
        return true; // Sync process completed
    }
  } catch (error) {
    console.error(`Error during portfolio sync for ${syncTypeMessage}:`, error);
    return false; // Sync encountered an unhandled error
  } finally {
    isSyncing = false;
  }
}; 