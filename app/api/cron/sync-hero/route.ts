import { NextResponse } from 'next/server';
import { syncHeroImages } from '@/app/services/syncHeroImages';

// This should match the CRON_SECRET environment variable in Vercel
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    console.warn('Cron job: Unauthorized attempt to sync hero images.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Cron job: Authorized. Starting hero images sync.');

  try {
    const success = await syncHeroImages();
    if (success) {
      console.log('Cron job: Hero images sync completed successfully.');
      return NextResponse.json({ message: 'Hero images sync completed successfully' });
    } else {
      console.error('Cron job: Hero images sync failed or was skipped (e.g., cooldown or already in progress).');
      return NextResponse.json(
        { error: 'Hero images sync failed or was skipped' },
        { status: 200 } // Return 200 even if skipped by cooldown, as the cron itself ran ok.
      );
    }
  } catch (error) {
    console.error('Cron job: Error during hero images sync:', error);
    return NextResponse.json(
      { error: 'Internal server error during hero images sync' },
      { status: 500 }
    );
  }
} 