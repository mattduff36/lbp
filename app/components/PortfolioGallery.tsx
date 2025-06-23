'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import ImageModal from './ImageModal';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioImage } from './types';

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
      staggerChildren: 0.1,
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (!category) return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/portfolio-images?category=${category.toLowerCase()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch images. Status: ${response.status}`);
        }
        const data = await response.json();
        const fetchedImages: PortfolioImage[] = data.map((img: any) => ({
          id: img.id || String(Math.random()),
          src: img.src,
          name: img.name || 'Untitled Image',
          thumbnail: img.thumbnail,
          width: img.width || 400,
          height: img.height || 300,
        }));
        setImages(fetchedImages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load images');
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [category]);

  const handleOpenModal = (image: PortfolioImage, index: number) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setSelectedImageIndex(null);
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      const nextIndex = selectedImageIndex + 1;
      setSelectedImage(images[nextIndex]);
      setSelectedImageIndex(nextIndex);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      const prevIndex = selectedImageIndex - 1;
      setSelectedImage(images[prevIndex]);
      setSelectedImageIndex(prevIndex);
    }
  };

  if (isLoading && images.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          variants={loadingVariants} 
          initial="initial"
          animate="animate"
        >
          <Image
            src="/LBP Logo.png"
            alt="Loading Gallery..."
            width={300} 
            height={100} 
            className="object-contain"
            priority 
          />
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

  if (images.length === 0 && !isLoading) {
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
  
  const masonryLayoutClasses = "columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4";

  return (
    <motion.div 
      className="min-h-screen bg-black text-gray-300"
      initial="hidden" 
      animate="visible" 
      variants={{ visible: { transition: { delayChildren: 0.3 } } }}
    >
      <div className="container mx-auto px-4 py-12">
        <motion.h1 
          className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat text-center mb-16"
          variants={titleVariants}
        >
          {title}
        </motion.h1>
        
        {!isLoading && !error && images.length > 0 && (
          <motion.div 
            className={masonryLayoutClasses}
            variants={gridContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {images.map((image, index) => (
              <motion.div
                key={`${image.id}-${index}`}
                className="relative group overflow-hidden mb-4 break-inside-avoid cursor-pointer"
                onClick={() => handleOpenModal(image, index)}
                onKeyDown={(e) => e.key === 'Enter' && handleOpenModal(image, index)}
                tabIndex={0}
                role="button"
                aria-label={`View image ${image.name}`}
                variants={gridItemVariants}
              >
                <Image
                  src={image.src}
                  alt={image.name}
                  width={image.width || 400}
                  height={image.height || 300}
                  className="object-cover w-full h-auto transition-transform duration-300 ease-in-out group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority={index < 8}
                />
                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {selectedImage && selectedImageIndex !== null && (
          <ImageModal
            image={selectedImage}
            onClose={handleCloseModal}
            onNext={handleNextImage}
            onPrevious={handlePreviousImage}
            hasNext={selectedImageIndex < images.length - 1}
            hasPrevious={selectedImageIndex > 0}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PortfolioGallery; 