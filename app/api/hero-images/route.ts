import { NextResponse } from 'next/server';
import { syncHeroImages } from '@/app/services/syncHeroImages';
import { listBlobFiles } from '@/app/services/blobStorage'; // Import for Vercel Blob
import type { HeroImage } from '@/app/components/types'; // Assuming HeroImage type is defined here

const HERO_BLOB_PREFIX = 'hero_images/';

export async function GET() {
  // Trigger sync in the background - fire and forget.
  // This allows the API to respond quickly with what's currently in the blob,
  // while the sync happens separately if needed.
  syncHeroImages().catch(error => {
    console.error('Background hero image sync with Vercel Blob failed:', error);
  });

  try {
    // console.log(`[API Route] Attempting to list blobs with prefix: ${HERO_BLOB_PREFIX}`);
    const listResult = await listBlobFiles(HERO_BLOB_PREFIX);
    // console.log('[API Route] Raw listResult from listBlobFiles:', JSON.stringify(listResult, null, 2));

    // listResult is directly the array of blob objects.
    const blobs = listResult; // Changed from listResult?.blobs

    if (!blobs || blobs.length === 0) {
      console.log('[API Route] No blobs found or blobs array is empty. API will return empty images array.');
      return NextResponse.json({ images: [] });
    }
    // console.log(`[API Route] Found ${blobs.length} blobs after filtering.`);

    const images: HeroImage[] = blobs
      .filter(blob => blob.pathname && /\.(jpg|jpeg|png|gif|webp)$/i.test(blob.pathname))
      .map((blob, index) => ({
        id: index, 
        src: blob.url, 
        alt: blob.pathname.substring(HERO_BLOB_PREFIX.length) || `Hero Image ${index + 1}`,
      }));
    
    // console.log(`[API Route] Mapped to ${images.length} hero images.`);
    return NextResponse.json({ images });

  } catch (error) {
    console.error('[API Route] Error in hero-images GET route while listing blobs:', error);
    return NextResponse.json({ images: [], error: 'Failed to retrieve hero images' }, { status: 500 });
  }
} 