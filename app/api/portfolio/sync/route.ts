import { syncPortfolio } from '@/app/services/syncPortfolio';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const success = await syncPortfolio();
    if (success) {
      return NextResponse.json({ message: 'Portfolio sync completed successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to sync portfolio' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in sync route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 