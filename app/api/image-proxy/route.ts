import { NextRequest, NextResponse } from 'next/server';
import { withImageMonitoring } from '@/app/lib/imageMonitoring';

async function handleImageProxy(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const width = searchParams.get('w');
  const quality = searchParams.get('q') || '75';

  if (!imageUrl) {
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
  }

  // Validate that it's a Google Drive URL for security
  if (!imageUrl.includes('drive.google.com')) {
    return NextResponse.json({ error: 'Only Google Drive URLs are allowed' }, { status: 400 });
  }

  try {
    // Fetch the image from Google Drive
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Vercel-Image-Proxy/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Set aggressive caching headers for the proxied image
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'CDN-Cache-Control': 'public, max-age=31536000, immutable',
      'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
    });

    return new NextResponse(imageBuffer, { headers });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' }, 
      { status: 500 }
    );
  }
}

export const GET = withImageMonitoring(handleImageProxy, 'proxy');
