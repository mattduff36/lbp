import { NextResponse } from 'next/server';
import { syncPortfolio } from '@/app/services/syncPortfolio';
import { GALLERIES } from '@/app/config/galleries';

// This should match the CRON_SECRET environment variable in Vercel
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    console.warn('Cron job: Unauthorized attempt to sync all portfolio images.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Cron job: Authorized. Starting sync for all portfolio categories.');

  try {
    const syncPromises = GALLERIES.map(gallery => {
      console.log(`Cron job: Triggering sync for category: ${gallery.localDir}`);
      // We want these to run, but not necessarily block the response entirely if one fails.
      // The individual syncPortfolio calls have their own logging.
      return syncPortfolio(gallery.localDir)
        .then(() => {
          console.log(`Cron job: Sync completed for category: ${gallery.localDir}`);
          return { category: gallery.localDir, status: 'success' };
        })
        .catch(error => {
          console.error(`Cron job: Sync failed for category: ${gallery.localDir}`, error);
          return { category: gallery.localDir, status: 'failed', error: error.message };
        });
    });

    // Optionally, wait for all to settle if you want to report detailed status
    // For a cron job, it might be enough to just fire them off.
    // const results = await Promise.allSettled(syncPromises);
    // console.log("Cron job: All sync tasks settled.", results);

    // For simplicity, we fire and forget here. The logs will show individual statuses.
    Promise.allSettled(syncPromises).then(results => {
        console.log("Cron job: All sync tasks have been initiated and settled (or are running).", results);
    });

    return NextResponse.json({ message: 'Sync triggered for all categories.', triggered_categories: GALLERIES.map(g => g.localDir) });
  } catch (error) {
    console.error('Cron job: Error triggering sync for all categories:', error);
    return NextResponse.json({ error: 'Failed to trigger sync for all categories' }, { status: 500 });
  }
} 