import { google } from 'googleapis';

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

export async function createClientFolder(username: string) {
  try {
    // Create a new folder in the client-pictures directory
    const folder = await drive.files.create({
      requestBody: {
        name: username,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [process.env.GOOGLE_DRIVE_CLIENT_FOLDER_ID!],
      },
      fields: 'id',
    });

    return folder.data.id;
  } catch (error) {
    console.error('Error creating client folder:', error);
    throw new Error('Failed to create client folder');
  }
}

export async function deleteClientFolder(folderId: string) {
  try {
    // Delete the folder and all its contents
    await drive.files.delete({
      fileId: folderId,
    });
  } catch (error) {
    console.error('Error deleting client folder:', error);
    throw new Error('Failed to delete client folder');
  }
}

export async function getClientFolderId(username: string) {
  try {
    const response = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_CLIENT_FOLDER_ID}' in parents and name = '${username}' and mimeType = 'application/vnd.google-apps.folder'`,
      fields: 'files(id)',
    });

    return response.data.files?.[0]?.id;
  } catch (error) {
    console.error('Error getting client folder:', error);
    throw new Error('Failed to get client folder');
  }
}

export async function renameClientFolder(folderId: string, newName: string) {
  try {
    // Update the folder name
    await drive.files.update({
      fileId: folderId,
      requestBody: {
        name: newName,
      },
    });
  } catch (error) {
    console.error('Error renaming client folder:', error);
    throw new Error('Failed to rename client folder');
  }
} 