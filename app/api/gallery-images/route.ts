import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = searchParams.get('limit');

  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }

  try {
    const galleryPath = path.join(process.cwd(), 'public/portfolio_images', category);
    console.log('Looking for images in:', galleryPath);
    
    if (!fs.existsSync(galleryPath)) {
      console.error('Gallery path does not exist:', galleryPath);
      return NextResponse.json({ images: [] }, { status: 404 });
    }

    const files = fs.readdirSync(galleryPath);
    console.log('Found files:', files);
    
    // Filter for image files and map to full paths
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map(file => ({
        src: `/portfolio_images/${category}/${file}`,
        alt: `${category} - ${file}`
      }))
      .slice(0, limit ? parseInt(limit) : undefined);

    console.log('Returning images:', images);
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error reading gallery directory:', error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
} 