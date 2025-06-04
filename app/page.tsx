import ClientHero from './components/ClientHero';
import AnimatedPortfolio from './components/AnimatedPortfolio';
// import fs from 'fs'; // No longer needed for getPreviewImageSrc
import path from 'path'; // Still potentially needed if other parts use it, but not for getPreviewImageSrc
import { list } from '@vercel/blob'; // Added for Vercel Blob Storage
import { GALLERIES } from '@/app/config/galleries'; // Import shared config
import { triggerAllPortfolioGalleriesSync, triggerAllHeroImagesSync } from '@/app/actions/siteSyncActions'; // Added import

// const galleries = [...] // This is now imported

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
  // --- Temporary Sync Trigger --- 
  /*
  console.log('[TEMP SYNC] Attempting to trigger all portfolio galleries sync...');
  try {
    const portfolioSyncResult = await triggerAllPortfolioGalleriesSync();
    console.log('[TEMP SYNC] Portfolio galleries sync result:', portfolioSyncResult);
  } catch (error) {
    console.error('[TEMP SYNC] Error triggering portfolio galleries sync:', error);
  }

  console.log('[TEMP SYNC] Attempting to trigger all hero images sync...');
  try {
    const heroSyncResult = await triggerAllHeroImagesSync();
    console.log('[TEMP SYNC] Hero images sync result:', heroSyncResult);
  } catch (error) {
    console.error('[TEMP SYNC] Error triggering hero images sync:', error);
  }
  */
  // --- End of Temporary Sync Trigger ---

  const galleriesWithPreviewsPromises = GALLERIES.map(async (gallery) => ({
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