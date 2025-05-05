import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const galleryImagesDir = path.join(process.cwd(), 'public', 'gallery_images');
    const files = fs.readdirSync(galleryImagesDir);
    
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map((file, index) => ({
        id: `image-${index}`,
        src: `/gallery_images/${file}`,
        alt: `Gallery image ${index + 1}`
      }));

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error reading gallery images:', error);
    return NextResponse.json({ error: 'Failed to read gallery images' }, { status: 500 });
  }
} 