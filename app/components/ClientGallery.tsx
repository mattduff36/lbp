'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image' // Import next/image
import { GalleryImage } from './types'

export default function ClientGallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/gallery-images')
        const data = await response.json()
        setImages(data)
      } catch (error) {
        console.error('Error fetching gallery images:', error)
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
      <section id="gallery" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-medium text-gray-400 tracking-wider uppercase font-montserrat text-center mb-8">
            Gallery
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {images.map((image, index) => ( // Add index parameter here
              <motion.div
                key={image.id}
                className="relative aspect-square overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedImage(image)}
                tabIndex={0} // Add for accessibility
                aria-label={`View image ${image.alt}`} // Add for accessibility
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedImage(image) }} // Add for accessibility
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill // Use fill to cover the parent div
                  className="object-cover" // Keep object-cover
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw" // Add sizes for responsiveness
                  priority={index < 8} // Prioritize loading first few images
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
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-full max-h-full w-auto h-auto"
            >
              {/* Replace img with next/image */}
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                // Use width and height for intrinsic sizing, or fill if parent has dimensions
                // Since the parent div controls max size, let's try width/height 0 and style
                width={0}
                height={0}
                sizes="90vw" // Estimate viewport width
                style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '90vh' }} // Maintain aspect ratio within bounds
                className="object-contain" // Keep object-contain
                priority // Prioritize loading the modal image
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
