import { google } from 'googleapis';
import crypto from 'crypto';
import { initializeDrive, getHeroImages as getDriveHeroImages } from './googleDrive';
import { uploadToBlob, deleteFromBlob, listBlobFiles, type BlobImage } from './blobStorage'; // Import blob functions and BlobImage type
// import { BlobListResultBlob } from '@vercel/blob'; // Import type for list results - This type is not used.
import fs from 'fs';
import path from 'path';

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

// Define a prefix for hero images in Vercel Blob
const HERO_BLOB_PREFIX = 'hero_images/';

// Cache file must be written to /tmp in a serverless environment
const HERO_CACHE_FILE = path.join('/tmp', '.hero-sync-cache.json');
// const HERO_CACHE_FILE = path.join(process.cwd(), '.hero-sync-cache.json'); // Old path
const HERO_SYNC_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
// const HERO_SYNC_COOLDOWN = 0; // Temporarily set to 0 for debugging
// const HERO_SYNC_COOLDOWN = 3600000; // 1 hour in milliseconds

interface HeroSyncCache {
  lastSync: number;
  // Stores Google Drive file ID for each Blob pathname to detect if re-upload is needed.
  // We assume if GDrive ID for a given name changes, it's a new file or needs update.
  // A more robust solution might involve etags or lastModified from GDrive if available & reliable.
  blobFiles: Record<string, { driveId: string; pathname: string }>; // blobPathname: { driveId, pathname }
}

let isHeroSyncing = false;
let lastHeroSyncAttempt = 0;

// Read hero cache file (structure updated)
const readHeroCache = (): HeroSyncCache => {
  // console.warn('[DEBUG] readHeroCache: Forcing empty cache for one-time resync.');
  // return { lastSync: 0, blobFiles: {} };

  try {
    if (fs.existsSync(HERO_CACHE_FILE)) {
      const cacheData = fs.readFileSync(HERO_CACHE_FILE, 'utf-8');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        // Ensure 'blobFiles' property exists
        return { lastSync: parsed.lastSync || 0, blobFiles: parsed.blobFiles || {} };
      }
    }
  } catch (error) {
    console.error('Error reading hero sync cache:', error);
  }
  return { lastSync: 0, blobFiles: {} };
};

// Write hero cache file (structure updated)
const writeHeroCache = (cache: HeroSyncCache) => {
  try {
    fs.writeFileSync(HERO_CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Error writing hero sync cache:', error);
  }
};

// No longer need ensureHeroImagesDir or calculateFileHash for local files

// Download image from Google Drive as Buffer
const downloadImageAsBuffer = async (fileId: string): Promise<Buffer> => {
  try {
    const drive = await initializeDrive(); // Correctly get the drive instance
    // Wrap the drive.files.get call with retry logic
    const response = await withRetry(() => drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    ), `downloadImageAsBuffer_get_${fileId}`);
    
    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    // The error will be logged by withRetry if it fails after retries, 
    // or if it's a non-retryable error.
    // console.error(`Error downloading file ${fileId} from Google Drive:`, error); // Original logging, can be removed or kept if specific handling is needed here.
    throw error; // Re-throw to be caught by caller in syncHeroImages
  }
};

