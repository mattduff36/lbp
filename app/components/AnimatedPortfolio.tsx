'use client'

import { motion } from 'framer-motion'
import GalleryPreview from './GalleryPreview'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

interface Gallery {
  name: string
  path: string
  previewImageSrc: string | null
}

interface AnimatedPortfolioProps {
  galleries: Gallery[]
}

export default function AnimatedPortfolio({ galleries }: AnimatedPortfolioProps) {
  return (
    <motion.section 
      id="portfolio" 
      className="py-16 md:py-24 w-full"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-medium text-gray-100 tracking-wider uppercase font-montserrat mb-4">
            Portfolio
          </h2>
          <div className="h-1 w-20 bg-gray-600 rounded-full mx-auto"></div>
        </motion.div>
        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {galleries.map((gallery) => (
            <motion.div key={gallery.path} variants={fadeInUp}>
              <GalleryPreview
                name={gallery.name}
                path={gallery.path}
                previewImageSrc={gallery.previewImageSrc}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
} 