'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24"
      >
        <motion.div variants={fadeInUp} className="mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-medium text-gray-100 tracking-wider uppercase font-montserrat mb-4 text-center">
            About Lee
          </h1>
          <div className="h-1 w-20 bg-gray-600 rounded-full mx-auto"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div 
            variants={fadeInUp}
            className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl"
          >
            <Image
              src="/Headshot.jpeg"
              alt="Lee Barrowcliff - Photographer"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
              priority
            />
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-8">
            <div className="prose prose-invert max-w-none space-y-6">
              <motion.p variants={fadeInUp} className="text-gray-300 text-lg leading-relaxed">
                Hi, I'm Lee Barrowcliff — a photographer based in the East Midlands with a deep passion for capturing life as it happens. My approach is rooted in natural lifestyle photography, focusing on real moments over posed shots. Whether it's a quiet glance between newlyweds or the excitement of family tackling a high ropes course, I aim to tell authentic stories through my lens.
              </motion.p>
              <motion.p variants={fadeInUp} className="text-gray-300 text-lg leading-relaxed">
                Weddings are one of my favourite environments to shoot. I believe the best photos come when people feel relaxed and free to enjoy their day, and my unobtrusive, documentary style allows me to capture those genuine, fleeting moments.
              </motion.p>
              <motion.p variants={fadeInUp} className="text-gray-300 text-lg leading-relaxed">
                This love for capturing spontaneity naturally led me into sports photography, where unpredictability is part of the thrill. I particularly enjoy working around motorsports, golf, and watersports — each offering unique challenges and opportunities for striking imagery.
              </motion.p>
              <motion.p variants={fadeInUp} className="text-gray-300 text-lg leading-relaxed">
                As my own family has grown, so has my interest in portrait photography. I now offer a mobile studio setup for both natural and studio-lit portraits, making it easy to create professional images in a comfortable setting — whether that's in your home or on location.
              </motion.p>
              <motion.p variants={fadeInUp} className="text-gray-300 text-lg leading-relaxed">
                No matter the subject, my goal is always the same: to create honest, emotive photographs that you'll treasure for years to come.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
} 