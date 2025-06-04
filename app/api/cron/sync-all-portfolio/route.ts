import { NextResponse } from 'next/server';
import { syncPortfolio } from '@/app/services/syncPortfolio';
import { GALLERIES } from '@/app/config/galleries';

// This should match the CRON_SECRET environment variable in Vercel
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  console.log('[CRON_JOB_PORTFOLIO] /api/cron/sync-all-portfolio - Request received.');
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    console.warn('[CRON_JOB_PORTFOLIO] Unauthorized attempt. Secret mismatch.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON_JOB_PORTFOLIO] Authorized. Starting sync for all portfolio categories.');
  const startTime = Date.now();
  let allSucceeded = true;
  const individualResults: Array<{ category: string; status: string; reason?: string }> = [];

  try {
    const syncPromises = GALLERIES.map(gallery => {
      console.log(`[CRON_JOB_PORTFOLIO] Triggering sync for category: ${gallery.localDir}`);
      return syncPortfolio(gallery.localDir) // This now handles its own category-specific lock and cooldown
        .then((success) => {
          const message = `[CRON_JOB_PORTFOLIO] Sync attempt for category: ${gallery.localDir} ${success ? 'completed successfully or was not needed.' : 'failed or was skipped (cooldown/lock/error).'.toUpperCase()}`; 
          if (success) {
            console.log(message);
            return { category: gallery.localDir, status: 'success' };
          } else {
            console.warn(message); // Log as warning if skipped or failed for attention
            allSucceeded = false;
            return { category: gallery.localDir, status: 'failed_or_skipped', reason: 'See service logs for syncPortfolio' };
          }
        })
        .catch(error => {
          allSucceeded = false;
          console.error(`[CRON_JOB_PORTFOLIO] Critical error during syncPortfolio call for category: ${gallery.localDir}`, error);
          return { category: gallery.localDir, status: 'error', reason: error.message };
        });
    });

    const settledResults = await Promise.allSettled(syncPromises);
    console.log('[CRON_JOB_PORTFOLIO] All sync tasks initiated. Processing settlement results...');

    settledResults.forEach(result => {
      if (result.status === 'fulfilled') {
        individualResults.push(result.value);
        if (result.value.status !== 'success') {
          allSucceeded = false; // Ensure allSucceeded reflects actual outcomes
        }
      } else {
        // This case should ideally be caught by the .catch within the map if syncPortfolio rejects unexpectedly
        allSucceeded = false;
        const reason = result.reason?.message || 'Unknown error during Promise.allSettled';
        console.error('[CRON_JOB_PORTFOLIO] A sync promise was rejected unexpectedly:', reason, result.reason);
        // Try to find which category it was if possible, though it might be hard here if the error was before category context was established in the promise
        individualResults.push({ category: 'unknown_due_to_rejection', status: 'error', reason });
      }
    });

    const durationMs = Date.now() - startTime;
    if (allSucceeded) {
      console.log(`[CRON_JOB_PORTFOLIO] All portfolio categories synced successfully or were up-to-date. Duration: ${durationMs}ms. Results:`, JSON.stringify(individualResults, null, 2));
      return NextResponse.json({ message: 'All portfolio categories synced successfully or were up-to-date.', results: individualResults });
    } else {
      console.warn(`[CRON_JOB_PORTFOLIO] Some portfolio categories failed to sync, were skipped, or encountered errors. Duration: ${durationMs}ms. Results:`, JSON.stringify(individualResults, null, 2));
      // Return 200 to Vercel Cron as the job itself executed, but log the partial failure.
      return NextResponse.json({ message: 'Portfolio sync process executed; some categories may have failed or been skipped. Check logs.', results: individualResults }, { status: 200 });
    }

  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[CRON_JOB_PORTFOLIO] Critical error during main execution block for sync-all-portfolio. Duration: ${durationMs}ms. Error: ${error.message}`, error);
    individualResults.push({ category: 'overall_process', status: 'critical_error', reason: error.message });
    return NextResponse.json({ error: 'Failed to trigger sync for all categories due to a critical error', details: individualResults }, { status: 500 });
  }
} 