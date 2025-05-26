'use client'

import Image from 'next/image'
import Link from 'next/link'
// import { motion } from 'framer-motion' // Removed unused import
import { FaCamera } from 'react-icons/fa'

interface GalleryPreviewProps {
  name: string
  path: string
  previewImageSrc: string | null
}

const GalleryPreview: React.FC<GalleryPreviewProps> = ({ name, path, previewImageSrc }) => {
  return (
    <Link href={path} className="relative group w-full h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out block">
      {previewImageSrc ? (
        <Image
          src={previewImageSrc}
          alt={`Preview of ${name} gallery`}
          layout="fill"
          objectFit="cover"
          className="group-hover:scale-105 transition-transform duration-300 ease-in-out"
        />
      ) : (
        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center">
          <FaCamera className="text-gray-500 text-6xl mb-4" />
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-opacity duration-300 ease-in-out flex items-center justify-center p-4">
        <h3 className="text-2xl font-montserrat text-gray-300 uppercase tracking-wider text-center opacity-90 group-hover:opacity-100 transition-opacity duration-300">{name}</h3>
      </div>
    </Link>
  )
}

export default GalleryPreview 