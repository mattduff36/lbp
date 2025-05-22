'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface GalleryPreviewProps {
  name: string
  path: string
}

export default function GalleryPreview({ name, path }: GalleryPreviewProps) {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchImage = async () => {
      try {
        console.log('Fetching image for category:', name.toLowerCase())
        const response = await fetch(`/api/gallery-images?category=${name.toLowerCase()}&limit=1`)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`)
        }
        const data = await response.json()
        console.log('Received data:', data)
        
        if (data.images && data.images.length > 0) {
          console.log('Setting image source:', data.images[0].src)
          setImageSrc(data.images[0].src)
        } else {
          console.log('No images found for category:', name)
          setError('No images found')
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching gallery image:', error)
        setError(error instanceof Error ? error.message : 'Failed to load image')
        setLoading(false)
      }
    }

    fetchImage()
  }, [name])

  if (loading) {
    return (
      <div className="relative aspect-[4/3] bg-gray-900 animate-pulse rounded-lg" />
    )
  }

  if (error) {
    console.log('Rendering error state:', error)
    return (
      <div className="relative aspect-[4/3] bg-gray-900 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Failed to load image</p>
      </div>
    )
  }

  return (
    <Link href={path} className="block group">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${name} gallery preview`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            priority
            onError={(e) => {
              console.error('Image failed to load:', imageSrc)
              setError('Image failed to load')
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-900" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-60 transition-opacity duration-300 group-hover:bg-opacity-70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.h3 
            className="text-3xl font-medium text-white tracking-wider uppercase font-montserrat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {name}
          </motion.h3>
        </div>
      </div>
    </Link>
  )
} 