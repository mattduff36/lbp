import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import crypto from 'crypto';
import { initializeDrive } from './googleDrive'; // Will need this for downloadImage

const HERO_IMAGES_DIR = path.join(process.cwd(), 'public', 'hero_images');
const HERO_CACHE_FILE = path.join(process.cwd(), '.hero-sync-cache.json');
const HERO_SYNC_COOLDOWN = 3600000; // 1 hour in milliseconds

interface HeroSyncCache {
  lastSync: number;
  fileHashes: Record<string, string>; // filePath: hash
}

let isHeroSyncing = false;
let lastHeroSyncAttempt = 0;

// Read hero cache file
const readHeroCache = (): HeroSyncCache => {
  try {
    if (fs.existsSync(HERO_CACHE_FILE)) {
      const cacheData = fs.readFileSync(HERO_CACHE_FILE, 'utf-8');
      if (cacheData) {
        return JSON.parse(cacheData);
      }
    }
  } catch (error) {
    console.error('Error reading hero sync cache:', error);
  }
  return { lastSync: 0, fileHashes: {} };
};

// Write hero cache file
const writeHeroCache = (cache: HeroSyncCache) => {
  try {
    fs.writeFileSync(HERO_CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Error writing hero sync cache:', error);
  }
};

// Ensure hero images directory exists
const ensureHeroImagesDir = () => {
  if (!fs.existsSync(HERO_IMAGES_DIR)) {
    fs.mkdirSync(HERO_IMAGES_DIR, { recursive: true });
  }
};

// --- Helper utilities (will be copied or imported) ---
// Calculate file hash
const calculateFileHash = (filePath: string): string => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  } catch (error) {
    // console.error(`Error calculating hash for ${filePath}:`, error);
    return ''; // Return empty string if hash calculation fails
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
          console.log(`Downloaded Hero Image: ${destinationPath}`);
          resolve();
        });
    });
  } catch (error) {
    console.error(`Error initiating download for hero image file ${fileId}:`, error);
    throw error;
  }
};

// Main sync function for hero images
export const syncHeroImages = async (): Promise<boolean> => {
  if (isHeroSyncing) {
    console.log('Hero image sync already in progress, skipping.');
    return false; 
  }

  const now = Date.now();
  if (now - lastHeroSyncAttempt < HERO_SYNC_COOLDOWN) {
    console.log(`Hero image sync cooldown in effect. Last attempt: ${new Date(lastHeroSyncAttempt).toISOString()}. Skipping.`);
    return false; 
  }

  console.log('Attempting to sync hero images...');
  lastHeroSyncAttempt = now;
  isHeroSyncing = true;

  try {
    const drive = await initializeDrive();
    const heroFolderId = process.env.GOOGLE_DRIVE_HERO_FOLDER_ID;

    if (!heroFolderId) {
      console.error('GOOGLE_DRIVE_HERO_FOLDER_ID is not set in environment variables.');
      return false;
    }

    ensureHeroImagesDir();
    const cache = readHeroCache();
    
    const response = await drive.files.list({
      q: `'${heroFolderId}' in parents and mimeType contains 'image/'`,
      fields: 'files(id, name)', // Only need id and name
      pageSize: 50, // Max 50 hero images, reasonable limit
    });

    const driveFiles = response.data.files || [];
    if (driveFiles.length === 0) {
        console.log('No image files found in the Google Drive hero folder.');
        // Potentially clear local folder if desired, or leave as is.
        // For now, let's clear local files not in an empty driveFiles list.
    }

    const driveFileMap = new Map<string, string>(); // driveFileName: driveFileId
    driveFiles.forEach(file => {
      if (file.name && file.id) {
        driveFileMap.set(file.name, file.id);
      }
    });

    const localFiles = fs.existsSync(HERO_IMAGES_DIR) ? fs.readdirSync(HERO_IMAGES_DIR) : [];

    // Download or update files from Drive
    for (const driveFile of driveFiles) {
      if (!driveFile.id || !driveFile.name) continue;

      const localFilePath = path.join(HERO_IMAGES_DIR, driveFile.name);
      let needsDownload = false;

      if (!fs.existsSync(localFilePath)) {
        needsDownload = true;
        console.log(`Hero image ${driveFile.name} not found locally, scheduling download.`);
      } else {
        const currentHash = calculateFileHash(localFilePath);
        const cachedHash = cache.fileHashes[localFilePath];
        if (!currentHash || currentHash !== cachedHash) {
          needsDownload = true;
          console.log(`Hash mismatch or missing hash for hero image ${driveFile.name}, scheduling re-download.`);
        } else {
          // console.log(`Hero image ${driveFile.name} is up-to-date (hash match).`);
        }
      }

      if (needsDownload) {
        try {
          console.log(`Downloading hero image: ${driveFile.name} (ID: ${driveFile.id})`);
          await downloadImage(driveFile.id, localFilePath);
          const newHash = calculateFileHash(localFilePath);
          if (newHash) {
            cache.fileHashes[localFilePath] = newHash;
          } else {
            console.warn(`Could not calculate hash for newly downloaded hero image ${localFilePath}.`);
            delete cache.fileHashes[localFilePath]; // Remove potentially stale hash
          }
        } catch (error) {
          console.error(`Error downloading hero image ${driveFile.name}:`, error);
          // If download fails, ensure no stale hash for this path
          delete cache.fileHashes[localFilePath];
        }
      }
    }

    // Remove local files that no longer exist in Drive's hero folder
    for (const localFile of localFiles) {
      if (!driveFileMap.has(localFile)) {
        const localFilePath = path.join(HERO_IMAGES_DIR, localFile);
        try {
          fs.unlinkSync(localFilePath);
          delete cache.fileHashes[localFilePath];
          console.log(`Removed stale hero image: ${localFilePath}`);
        } catch (error) {
          console.error(`Error removing stale hero image ${localFilePath}:`, error);
        }
      }
    }

    cache.lastSync = Date.now();
    writeHeroCache(cache);
    console.log('Hero images sync completed.');
    return true;

  } catch (error) {
    console.error('Error during hero images sync:', error);
    return false;
  } finally {
    isHeroSyncing = false;
  }
}; 