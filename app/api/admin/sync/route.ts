import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Simple admin verification (you might want to enhance this)
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  try {
    // Check if admin session exists by trying to access admin clients endpoint
    const adminCheck = await fetch(`${request.nextUrl.origin}/api/admin/clients`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
    return adminCheck.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Verify admin access
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, target } = await request.json();

    switch (type) {
      case 'hero':
        // Revalidate hero images
        revalidatePath('/', 'page');
        return NextResponse.json({ 
          success: true, 
          message: 'Hero images cache cleared successfully',
          timestamp: new Date().toISOString()
        });

      case 'portfolio':
        // Revalidate all portfolio pages
        const portfolioCategories = [
          'wedding', 'portrait', 'lifestyle', 'landscape', 
          'wildlife', 'sport', 'baby', 'family', 'pets'
        ];
        
        portfolioCategories.forEach(category => {
          revalidatePath(`/portfolio/${category}`, 'page');
        });
        
        // Also revalidate the main portfolio page
        revalidatePath('/portfolio', 'page');
        
        return NextResponse.json({ 
          success: true, 
          message: `Portfolio cache cleared for ${portfolioCategories.length} categories`,
          categories: portfolioCategories,
          timestamp: new Date().toISOString()
        });

      case 'client':
        if (!target) {
          return NextResponse.json({ error: 'Client username required' }, { status: 400 });
        }
        
        // Revalidate specific client page
        revalidatePath(`/client-login/${target}`, 'page');
        
        return NextResponse.json({ 
          success: true, 
          message: `Client gallery cache cleared for ${target}`,
          client: target,
          timestamp: new Date().toISOString()
        });

      case 'all':
        // Clear all caches
        revalidatePath('/', 'layout'); // This will revalidate everything
        
        return NextResponse.json({ 
          success: true, 
          message: 'All caches cleared successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid sync type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to perform sync operation' },
      { status: 500 }
    );
  }
}
