import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  
  try {
    // Clear the client token cookie
    cookieStore.delete('client_token');
    
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during client logout:', error);
    // Even if there's an error, we can still try to tell the client to clear their side
    return NextResponse.json({ success: false, message: 'Logout failed. Please clear your cookies.' }, { status: 500 });
  }
} 