// Main sync function for hero images (rewritten for Vercel Blob)
export const syncHeroImages = async (): Promise<boolean> => {
  // Vercel Build Context Check
  if (process.env.CI === 'true') {
    console.log('[syncHeroImages] In Vercel CI (build) environment, skipping actual sync operations.');
    return true;
  }

  if (isHeroSyncing) {
    console.log('Hero image sync already in progress, skipping.');
    return false;
  }

  const now = Date.now();
  if (now - lastHeroSyncAttempt < HERO_SYNC_COOLDOWN) {
    console.log(`Hero image sync cooldown. Last attempt: ${new Date(lastHeroSyncAttempt).toISOString()}. Skipping.`);
    return false;
  }

  console.log('Attempting to sync hero images with Vercel Blob...');
  lastHeroSyncAttempt = now;
  isHeroSyncing = true;

  try {
    const googleDriveHeroFolderId = process.env.GOOGLE_DRIVE_HERO_FOLDER_ID;
    if (!googleDriveHeroFolderId) {
      console.error('GOOGLE_DRIVE_HERO_FOLDER_ID is not set.');
      return false;
    }

    const cache = readHeroCache();
    
    // 1. Get list of current hero images from Google Drive
    const driveImages = await getDriveHeroImages(); // This now returns {id, name}[]
    if (!driveImages) {
        console.error('Failed to fetch hero images list from Google Drive.');
        return false;
    }
    // console.log(`Found ${driveImages.length} images in Google Drive hero folder.`);

    const driveImageMap = new Map<string, string>(); // blobPathname: driveFileId
    driveImages.forEach(img => {
      const blobPathname = `${HERO_BLOB_PREFIX}${img.name}`; // Sanitize name if necessary
      driveImageMap.set(blobPathname, img.id);
    });

    // 2. Get list of current hero images from Vercel Blob
    console.log(`[syncHeroImages] About to list blob files with prefix: ${HERO_BLOB_PREFIX}`);
    const existingBlobObjects: BlobImage[] = await listBlobFiles(HERO_BLOB_PREFIX);
    console.log(`[syncHeroImages] Raw existingBlobObjects from listBlobFiles:`, JSON.stringify(existingBlobObjects, null, 2));
    
    const existingBlobMap = new Map<string, BlobImage>(); // blobPathname: BlobImage (from our type)
    if (existingBlobObjects) { 
        existingBlobObjects.forEach(blob => existingBlobMap.set(blob.pathname, blob));
        console.log(`[syncHeroImages] Populated existingBlobMap. Size: ${existingBlobMap.size}. Keys: ${JSON.stringify(Array.from(existingBlobMap.keys()))}`);
        // console.log(`Found ${existingBlobObjects.length} images in Vercel Blob at prefix ${HERO_BLOB_PREFIX}.`);
    } else {
        console.log(`No images found or an issue occurred while listing from Vercel Blob at prefix ${HERO_BLOB_PREFIX}. Assuming empty.`);
        // existingBlobObjects will effectively be an empty array if it was null/undefined leading here,
        // or an empty array if listBlobFiles returned []
    }

    let filesChanged = false;

    // 3. Upload new or changed files from Drive to Blob
    for (const driveImage of driveImages) {
      const blobPathname = `${HERO_BLOB_PREFIX}${driveImage.name}`; // Ensure consistent naming
      const cachedBlobEntry = cache.blobFiles[blobPathname];

      // Upload if:
      // - Not in Blob cache (new file).
      // - Or, Drive ID in cache doesn't match current Drive ID (file with same name was replaced in Drive).
      // - Or, not actually in Blob storage (e.g. cache is stale or manual deletion from Blob).
      if (!cachedBlobEntry || cachedBlobEntry.driveId !== driveImage.id || !existingBlobMap.has(blobPathname)) {
        // console.log(`Processing hero image for upload/update: ${driveImage.name} (ID: ${driveImage.id}) to ${blobPathname}`);
        try {
          const imageBuffer = await downloadImageAsBuffer(driveImage.id);
          const uploadedBlob = await uploadToBlob(imageBuffer, blobPathname); // uploadToBlob from blobStorage.ts
          cache.blobFiles[blobPathname] = { driveId: driveImage.id, pathname: uploadedBlob.pathname };
          console.log(`Uploaded hero image: ${uploadedBlob.pathname}`);
          filesChanged = true;
        } catch (error) {
          console.error(`Error processing hero image ${driveImage.name} (ID: ${driveImage.id}):`, error);
          // If upload fails, remove from cache to ensure retry on next sync
          delete cache.blobFiles[blobPathname];
        }
      } else {
        // console.log(`Hero image ${driveImage.name} (${blobPathname}) is up-to-date in Blob.`);
      }
    }

    // 4. Remove files from Blob that no longer exist in Drive's hero folder
    for (const existingBlobPathname of existingBlobMap.keys()) {
      if (!driveImageMap.has(existingBlobPathname)) {
        // console.log(`Removing stale hero image from Blob: ${existingBlobPathname}`);
        try {
          await deleteFromBlob(existingBlobPathname); // deleteFromBlob from blobStorage.ts
          delete cache.blobFiles[existingBlobPathname];
          console.log(`Removed stale hero image: ${existingBlobPathname}`);
          filesChanged = true;
        } catch (error) {
          console.error(`Error removing stale hero image ${existingBlobPathname} from Blob:`, error);
        }
      }
    }

    if (filesChanged) {
        console.log('Hero images in Vercel Blob were updated.');
    } else {
        // console.log('No changes to hero images in Vercel Blob.');
    }

    cache.lastSync = now;
    writeHeroCache(cache);
    console.log('Hero images sync with Vercel Blob completed.');
    return true;

  } catch (error) {
    console.error('Error during hero images sync with Vercel Blob:', error);
    return false;
  } finally {
    isHeroSyncing = false;
  }
}; 