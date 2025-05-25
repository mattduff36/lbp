'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface GalleryPreviewProps {
  name: string
  path: string
  previewImageSrc: string | null
}

export default function GalleryPreview({ name, path, previewImageSrc }: GalleryPreviewProps) {
  if (!previewImageSrc) {
    return (
      <Link href={path} className="block group">
        <div className="relative aspect-[4/3] bg-gray-800 rounded-lg flex flex-col items-center justify-center p-4">
          <p className="text-gray-400 text-center text-sm mb-2">No preview image available</p>
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
    );
  }

  return (
    <Link href={path} className="block group">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
        <Image
          src={previewImageSrc}
          alt={`${name} gallery preview`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          priority
        />
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