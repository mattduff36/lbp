import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import JSZip from 'jszip';
// import fetch from 'node-fetch'; // No longer needed
import { prisma } from '../../../lib/prisma'; // Adjusted path for Prisma client

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  // drive.file scope might be needed if creating/modifying files, but readonly is fine for downloads
  scopes: ['https://www.googleapis.com/auth/drive.readonly'], 
});

const drive = google.drive({ version: 'v3', auth });

export async function GET(request: Request) {
  console.log('[Download API] Received GET request');
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    console.log(`[Download API] Username: ${username}`);

    if (!username) {
      console.log('[Download API] Username is required, returning 400');
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Find the client in the database to get their specific folderId
    const client = await prisma.client.findUnique({
      where: { username },
      select: { folderId: true },
    });
    console.log(`[Download API] Client data from DB: ${JSON.stringify(client)}`);

    if (!client || !client.folderId) {
      console.warn(`[Download API] Client or folderId not found for username: ${username}.`);
      return NextResponse.json({ error: 'Client folder not configured or client not found' }, { status: 404 });
    }
    console.log(`[Download API] Using folderId: ${client.folderId} for Google Drive query.`);

    // Get all image files from the client's specific folder
    const imagesResponse = await drive.files.list({
      q: `'${client.folderId}' in parents and mimeType contains 'image/'`, // Use client.folderId
      fields: 'files(id, name)', // Only need id and name for direct download
      pageSize: 1000, // Ensure we get all images for download
    });
    console.log('[Download API] Files listed from Drive:', JSON.stringify(imagesResponse.data.files));

    const filesToZip = imagesResponse.data.files || [];
    if (filesToZip.length === 0) {
      console.log('[Download API] No images found in folder to zip.');
      return NextResponse.json({ error: 'No images found to download' }, { status: 404 });
    }

    const zip = new JSZip();

    // Download each image directly using its fileId and add it to the zip
    await Promise.all(
      filesToZip.map(async (file) => {
        if (!file.id || !file.name) {
          console.warn('[Download API] File with missing ID or name skipped:', file);
          return; // Skip if no ID or name
        }
        try {
          console.log(`[Download API] Attempting to download fileId: ${file.id}, name: ${file.name}`);
          const fileResponse = await drive.files.get(
            { fileId: file.id, alt: 'media' },
            { responseType: 'arraybuffer' } // Fetch as ArrayBuffer
          );
          console.log(`[Download API] Successfully fetched fileId: ${file.id}`);
          // The type for fileResponse.data with arraybuffer should be ArrayBuffer
          zip.file(file.name, fileResponse.data as ArrayBuffer);
        } catch (error) {
          console.error(`[Download API] Error downloading individual file ${file.name} (ID: ${file.id}):`, error);
          // Optionally, decide if one failed download should stop the whole zip process
          // For now, it just logs and continues with other files
        }
      })
    );
    
    // Check if zip is empty (e.g. if all individual downloads failed)
    if (Object.keys(zip.files).length === 0) {
        console.log('[Download API] Zip is empty, possibly all individual file downloads failed.');
        return NextResponse.json({ error: 'Failed to download any files for zipping.' }, { status: 500 });
    }

    console.log('[Download API] Generating zip file...');
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    console.log('[Download API] Zip file generated, sending response.');

    return new NextResponse(zipBuffer, {
      status: 200, // Ensure status 200 for successful download
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${username}-gallery.zip"`,
      },
    });

  } catch (error) {
    console.error('[Download API] Error generating or downloading gallery zip:', error);
    return NextResponse.json(
      { error: 'Failed to download gallery zip. Please check server logs.' },
      { status: 500 }
    );
  }
} 