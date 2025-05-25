'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface HeroImage {
  id: number;
  src: string;
  alt: string;
}

export default function ClientHero() {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/hero-images');
        if (!response.ok) {
          throw new Error('Failed to fetch hero images');
        }
        const data = await response.json();
        setImages(data.images);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching hero images:', error);
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length > 1 && isAutoSliding) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 8000);

      return () => clearInterval(timer);
    }
  }, [images.length, isAutoSliding]);

  const handleImageClick = () => {
    setIsAutoSliding(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  if (loading) {
    return (
      <div className="relative w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
        <motion.div
          initial={{ opacity: 0.5, scale: 0.95 }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1, 0.95] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/LBP Logo.png"
            alt="Loading Lee Barrowcliff Photography Logo"
            width={600}
            height={200}
            className="object-contain w-full h-auto"
            priority
          />
        </motion.div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="relative w-full h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="hero-text">Lee Barrowcliff</h1>
          <p className="text-2xl md:text-3xl font-marcellus tracking-wider">
            Photography
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[calc(100vh-4rem)] overflow-hidden cursor-pointer"
      onClick={handleImageClick}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3 }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            fill
            className="object-cover"
            priority={currentIndex === 0}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center text-white px-4 w-full max-w-[900px]">
            <Image
              src="/LBP Logo.png"
              alt="Lee Barrowcliff Photography"
              width={900}
              height={300}
              className="object-contain w-full h-auto"
              priority
            />
          </div>
      </div>
    </div>
  );
}
