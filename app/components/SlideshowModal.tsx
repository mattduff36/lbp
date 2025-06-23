'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { PortfolioImage } from './types';
import { FaPlay } from 'react-icons/fa';

interface SlideshowModalProps {
  images: PortfolioImage[];
  onClose: () => void;
}

export default function SlideshowModal({ images, onClose }: SlideshowModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);

  useEffect(() => {
    if (images.length > 1 && isAutoSliding) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 5000); // 5-second interval

      return () => clearInterval(timer);
    }
  }, [images.length, isAutoSliding]);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoSliding(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <div
        className="relative w-full h-full cursor-pointer"
        onClick={handleImageClick}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, zIndex: 0 }}
            animate={{ opacity: 1, zIndex: 1, transition: { duration: 1.5, ease: 'easeInOut' } }}
            exit={{ opacity: 0, zIndex: 0, transition: { duration: 1.5, ease: 'easeInOut' } }}
            className="absolute inset-0"
          >
            <Image
              src={images[currentIndex].src}
              alt={images[currentIndex].name}
              fill
              className="object-contain"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-50 p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-all focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close slideshow"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
} 