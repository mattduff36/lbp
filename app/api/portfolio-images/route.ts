import { syncPortfolio, getLocalPortfolioImages } from '@/app/services/syncPortfolio';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = searchParams.get('limit');
  const performSync = searchParams.get('performSync');

  const headers = {
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
  };

  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400, headers });
  }

  const categoryLower = category.toLowerCase();

  try {
    // Get local images first
    let images = await getLocalPortfolioImages(categoryLower);
    console.log(`API route: Fetched ${images.length} local images for category ${categoryLower}.`);

    // If sync is requested, trigger it in the background
    if (performSync === 'true') {
      console.log(`API route: Request for category: ${categoryLower} WITH performSync=true. Triggering sync in background.`);
      // No await here - let it run in the background
      syncPortfolio(categoryLower).then(() => {
        console.log(`API route: Background sync attempt for category ${categoryLower} completed or skipped.`);
      }).catch(error => {
        console.error(`API route: Background sync for category ${categoryLower} failed:`, error);
      });
    } else {
      console.log(`API route: Request for category: ${categoryLower} WITHOUT performSync=true. Skipping sync trigger.`);
    }
    
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (isNaN(limitNum)) {
        return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400, headers });
      }
      return NextResponse.json(images.slice(0, limitNum), { headers });
    }

    return NextResponse.json(images, { headers });
  } catch (error) {
    console.error(`API route: Error processing request for category ${categoryLower}:`, error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500, headers });
  }
} 