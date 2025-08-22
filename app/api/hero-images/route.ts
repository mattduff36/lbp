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

// Fallback local hero images
const fallbackImages = [
  { id: 'local-1', src: '/hero_images/1.jpg', alt: 'Hero Image 1' },
  { id: 'local-4', src: '/hero_images/4.jpg', alt: 'Hero Image 4' },
  { id: 'local-5', src: '/hero_images/5.jpg', alt: 'Hero Image 5' },
];

export async function GET() {
  if (!HERO_FOLDER_ID) {
    console.error('GOOGLE_DRIVE_HERO_FOLDER_ID is not set.');
    return NextResponse.json({ images: fallbackImages }, { status: 200 });
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

    console.log(`[HERO IMAGES DEBUG] Found ${images.length} images in Google Drive:`, images.map(img => img.alt));

    // Always use Google Drive images if available, regardless of count
    if (images.length > 0) {
      console.log(`[HERO IMAGES DEBUG] Using ${images.length} images from Google Drive`);
      return NextResponse.json({ images, source: 'google-drive' });
    }

    // Only use fallback if no images found in Google Drive
    console.log(`[HERO IMAGES DEBUG] No images found in Google Drive, using fallback images`);
    return NextResponse.json({ images: fallbackImages, source: 'fallback' });

  } catch (error) {
    console.error('[API Route] Error in hero-images GET route while fetching from Google Drive:', error);
    return NextResponse.json({ images: fallbackImages }, { status: 200 });
  }
} 