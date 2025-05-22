import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    
    const portfolioImagesDir = path.join(process.cwd(), 'public', 'portfolio_images', category);
    const files = fs.readdirSync(portfolioImagesDir);
    
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map((file, index) => ({
        id: `image-${index}`,
        src: `/portfolio_images/${category}/${file}`,
        alt: `${category} image ${index + 1}`
      }));

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error reading portfolio images:', error);
    return NextResponse.json({ error: 'Failed to read portfolio images' }, { status: 500 });
  }
} 