import { NextResponse } from 'next/server';
import { syncHeroImages } from '@/app/services/syncHeroImages';
import { listBlobFiles } from '@/app/services/blobStorage'; // Import for Vercel Blob
import type { HeroImage } from '@/app/components/types'; // Assuming HeroImage type is defined here

const HERO_BLOB_PREFIX = 'hero_images/';

export async function GET() {
  // Trigger sync in the background - fire and forget
  // This will now sync with Vercel Blob
  syncHeroImages().catch(error => {
    console.error('Background hero image sync with Vercel Blob failed:', error);
  });

  try {
    const { blobs } = await listBlobFiles(HERO_BLOB_PREFIX);

    if (!blobs || blobs.length === 0) {
      console.log('No hero images found in Vercel Blob.');
      return NextResponse.json({ images: [] });
    }

    const images: HeroImage[] = blobs
      .filter(blob => blob.pathname && /\.(jpg|jpeg|png|gif|webp)$/i.test(blob.pathname))
      .map((blob, index) => ({
        // Use a simple index for ID, or derive from blob.pathname if a more persistent ID is needed
        // For client-side keying, index should be okay if order is stable or not critical.
        // If blobs are not guaranteed to be listed in a consistent order, 
        // a more stable ID (e.g., derived from pathname) might be better.
        id: index, 
        src: blob.url, // Use the Vercel Blob URL
        alt: `Hero background ${index + 1}`,
        // name: blob.pathname.split('/').pop() || 'hero-image', // Optionally include name
      }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error reading hero images from Vercel Blob:', error);
    return NextResponse.json({ error: 'Failed to read hero images' }, { status: 500 });
  }
} 