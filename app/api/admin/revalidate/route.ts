import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    // Revalidate all main pages
    revalidatePath('/');
    revalidatePath('/portfolio/[category]', 'page');
    revalidatePath('/client-login/[username]', 'page');
    
    console.log('[ADMIN] Cache revalidation triggered');
    
    return NextResponse.json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ADMIN] Error during cache revalidation:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' }, 
      { status: 500 }
    );
  }
}
