'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image' // Import next/image
import { PortfolioImage } from './types'

export default function ClientPortfolio() {
  const [images, setImages] = useState<PortfolioImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<PortfolioImage | null>(null)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/portfolio-images')
        const data = await response.json()
        setImages(data)
      } catch (error) {
        console.error('Error fetching portfolio images:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    )
  }

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No images available</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <section id="portfolio" className="py-16 w-full">
        <div className="w-full px-8">
          <h2 className="text-3xl font-medium text-gray-400 tracking-wider uppercase font-montserrat text-center mb-8">
            Portfolio
          </h2>
          <div className="grid grid-cols-4 gap-[5px] w-full">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                className="relative overflow-hidden cursor-pointer aspect-square"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                onClick={() => setTimeout(() => setSelectedImage(image), 0)}
                tabIndex={0}
                aria-label={`View image ${image.name}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTimeout(() => setSelectedImage(image), 0) }}
              >
                <Image
                  src={image.src}
                  alt={image.name}
                  fill
                  className="object-cover"
                  sizes="calc((100vw - 2rem - 15px) / 4)"
                  priority={index < 8}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                const currentIndex = images.findIndex(img => img.id === selectedImage.id);
                if (currentIndex === images.length - 1) {
                  setSelectedImage(null);
                } else {
                  setSelectedImage(images[currentIndex + 1]);
                }
              }}
              className="relative max-w-full max-h-full w-auto h-auto cursor-pointer"
            >
              <Image
                src={selectedImage.src}
                alt={selectedImage.name}
                width={0}
                height={0}
                sizes="100vw"
                style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '90vh' }}
                className="object-contain"
                priority
                onError={(e) => console.error('Error loading image:', selectedImage.src, e)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
