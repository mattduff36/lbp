import { NextResponse } from 'next/server';
import { syncHeroImages } from '@/app/services/syncHeroImages';

// This should match the CRON_SECRET environment variable in Vercel
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  console.log('[CRON_JOB_HERO] /api/cron/sync-hero - Request received.');
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    console.warn('[CRON_JOB_HERO] Unauthorized attempt. Secret mismatch.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON_JOB_HERO] Authorized. Starting hero images sync process.');
  const startTime = Date.now();

  try {
    const success = await syncHeroImages(); // syncHeroImages internally logs its progress and errors
    const durationMs = Date.now() - startTime;

    if (success) {
      console.log(`[CRON_JOB_HERO] Hero images sync completed successfully. Duration: ${durationMs}ms`);
      return NextResponse.json({ message: 'Hero images sync completed successfully' });
    } else {
      console.error(`[CRON_JOB_HERO] Hero images sync failed or was skipped (e.g., cooldown, internal error, or no changes needed). Duration: ${durationMs}ms. Check service logs for details.`);
      // Return 200 to Vercel Cron if the job itself executed, even if the sync operation had issues or was skipped.
      // The detailed success/failure is in the logs.
      return NextResponse.json(
        { message: 'Hero images sync process executed; outcome logged (may be skipped or failed).' },
        { status: 200 } 
      );
    }
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[CRON_JOB_HERO] Critical error during hero images sync execution. Duration: ${durationMs}ms. Error: ${error.message}`, error);
    return NextResponse.json(
      { error: 'Internal server error during hero images sync execution' },
      { status: 500 }
    );
  }
} 