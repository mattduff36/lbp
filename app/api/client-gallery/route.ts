import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '../../lib/prisma'; // Corrected path for Prisma client

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

export async function GET(request: Request) {
  console.log('[Client Gallery API] Received GET request'); // Log request received
  
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const limit = searchParams.get('limit');
  const forceRefresh = searchParams.get('refresh');
  
  // Override caching if refresh parameter is present
  const headers: Record<string, string> = forceRefresh ? {
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
    'X-Force-Refresh': 'true',
  } : {
    'Cache-Control': 'public, max-age=900, s-maxage=1800, stale-while-revalidate=86400',
  };

  try {
    console.log(`[Client Gallery API] Username: ${username}, Force Refresh: ${forceRefresh}`); // Log username

    if (!username) {
      console.log('[Client Gallery API] Username is required, returning 400');
      return NextResponse.json({ error: 'Username is required' }, { status: 400, headers });
    }

    // Find the client in the database to get their specific folderId
    const client = await prisma.client.findUnique({
      where: { username },
      select: { folderId: true },
    });
    console.log(`[Client Gallery API] Client data from DB: ${JSON.stringify(client)}`); // Log client data

    if (!client || !client.folderId) {
      console.warn(`[Client Gallery API] Client or folderId not found for username: ${username}. Returning empty images array.`);
      return NextResponse.json({ images: [] }, { headers });
    }
    console.log(`[Client Gallery API] Using folderId: ${client.folderId} for Google Drive query.`); // Log folderId used

    // Get all images from the client's specific folder
    const imagesResponse = await drive.files.list({
      q: `'${client.folderId}' in parents and mimeType contains 'image/'`, 
      fields: 'files(id, name, webContentLink, thumbnailLink)',
      orderBy: 'name asc',
      pageSize: limit ? parseInt(limit, 10) : 1000, // Default to 1000 if no limit
    });
    console.log('[Client Gallery API] Raw response from Google Drive files.list:', JSON.stringify(imagesResponse.data, null, 2)); // Log raw Drive response

    const images = imagesResponse.data.files?.map((file, index) => ({
      id: file.id || `${index + 1}`,
      name: file.name || 'Untitled Image',
      src: file.webContentLink, 
      thumbnail: file.thumbnailLink,
      width: 800, 
      height: 600,
    })) || [];
    console.log('[Client Gallery API] Mapped images being sent to client:', JSON.stringify(images, null, 2)); // Log mapped images

    return NextResponse.json({ images }, { headers });
  } catch (error) {
    console.error('[Client Gallery API] Error fetching client gallery:', error); 
    if (error instanceof Error && error.message.includes('Prisma')) {
        console.error('[Client Gallery API] Prisma error detail:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch gallery. Please check server logs.' }, 
      { status: 500, headers }
    );
  }
} 