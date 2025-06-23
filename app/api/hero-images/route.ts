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
const HERO_FOLDER_ID = process.env.GOOGLE_DRIVE_HERO_FOLDER_ID;

export async function GET() {
  if (!HERO_FOLDER_ID) {
    console.error('GOOGLE_DRIVE_HERO_FOLDER_ID is not set.');
    return NextResponse.json({ images: [], error: 'Server configuration error for hero images.' }, { status: 500 });
  }

  try {
    const imagesResponse = await drive.files.list({
      q: `'${HERO_FOLDER_ID}' in parents and mimeType contains 'image/'`,
      fields: 'files(id, name, webContentLink)',
      orderBy: 'createdTime desc',
    });

    const images = imagesResponse.data.files?.map((file, index) => ({
      id: file.id || index,
      src: file.webContentLink,
      alt: file.name || `Hero Image ${index + 1}`,
    })) || [];

    return NextResponse.json({ images });

  } catch (error) {
    console.error('[API Route] Error in hero-images GET route while fetching from Google Drive:', error);
    return NextResponse.json({ images: [], error: 'Failed to retrieve hero images from Google Drive' }, { status: 500 });
  }
} 