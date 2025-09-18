import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/app/lib/prisma';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    // 1. Check database for client
    const client = await prisma.client.findUnique({
      where: { username },
      select: { id: true, username: true, folderId: true, createdAt: true },
    });

    if (!client) {
      return NextResponse.json({ 
        error: 'Client not found in database',
        username,
        suggestions: ['Check if username is correct', 'Client may need to be created in admin panel']
      }, { status: 404 });
    }

    // 2. Check if folderId exists
    if (!client.folderId) {
      return NextResponse.json({
        client,
        error: 'Client exists but has no folderId',
        suggestions: ['Update client in admin panel to create Google Drive folder']
      });
    }

    // 3. Check if Google Drive folder exists and is accessible
    let folderExists = false;
    let folderName = '';
    try {
      const folderResponse = await drive.files.get({
        fileId: client.folderId,
        fields: 'id, name, parents',
      });
      folderExists = true;
      folderName = folderResponse.data.name || '';
    } catch (driveError) {
      return NextResponse.json({
        client,
        error: 'Google Drive folder not accessible',
        driveError: driveError instanceof Error ? driveError.message : 'Unknown error',
        suggestions: [
          'Check if folder was deleted from Google Drive',
          'Verify service account permissions',
          'Update client with new folderId'
        ]
      });
    }

    // 4. List all files in the folder
    const imagesResponse = await drive.files.list({
      q: `'${client.folderId}' in parents and mimeType contains 'image/'`,
      fields: 'files(id, name, webContentLink, thumbnailLink, createdTime, modifiedTime)',
      orderBy: 'name asc',
      pageSize: 1000,
    });

    const images = imagesResponse.data.files || [];
    
    // 5. Look for specific missing images
    const missingImages = [];
    for (let i = 1; i <= 8; i++) {
      const imageName = `pole small-${i.toString().padStart(3, '0')}`;
      const found = images.find(img => img.name?.toLowerCase().includes(imageName.toLowerCase()));
      if (!found) {
        missingImages.push(imageName);
      }
    }

    // 6. Check for similar named files
    const poleImages = images.filter(img => 
      img.name?.toLowerCase().includes('pole')
    );

    return NextResponse.json({
      client,
      folder: {
        exists: folderExists,
        name: folderName,
        id: client.folderId,
      },
      images: {
        total: images.length,
        poleRelated: poleImages.length,
        missingSpecific: missingImages,
        allPoleImages: poleImages.map(img => ({
          name: img.name,
          id: img.id,
          created: img.createdTime,
          modified: img.modifiedTime,
        })),
        allImages: images.map(img => img.name).sort(),
      },
      debug: {
        timestamp: new Date().toISOString(),
        query: `'${client.folderId}' in parents and mimeType contains 'image/'`,
      }
    });

  } catch (error) {
    console.error('Debug client error:', error);
    return NextResponse.json({
      error: 'Failed to debug client',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
