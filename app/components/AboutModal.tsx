'use client'

import Modal from './Modal'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.2 } // Stagger and delay for content after modal opens
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const textContent = [
    "Lee Barrowcliff Photography is a professional photography service based in the UK, specializing in capturing life's most precious moments. With a passion for creating timeless memories, we offer a range of photography services including weddings, portraits, and special events.",
    "Our approach combines technical expertise with an artistic eye, ensuring that each photograph tells a unique story. We believe in creating a comfortable and enjoyable experience for our clients, allowing natural moments to unfold and be captured authentically.",
    "Whether you're planning your wedding day, looking for family portraits, or need photography for a special event, we're here to help you preserve those cherished memories. Contact us to discuss your photography needs and let us help you create lasting visual memories."
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ABOUT">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 text-gray-300 px-2 sm:px-4" // Added padding and base text color
      >
        <motion.div variants={itemVariants} className="w-full flex justify-center mb-6">
          <Image 
            src="/lee-headshot.png" // Updated image path
            alt="About Lee Barrowcliff"
            width={200} // Adjust as needed
            height={200} // Adjust as needed
            className="object-cover rounded-full shadow-lg" // Example styling: rounded-full
          />
        </motion.div>

        {textContent.map((paragraph, index) => (
          <motion.p 
            key={index} 
            variants={itemVariants} 
            className="text-base sm:text-lg leading-relaxed text-left" // Adjusted text size, leading, and alignment
          >
            {paragraph}
          </motion.p>
        ))}

        <motion.div variants={itemVariants} className="pt-4 text-center">
            <button 
                onClick={onClose} 
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
                Close
            </button>
        </motion.div>

      </motion.div>
    </Modal>
  )
} 