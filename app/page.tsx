import ClientHero from './components/ClientHero';
import AnimatedPortfolio from './components/AnimatedPortfolio';
// import fs from 'fs'; // No longer needed for getPreviewImageSrc
import path from 'path'; // Still potentially needed if other parts use it, but not for getPreviewImageSrc
import { list } from '@vercel/blob'; // Added for Vercel Blob Storage

const galleries = [
  { name: 'Wedding', path: '/portfolio/wedding', localDir: 'wedding' },
  { name: 'Portrait', path: '/portfolio/portrait', localDir: 'portrait' },
  { name: 'Lifestyle', path: '/portfolio/lifestyle', localDir: 'lifestyle' },
  { name: 'Landscape', path: '/portfolio/landscape', localDir: 'landscape' },
  { name: 'Animals', path: '/portfolio/animals', localDir: 'animals' },
  { name: 'Sport', path: '/portfolio/sport', localDir: 'sport' },
];

const getPreviewImageSrc = async (categoryDir: string): Promise<string | null> => {
  const pathnamePrefix = `portfolio_images/${categoryDir.toLowerCase()}/`;
  try {
    console.log(`Fetching from Blob Storage with prefix: ${pathnamePrefix}`);
    console.log(`Using BLOB_READ_WRITE_TOKEN: ${process.env.BLOB_READ_WRITE_TOKEN ? 'Token Loaded' : 'Token NOT Loaded or Empty'}`);
    const { blobs } = await list({
      prefix: pathnamePrefix,
      token: process.env.BLOB_READ_WRITE_TOKEN, // Ensure this token is available server-side
    });
    console.log(`Blobs received for ${pathnamePrefix}:`, blobs);

    if (!blobs || blobs.length === 0) {
      console.warn(`No blobs found in Vercel Blob Storage for prefix: ${pathnamePrefix}`);
      return null;
    }

    const imageFiles = blobs.filter(blob =>
      /\.(jpe?g|png|gif|webp)$/i.test(blob.pathname)
    );

    console.log(`Image files filtered for ${pathnamePrefix}:`, imageFiles);

    if (imageFiles.length > 0) {
      const randomIndex = Math.floor(Math.random() * imageFiles.length);
      const randomImage = imageFiles[randomIndex];
      console.log(`Selected random image for ${pathnamePrefix}: ${randomImage.url}`);
      return randomImage.url;
    }
    console.warn(`No image files found in Vercel Blob Storage for prefix: ${pathnamePrefix} after filtering`);
    return null;
  } catch (error) {
    console.error(`Error fetching preview image from Vercel Blob Storage for category ${categoryDir}:`, error);
    return null;
  }
};

export default async function Home() {
  const galleriesWithPreviewsPromises = galleries.map(async (gallery) => ({
    ...gallery,
    previewImageSrc: await getPreviewImageSrc(gallery.localDir),
  }));

  const galleriesWithPreviews = await Promise.all(galleriesWithPreviewsPromises);
  console.log("Galleries with previews for Home page:", galleriesWithPreviews);

  return (
    <div className="flex flex-col items-stretch min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      <ClientHero />
      <AnimatedPortfolio galleries={galleriesWithPreviews} />
    </div>
  );
} 