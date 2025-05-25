'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import ImageModal from './ImageModal';
import { motion, AnimatePresence } from 'framer-motion';

interface PortfolioImage {
  id: string;
  name: string;
  src: string;
}

interface PortfolioGalleryProps {
  category: string;
  title: string;
}

// Animation variants
const titleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1, // Stagger effect for children
      duration: 0.5
    } 
  },
};

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const loadingVariants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const PortfolioGallery = ({ category, title }: PortfolioGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<PortfolioImage | null>(null);
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false); // To prevent multiple refresh calls if user navigates away and back quickly

  useEffect(() => {
    let refreshTimeoutId: NodeJS.Timeout;
    let isMounted = true;

    const fetchImagesAndUpdateState = async (isInitialLoad: boolean) => {
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true); // Indicate refresh is in progress
      }
      setError(null);

      try {
        // The first call (isInitialLoad=true) triggers sync in background via performSync=true
        // Subsequent calls (isInitialLoad=false, for refresh) omit performSync
        const apiUrl = `/api/portfolio-images?category=${category.toLowerCase()}${isInitialLoad ? '&performSync=true' : ''}`;
        const response = await fetch(apiUrl);

        if (!isMounted) return; // Component unmounted during fetch

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch images' }));
          throw new Error(errorData.error || `Failed to fetch images: ${response.statusText}`);
        }
        const data = await response.json();
        if (isMounted) {
          setImages(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Error fetching images for ${category} gallery (initial: ${isInitialLoad}):`, err);
          setError(err instanceof Error ? err.message : 'Failed to load images');
        }
      } finally {
        if (isMounted) {
          if (isInitialLoad) {
            setIsLoading(false);
            // Schedule a refresh only after the initial load completes and sync has been triggered
            console.log(`Scheduling refresh for ${category} in 15s`);
            refreshTimeoutId = setTimeout(() => {
              if (isMounted) { // Check if still mounted before refreshing
                console.log(`Attempting refresh for ${category}`);
                fetchImagesAndUpdateState(false); // Fetch again for refresh
              }
            }, 15000); // Refresh after 15 seconds
          } else {
            setIsRefreshing(false); // Refresh attempt finished
          }
        }
      }
    };

    if (category) {
      fetchImagesAndUpdateState(true); // Initial load and sync trigger
    }

    return () => {
      isMounted = false;
      clearTimeout(refreshTimeoutId); // Cleanup timeout on unmount
    };
  }, [category]); // Only re-run if category changes

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat"
          variants={loadingVariants}
          initial="initial"
          animate="animate"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 text-center">
        <motion.div 
          className="text-xl text-red-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Error loading {title} gallery: {error}
        </motion.div>
      </div>
    );
  }

  if (images.length === 0 && !isLoading) { // Ensure not to show if still loading
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 text-center">
        <motion.div 
          className="text-xl text-gray-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          No images found in the {title} gallery.
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-black text-gray-300"
      initial="hidden" 
      animate="visible" 
      variants={{ visible: { transition: { delayChildren: 0.3 } } }} // Delay children for a smoother page load feel
    >
      <div className="container mx-auto px-4 py-12">
        <motion.h1 
          className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat text-center mb-16"
          variants={titleVariants}
          // initial and animate are inherited from parent motion.div if not specified, 
          // but we can be explicit or rely on the parent's stagger for its own reveal.
          // For now, titleVariants will handle its own animation as part of the page load.
        >
          {title}
        </motion.h1>
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={gridContainerVariants} // Apply container variants for stagger
        >
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              className="relative aspect-[4/3] cursor-pointer group overflow-hidden"
              onClick={() => setSelectedImage(image)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedImage(image)}
              tabIndex={0}
              role="button"
              aria-label={`View image ${image.name}`}
              variants={gridItemVariants} // Each item will use these variants
            >
              <Image
                src={image.src}
                alt={image.name}
                fill
                className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={index < 3}
              />
               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </motion.div>
      </div>
      <AnimatePresence>
        {selectedImage && (
          <ImageModal
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            // The ImageModal itself can have its own enter/exit animations if desired
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PortfolioGallery; 