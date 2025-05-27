import { google } from 'googleapis';
import { drive_v3 } from 'googleapis';
import path from 'path';
import fs from 'fs';

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
    let response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${name}'`,
      fields: 'files(id, name)',
    });

    let folders = response.data.files || [];
    
    // If no exact match, try case-insensitive
    if (folders.length === 0) {
      response = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
      });
      
      folders = (response.data.files || []).filter(folder => 
        folder.name?.toLowerCase() === name.toLowerCase()
      );
    }

    console.log(`Found ${folders.length} matching folders for ${name}`);
    return folders[0]; // Return the first matching folder
  } catch (error) {
    console.error('Error finding folder:', error);
    return null;
  }
};

// Get all files in a folder
export const getFilesInFolder = async (folderId: string): Promise<DriveFile[]> => {
  try {
    const drive = initializeDrive();
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webContentLink, webViewLink)',
    });

    return (response.data.files || []).map((file: drive_v3.Schema$File): DriveFile => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      webContentLink: file.webContentLink || undefined,
      webViewLink: file.webViewLink || undefined
    }));
  } catch (error) {
    console.error('Error getting files from folder:', error);
    return [];
  }
};

// Get all subfolders in a folder
export const getSubfolders = async (folderId: string): Promise<DriveFolder[]> => {
  try {
    const drive = initializeDrive();
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
    });

    const folders = response.data.files || [];
    const subfolders: DriveFolder[] = [];

    for (const folder of folders) {
      const files = await getFilesInFolder(folder.id!);
      subfolders.push({
        id: folder.id!,
        name: folder.name!,
        files,
        subfolders: await getSubfolders(folder.id!),
      });
    }

    return subfolders;
  } catch (error) {
    console.error('Error getting subfolders:', error);
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
    const folder = await drive.files.get({
      fileId: folderId,
      fields: 'id, name',
    });

    const files = await getFilesInFolder(folderId);
    const subfolders = await getSubfolders(folderId);

    return {
      id: folder.data.id!,
      name: folder.data.name!,
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
    const categoryFolder = await findFolderByName(drive, category);
    if (!categoryFolder || !categoryFolder.id) { // Also check if categoryFolder.id is valid
      console.error(`Category folder or its ID not found for: ${category}`);
      return [];
    }

    // List all files in the category folder
    const response = await drive.files.list({
      q: `'${categoryFolder.id}' in parents and mimeType contains 'image/'`,
      fields: 'files(id, name)', // Requesting id and name
    });

    const files = response.data.files || [];
    console.log(`Found ${files.length} raw file entries in ${category}`);

    // Filter for valid files and then map
    const validImages = files
      .filter(file => file.id && file.name) // Ensure id and name are present
      .map(file => {
        // Since we filtered, file.id and file.name are guaranteed to be strings here
        const id = file.id as string;
        const name = file.name as string;
        const ext = name.split('.').pop()?.toLowerCase() || 'jpg'; // Default to jpg if no extension
        return {
          id: id,
          name: name,
          src: `/portfolio_images/${category.toLowerCase()}/${id}.${ext}`
        };
      });
    
    console.log(`Mapped ${validImages.length} valid images for ${category}`);
    return validImages;

  } catch (error) {
    console.error(`Error getting images by category ${category}:`, error);
    return [];
  }
};

// Get hero images
export const getHeroImages = async () => {
  try {
    const drive = initializeDrive();
    const heroFolderId = process.env.GOOGLE_DRIVE_HERO_FOLDER_ID;
    
    if (!heroFolderId) {
      console.error('GOOGLE_DRIVE_HERO_FOLDER_ID is not set');
      return [];
    }

    // console.log('Fetching hero images from folder:', heroFolderId); // Optional: keep for debugging
    const response = await drive.files.list({
      q: `'${heroFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name)', // Only fetch id and name
    });

    const files = response.data.files || [];
    // console.log(`Found ${files.length} hero images raw data:`, files); // Optional: keep for debugging

    return files
      .filter(file => file.id && file.name) 
      .map(file => ({
        id: file.id as string,
        name: file.name as string,
      }));
  } catch (error) {
    console.error('Error getting hero images list from Google Drive:', error);
    return [];
  }
}; 