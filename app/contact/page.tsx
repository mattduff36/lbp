'use client'

import ContactForm from '../components/ContactForm'
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

export default function ContactPage() {
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
            Get in Touch
          </h1>
          <div className="h-1 w-20 bg-gray-600 rounded-full mx-auto"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <motion.div variants={fadeInUp} className="bg-gray-900/50 rounded-2xl p-8 shadow-xl">
            <ContactForm />
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-8">
            <div className="prose prose-invert max-w-none space-y-6">
              <motion.p variants={fadeInUp} className="text-gray-300 text-lg leading-relaxed">
                I'd love to hear from you! Whether you're interested in booking a session, have questions about my services, or just want to say hello, feel free to reach out.
              </motion.p>
              <motion.div variants={fadeInUp} className="mt-8 space-y-6">
                <div>
                  <h2 className="text-xl font-medium text-gray-100 mb-4">Contact</h2>
                  <a 
                    href="mailto:info@leebarrowcliffphotography.com" 
                    className="inline-flex items-center text-gray-300 hover:text-white transition-colors duration-200 text-lg group"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6 mr-2 group-hover:scale-110 transition-transform duration-200" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                      />
                    </svg>
                    info@leebarrowcliffphotography.com
                  </a>
                </div>
                <div>
                  <h2 className="text-xl font-medium text-gray-100 mb-4">Location</h2>
                  <p className="text-gray-300 text-lg">Based in the East Midlands</p>
                  <p className="text-gray-300 text-lg">Available for travel throughout the UK</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
} 