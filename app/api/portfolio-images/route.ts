import { getImagesByCategory } from '@/app/services/googleDrive';
import { syncPortfolio } from '@/app/services/syncPortfolio';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = searchParams.get('limit');
  const performSync = searchParams.get('performSync');

  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }

  const categoryLower = category.toLowerCase();

  try {
    if (performSync === 'true') {
      console.log(`API route: Request received for category: ${categoryLower} WITH performSync=true. Triggering sync.`);
      await syncPortfolio(categoryLower);
      console.log(`API route: Sync attempt for category ${categoryLower} completed or skipped.`);
    } else {
      console.log(`API route: Request received for category: ${categoryLower} WITHOUT performSync=true. Skipping sync.`);
    }

    const images = await getImagesByCategory(categoryLower);
    console.log(`API route: Fetched ${images.length} images for category ${categoryLower}.`);
    
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (isNaN(limitNum)) {
        return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
      }
      return NextResponse.json(images.slice(0, limitNum));
    }

    return NextResponse.json(images);
  } catch (error) {
    console.error(`API route: Error processing request for category ${categoryLower}:`, error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
} 