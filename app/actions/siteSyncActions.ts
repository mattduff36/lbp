'use server';

import { GALLERIES } from '@/app/config/galleries';
import { syncPortfolio } from '@/app/services/syncPortfolio';
import { syncHeroImages } from '@/app/services/syncHeroImages';

interface AllPortfolioSyncResult {
  success: boolean;
  message: string;
  details?: Array<{ galleryName: string; status: 'success' | 'failed'; error?: string }>;
}

interface HeroSyncResult {
  success: boolean;
  message: string;
}

export const triggerAllPortfolioGalleriesSync = async (): Promise<AllPortfolioSyncResult> => {
  console.log('Attempting to sync all portfolio galleries...');
  const results: Array<{ galleryName: string; status: 'success' | 'failed'; error?: string }> = [];
  let allSuccessful = true;

  for (const gallery of GALLERIES) {
    try {
      // Assuming syncPortfolio returns void or a simple success/error that we are not directly using here
      // or if it throws an error on failure.
      await syncPortfolio(gallery.localDir); // localDir is the categoryName
      console.log(`Successfully initiated sync for portfolio gallery: ${gallery.name}`);
      results.push({ galleryName: gallery.name, status: 'success' });
    } catch (error) {
      allSuccessful = false;
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error syncing portfolio gallery ${gallery.name}:`, errorMessage);
      results.push({ galleryName: gallery.name, status: 'failed', error: errorMessage });
    }
  }

  if (allSuccessful) {
    return { 
      success: true, 
      message: 'All portfolio galleries synced successfully.', 
      details: results 
    };
  } else {
    return { 
      success: false, 
      message: 'Some portfolio galleries failed to sync. Check details.', 
      details: results 
    };
  }
};

export const triggerAllHeroImagesSync = async (): Promise<HeroSyncResult> => {
  console.log('Attempting to sync all hero images...');
  try {
    const heroSyncStatus = await syncHeroImages(); // syncHeroImages returns a boolean
    if (heroSyncStatus) {
      console.log('Hero images sync successfully completed.');
      return { success: true, message: 'Hero images sync initiated successfully.' };
    } else {
      console.warn('Hero images sync returned false (possibly skipped or failed, check server logs).');
      return { success: false, message: 'Hero images sync may have been skipped or failed. Check server logs.' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error syncing hero images:', error);
    return { success: false, message: `Error syncing hero images: ${errorMessage}` };
  }
}; 