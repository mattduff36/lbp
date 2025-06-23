'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import ImageModal from '@/app/components/ImageModal';
import { PortfolioImage } from '@/app/components/types';
import { useParams } from 'next/navigation';
import { FaDownload } from 'react-icons/fa';

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

export default function ClientGalleryPage() {
  const params = useParams();
  const username = params.username as string;

  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<PortfolioImage | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchImages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/client-gallery?username=${username}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch images. Status: ${response.status}`);
        }
        const data = await response.json();
        // Ensure the fetched data conforms to PortfolioImage, especially `src`
        const fetchedImages: PortfolioImage[] = data.images
          .filter((img: any) => img.src)
          .map((img: any) => ({
            id: img.id || String(Math.random()), // Ensure ID exists
            src: img.src, // This should be the webContentLink from your API
            name: img.name || 'Untitled Image',
            thumbnail: img.thumbnail,
            width: img.width || 400, // Default or fetched width
            height: img.height || 300, // Default or fetched height
          }));
        setImages(fetchedImages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load images');
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [username]);

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

  const handleDownloadSingle = (e: React.MouseEvent, image: PortfolioImage) => {
    e.stopPropagation(); // Prevent modal from opening
    const downloadUrl = `/api/client-gallery/download-single?fileId=${image.id}`;
    window.open(downloadUrl, '_blank');
  };

  const handleModalDownload = (image: PortfolioImage) => {
    const downloadUrl = `/api/client-gallery/download-single?fileId=${image.id}`;
    window.open(downloadUrl, '_blank');
  };

  const handleDownloadAll = async () => {
    if (!username) return;
    try {
      const response = await fetch(`/api/client-gallery/download?username=${username}`);
      if (!response.ok) throw new Error('Failed to download images');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${username}-gallery.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download images');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
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
          Error loading gallery: {error}
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-black text-gray-300"
      initial="hidden" 
      animate="visible" 
      variants={{ visible: { transition: { delayChildren: 0.3 } } }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-16">
          <motion.h1 
            className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat"
            variants={titleVariants}
          >
            Your Gallery
          </motion.h1>
          
          <button
            onClick={handleDownloadAll}
            className="bg-LBPBlue text-white px-8 py-3 rounded-md border-2 border-LBPBlue/70 shadow-lg hover:bg-LBPBlue/80 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-LBPBlue focus:ring-opacity-75 transition-all duration-200 disabled:opacity-50"
            disabled={!username || images.length === 0}
          >
            Download All
          </button>
        </div>
        
        {images.length > 0 ? (
          <motion.div 
            className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4"
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
                  alt={image.name || 'Client image'}
                  width={image.width || 400}
                  height={image.height || 300}
                  className="object-cover w-full h-auto transition-transform duration-300 ease-in-out group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority={index < 8}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <button
                  onClick={(e) => handleDownloadSingle(e, image)}
                  className="absolute bottom-2 right-2 p-3 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Download image"
                >
                  <FaDownload />
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center text-gray-400">
            No images found in your gallery.
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedImage && selectedImageIndex !== null && (
          <ImageModal
            image={selectedImage}
            onClose={handleCloseModal}
            onDownload={handleModalDownload}
            onNext={handleNextImage}
            onPrevious={handlePreviousImage}
            hasNext={selectedImageIndex < images.length - 1}
            hasPrevious={selectedImageIndex > 0}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
} 