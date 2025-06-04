'use client';

import { useState } from 'react';
import { GALLERIES, GalleryConfig } from '@/app/config/galleries';
import { triggerAllHeroImagesSync } from '@/app/actions/siteSyncActions';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface SyncStatus {
  isLoading: boolean;
  message: string;
  isError: boolean;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [gallerySyncStatus, setGallerySyncStatus] = useState<Record<string, SyncStatus>>({});
  const [heroSyncStatus, setHeroSyncStatus] = useState<SyncStatus | null>(null);
  const [allPortfolioSyncStatus, setAllPortfolioSyncStatus] = useState<SyncStatus | null>(null);

  const handleSyncGallery = async (category: string) => {
    setGallerySyncStatus(prev => ({ ...prev, [category]: { isLoading: true, message: 'Syncing...', isError: false } }));
    try {
      const response = await fetch(`/api/portfolio-images?category=${category.toLowerCase()}&performSync=true`);
      const result = await response.json(); // Assuming API returns JSON
      if (response.ok) {
        // The API currently returns the list of images, not a specific sync status object.
        // For simplicity, we'll just mark it as success if response.ok is true.
        setGallerySyncStatus(prev => ({ ...prev, [category]: { isLoading: false, message: 'Sync triggered successfully.', isError: false } }));
      } else {
        // Use error from response if available, otherwise a generic one
        const errorMessage = result.error || 'Failed to trigger sync.';
        setGallerySyncStatus(prev => ({ ...prev, [category]: { isLoading: false, message: errorMessage, isError: true } }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setGallerySyncStatus(prev => ({ ...prev, [category]: { isLoading: false, message, isError: true } }));
    }
  };

  const handleSyncAllPortfolio = async () => {
    setAllPortfolioSyncStatus({ isLoading: true, message: 'Syncing all portfolio galleries...', isError: false });
    let allSucceeded = true;
    const individualResults: string[] = [];

    for (const gallery of GALLERIES) {
      setGallerySyncStatus(prev => ({ ...prev, [gallery.localDir]: { isLoading: true, message: `Syncing ${gallery.name}...`, isError: false } }));
      try {
        const response = await fetch(`/api/portfolio-images?category=${gallery.localDir.toLowerCase()}&performSync=true`);
        if (response.ok) {
          setGallerySyncStatus(prev => ({ ...prev, [gallery.localDir]: { isLoading: false, message: 'Sync successful.', isError: false } }));
          individualResults.push(`${gallery.name}: Success`);
        } else {
          const result = await response.json().catch(() => ({error: 'Sync failed'}));
          const errorMessage = result.error || 'Sync failed';
          setGallerySyncStatus(prev => ({ ...prev, [gallery.localDir]: { isLoading: false, message: errorMessage, isError: true } }));
          individualResults.push(`${gallery.name}: Failed - ${errorMessage}`);
          allSucceeded = false;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        setGallerySyncStatus(prev => ({ ...prev, [gallery.localDir]: { isLoading: false, message, isError: true } }));
        individualResults.push(`${gallery.name}: Error - ${message}`);
        allSucceeded = false;
      }
    }

    if (allSucceeded) {
      setAllPortfolioSyncStatus({ isLoading: false, message: 'All portfolio galleries synced successfully. Details: ' + individualResults.join('; '), isError: false });
    } else {
      setAllPortfolioSyncStatus({ isLoading: false, message: 'Some portfolio galleries failed to sync. Details: ' + individualResults.join('; '), isError: true });
    }
  };

  const handleSyncHero = async () => {
    setHeroSyncStatus({ isLoading: true, message: 'Syncing hero images...', isError: false });
    try {
      const result = await triggerAllHeroImagesSync();
      if (result.success) {
        setHeroSyncStatus({ isLoading: false, message: result.message, isError: false });
      } else {
        setHeroSyncStatus({ isLoading: false, message: result.message || 'Failed to sync hero images.', isError: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setHeroSyncStatus({ isLoading: false, message, isError: true });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat">
          Manual Syncing
        </h1>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <section className="mb-10 bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2 text-LBPBlue">Hero Images</h2>
          <button
            onClick={handleSyncHero}
            disabled={heroSyncStatus?.isLoading}
            className="bg-LBPBlue hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {heroSyncStatus?.isLoading ? 'Syncing...' : 'Sync All Hero Images'}
          </button>
          {heroSyncStatus && !heroSyncStatus.isLoading && (
            <p className={`mt-3 text-sm ${heroSyncStatus.isError ? 'text-red-400' : 'text-green-400'}`}>
              {heroSyncStatus.message}
            </p>
          )}
        </section>

        <section className="mb-10 bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2 text-LBPBlue">All Portfolio Galleries</h2>
          <button
            onClick={handleSyncAllPortfolio}
            disabled={allPortfolioSyncStatus?.isLoading}
            className="bg-LBPBlue hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition duration-150 ease-in-out mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {allPortfolioSyncStatus?.isLoading ? 'Syncing All...' : 'Sync All Portfolio Galleries'}
          </button>
          {allPortfolioSyncStatus && !allPortfolioSyncStatus.isLoading && (
            <p className={`text-sm ${allPortfolioSyncStatus.isError ? 'text-red-400' : 'text-green-400'}`}>
              {allPortfolioSyncStatus.message}
            </p>
          )}
        </section>
        
        <section className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 border-b border-gray-700 pb-2 text-LBPBlue">Individual Portfolio Galleries</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {GALLERIES.map((gallery: GalleryConfig) => (
              <div key={gallery.localDir} className="bg-gray-700 p-4 rounded-md shadow-md">
                <h3 className="text-xl font-medium mb-3 text-gray-200">{gallery.name}</h3>
                <button
                  onClick={() => handleSyncGallery(gallery.localDir)}
                  disabled={gallerySyncStatus[gallery.localDir]?.isLoading}
                  className="w-full bg-LBPBlue/80 hover:bg-LBPBlue text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gallerySyncStatus[gallery.localDir]?.isLoading ? 'Syncing...' : `Sync ${gallery.name}`}
                </button>
                {gallerySyncStatus[gallery.localDir] && !gallerySyncStatus[gallery.localDir]?.isLoading && (
                  <p className={`mt-2 text-xs ${gallerySyncStatus[gallery.localDir]?.isError ? 'text-red-400' : 'text-green-400'}`}>
                    {gallerySyncStatus[gallery.localDir]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 