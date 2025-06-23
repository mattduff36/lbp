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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  try {
    const file = await drive.files.get({
      fileId,
      fields: 'webContentLink, name',
    });

    const downloadUrl = file.data.webContentLink;

    if (downloadUrl) {
      // We can't just redirect, as the browser will likely block it.
      // Instead, we fetch the content on the server and stream it back to the client.
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from Google Drive. Status: ${response.status}`);
      }
      
      const headers = new Headers();
      headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${file.data.name || 'download'}"`);
      
      return new NextResponse(response.body, { headers });
    }

    return NextResponse.json({ error: 'Download link not found' }, { status: 404 });

  } catch (error) {
    console.error(`Error downloading file ${fileId}:`, error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
} 