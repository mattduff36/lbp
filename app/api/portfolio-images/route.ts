import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });
const PORTFOLIO_ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = searchParams.get('limit');

  const headers = {
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
  };

  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400, headers });
  }

  if (!PORTFOLIO_ROOT_FOLDER_ID) {
    console.error('GOOGLE_DRIVE_FOLDER_ID is not set.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500, headers });
  }

  try {
    const categoryLower = category.toLowerCase();

    // Find the specific category subfolder within the main portfolio folder
    const folderResponse = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${categoryLower}' and '${PORTFOLIO_ROOT_FOLDER_ID}' in parents`,
      fields: 'files(id, name)',
      pageSize: 1,
    });

    const categoryFolder = folderResponse.data.files?.[0];

    if (!categoryFolder || !categoryFolder.id) {
      console.warn(`[Portfolio Images API] Category folder '${category}' not found in Google Drive.`);
      return NextResponse.json([], { headers }); // Return empty array if category folder doesn't exist
    }

    // Get all images from the category's folder
    const imagesResponse = await drive.files.list({
      q: `'${categoryFolder.id}' in parents and mimeType contains 'image/'`,
      fields: 'files(id, name, webContentLink, thumbnailLink)',
      orderBy: 'createdTime desc',
      pageSize: limit ? parseInt(limit, 10) : 1000, // Default to 1000 if no limit
    });
    
    const images = imagesResponse.data.files?.map((file, index) => ({
      id: file.id || `${index + 1}`,
      name: file.name || 'Untitled Image',
      src: file.webContentLink,
      thumbnail: file.thumbnailLink,
      width: 800, // Default width
      height: 600, // Default height
    })) || [];

    return NextResponse.json(images, { headers });
  } catch (error) {
    console.error(`API route: Error processing request for category ${category}:`, error);
    return NextResponse.json({ error: 'Failed to fetch images from Google Drive' }, { status: 500, headers });
  }
} 