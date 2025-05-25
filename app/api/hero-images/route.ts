import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { syncHeroImages } from '@/app/services/syncHeroImages';

export async function GET() {
  // Trigger sync in the background - fire and forget
  syncHeroImages().catch(error => {
    // Log errors from the background sync, but don't let it block the response
    console.error('Background hero image sync failed:', error);
  });

  try {
    const heroImagesDir = path.join(process.cwd(), 'public', 'hero_images');
    // Ensure directory exists before trying to read it, especially if sync hasn't run yet
    if (!fs.existsSync(heroImagesDir)) {
      fs.mkdirSync(heroImagesDir, { recursive: true });
      console.log('Hero images directory created as it did not exist.');
      return NextResponse.json({ images: [] }); // Return empty if dir was just created
    }

    const files = fs.readdirSync(heroImagesDir);
    
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map((file, index) => ({
        id: index,
        src: `/hero_images/${file}`,
        alt: `Hero background ${index + 1}`
      }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error reading hero images:', error);
    // If directory doesn't exist or other read error, return empty array gracefully
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn('Hero images directory not found during GET request. Returning empty array.');
        return NextResponse.json({ images: [] });
    }
    return NextResponse.json({ error: 'Failed to read hero images' }, { status: 500 });
  }
} 