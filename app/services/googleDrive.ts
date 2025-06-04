import { google } from 'googleapis';
import { drive_v3 } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Retry utility
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3; 
const INITIAL_DELAY_MS = 2000; // Start with a 2-second delay

async function withRetry<T>(
  fn: () => Promise<T>,
  functionName: string = 'googleApiCall'
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message?.toLowerCase() || '';
      const errorCode = error.code?.toUpperCase() || '';
      // Check if the error is from gaxios and has a status
      const errorStatus = error.response?.status; 

      if (
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('network error') || // More generic network error
        errorCode === 'ECONNRESET' ||
        errorCode === 'ETIMEDOUT' ||
        (errorStatus && [500, 502, 503, 504].includes(errorStatus)) // Google API server-side transient errors
      ) {
        if (i < MAX_RETRIES - 1) {
          const delayTime = INITIAL_DELAY_MS * Math.pow(2, i);
          console.warn(`[${functionName}] Retryable error (attempt ${i + 1}/${MAX_RETRIES}). Retrying in ${delayTime}ms... Error: ${error.message}`);
          await delay(delayTime);
        } else {
          console.error(`[${functionName}] Max retries (${MAX_RETRIES}) reached for ${functionName}. Last error: ${error.message}`);
        }
      } else {
        console.error(`[${functionName}] Non-retryable error: ${error.message}`, error);
        throw error; // Re-throw immediately for non-retryable errors
      }
    }
  }
  console.error(`[${functionName}] Failed after ${MAX_RETRIES} retries for ${functionName}.`);
  throw lastError; // Re-throw the last error if all retries fail
}

const PORTFOLIO_DIR = path.join(process.cwd(), 'public', 'portfolio_images');

// Types
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webContentLink?: string;
  webViewLink?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
  subfolders: DriveFolder[];
}

interface PortfolioStructure {
  subfolders: DriveFolder[];
}

// Initialize the Drive API
export const initializeDrive = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
};

// Get Google Drive auth
const getAuth = async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return auth;
};

// Find a folder by name
const findFolderByName = async (drive: drive_v3.Drive, name: string) => {
  try {
    // First try exact match
    let response = await withRetry(() => drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${name}'`,
      fields: 'files(id, name)',
    }), 'findFolderByName_exact');

    let folders = response.data.files || [];
    
    // If no exact match, try case-insensitive
    if (folders.length === 0) {
      response = await withRetry(() => drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
      }), 'findFolderByName_caseInsensitiveList');
      
      folders = (response.data.files || []).filter(folder => 
        folder.name?.toLowerCase() === name.toLowerCase()
      );
    }

    // console.log(`Found ${folders.length} matching folders for ${name}`); // Keep if useful, or remove for cleaner logs
    return folders[0]; // Return the first matching folder
  } catch (error) {
    console.error(`Error finding folder by name "${name}":`, error); // Enhanced logging
    return null;
  }
};

// Get all files in a folder
export const getFilesInFolder = async (folderId: string): Promise<DriveFile[]> => {
  try {
    const drive = initializeDrive();
    const response = await withRetry(() => drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webContentLink, webViewLink)',
    }), `getFilesInFolder_list_${folderId}`);

    return (response.data.files || []).map((file: drive_v3.Schema$File): DriveFile => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      webContentLink: file.webContentLink || undefined,
      webViewLink: file.webViewLink || undefined
    }));
  } catch (error) {
    console.error(`Error getting files from folder ${folderId}:`, error);
    return [];
  }
};

// Get all subfolders in a folder
export const getSubfolders = async (folderId: string): Promise<DriveFolder[]> => {
  try {
    const drive = initializeDrive();
    const response = await withRetry(() => drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
    }), `getSubfolders_list_${folderId}`);

    const folders = response.data.files || [];
    const subfolders: DriveFolder[] = [];

    for (const folder of folders) {
      if (folder.id && folder.name) { // Ensure folder.id and folder.name are not null
        const files = await getFilesInFolder(folder.id); // This already uses withRetry
        subfolders.push({
          id: folder.id,
          name: folder.name,
          files,
          subfolders: await getSubfolders(folder.id), // Recursive call, already uses withRetry
        });
      } else {
        console.warn(`Skipping subfolder with missing id or name in folder ${folderId}`, folder);
      }
    }

    return subfolders;
  } catch (error) {
    console.error(`Error getting subfolders for folder ${folderId}:`, error);
    return [];
  }
};

// Get the complete portfolio structure
export const getPortfolioStructure = async (): Promise<DriveFolder | null> => {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set');
    }

    const drive = initializeDrive();
    const folderDetailsResponse = await withRetry(() => drive.files.get({
      fileId: folderId,
      fields: 'id, name',
    }), `getPortfolioStructure_get_${folderId}`);
    
    const folderData = folderDetailsResponse.data;
    if (!folderData || !folderData.id || !folderData.name) {
        console.error('Failed to retrieve valid main portfolio folder data from Google Drive.');
        return null;
    }

    const files = await getFilesInFolder(folderId); // Already uses withRetry
    const subfolders = await getSubfolders(folderId); // Already uses withRetry

    return {
      id: folderData.id,
      name: folderData.name,
      files,
      subfolders,
    };
  } catch (error) {
    console.error('Error getting portfolio structure:', error);
    return null;
  }
};

// Get images by category (subfolder name)
export const getImagesByCategory = async (category: string) => {
  try {
    const drive = initializeDrive();

    // Get the folder ID for the category
    const categoryFolder = await findFolderByName(drive, category); // findFolderByName now uses withRetry
    if (!categoryFolder || !categoryFolder.id) {
      console.error(`Category folder or its ID not found for: ${category}`);
      return [];
    }

    // List all files in the category folder
    const response = await withRetry(() => drive.files.list({
      q: `'${categoryFolder.id}' in parents and mimeType contains 'image/' and trashed = false`, // Added trashed = false
      fields: 'files(id, name)', // Requesting id and name
    }), `getImagesByCategory_list_${categoryFolder.id}`);

    const files = response.data.files || [];
    // console.log(`Found ${files.length} raw file entries in ${category}`); // Keep if useful

    // Filter for valid files and then map
    const validImages = files
      .filter(file => file.id && file.name) // Ensure id and name are present
      .map(file => {
        const id = file.id as string;
        const name = file.name as string;
        const ext = name.split('.').pop()?.toLowerCase() || 'jpg'; 
        return {
          id: id,
          name: name,
          // The src here is a local path convention, not directly from Drive for this function's purpose
          src: `/portfolio_images/${category.toLowerCase()}/${id}.${ext}` 
        };
      });
    
    // console.log(`Mapped ${validImages.length} valid images for ${category}`); // Keep if useful
    return validImages;
  } catch (error) {
    console.error(`Error getting images for category ${category}:`, error);
    return [];
  }
};

// Get hero images (list of files in the hero folder)
export const getHeroImages = async (): Promise<Array<{id: string, name: string}>> => {
  try {
    const heroFolderId = process.env.GOOGLE_DRIVE_HERO_FOLDER_ID;
    if (!heroFolderId) {
      console.error('GOOGLE_DRIVE_HERO_FOLDER_ID is not set.');
      return [];
    }
    const drive = initializeDrive();
    const response = await withRetry(() => drive.files.list({
      q: `'${heroFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name)',
    }), `getHeroImages_list_${heroFolderId}`);

    const files = response.data.files || [];
    return files
      .filter(file => file.id && file.name)
      .map(file => ({
        id: file.id as string,
        name: file.name as string,
      }));
  } catch (error) {
    console.error('Error fetching hero images from Google Drive:', error);
    return [];
  }
}; 