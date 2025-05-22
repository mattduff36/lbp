'use client'

import { useState, useRef, useEffect } from 'react'
import AboutModal from './AboutModal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
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

  const galleries = [
    { name: 'Weddings', path: '/portfolio/weddings' },
    { name: 'Portraits', path: '/portfolio/portraits' },
    { name: 'Events', path: '/portfolio/events' },
    { name: 'Landscapes', path: '/portfolio/landscapes' },
    { name: 'Wildlife', path: '/portfolio/wildlife' },
    { name: 'Architecture', path: '/portfolio/architecture' },
  ]

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsDropdownOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false)
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div className="min-h-screen flex flex-col bg-black text-white">
        <header className="bg-black shadow-sm border-b border-gray-800">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center h-16">
              <div className="flex space-x-8">
                <Link
                  href="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white tracking-wider uppercase font-montserrat"
                >
                  Home
                </Link>
                <div 
                  className="relative"
                  ref={dropdownRef}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white tracking-wider uppercase font-montserrat h-full"
                  >
                    Portfolio
                    <svg
                      className={`ml-2 h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isDropdownOpen && (
                    <div
                      className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-black ring-1 ring-gray-800 z-50"
                    >
                      <div className="py-1">
                        {galleries.map((gallery) => (
                          <Link
                            key={gallery.path}
                            href={gallery.path}
                            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-900"
                          >
                            {gallery.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link
                  href="/about"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white tracking-wider uppercase font-montserrat"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white tracking-wider uppercase font-montserrat"
                >
                  Contact
                </Link>
              </div>
            </div>
          </nav>
        </header>

        <main className="flex-grow">
          {children}
        </main>

        <footer className="bg-black border-t border-gray-800">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-400">
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
        </footer>
      </div>

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </>
  )
} 