'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import AboutModal from './AboutModal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
  const router = useRouter()

  const scrollToPortfolio = () => {
    router.push('/')
    setTimeout(() => {
      const portfolioSection = document.getElementById('portfolio')
      if (portfolioSection) {
        portfolioSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  return (
    <>
      <div className="flex-grow flex flex-col bg-black text-white">
        <main className="flex-grow flex flex-col">
          {children}
        </main>

        <footer className="bg-black border-t border-gray-800 relative">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-center items-center relative">
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Website developed by{' '}
                <a
                  href="https://mpdee.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-300"
                >
                  mpdee.co.uk
                </a>{' '}
                © 2025. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {isAboutModalOpen && <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />}
    </>
  )
} 