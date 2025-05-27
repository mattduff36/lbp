'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import AboutModal from './AboutModal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { triggerAllPortfolioGalleriesSync, triggerAllHeroImagesSync } from '@/app/actions/siteSyncActions';
import { FaSync } from 'react-icons/fa';

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownTimeoutRef = useRef<NodeJS.Timeout>()
  const router = useRouter()

  // Refs for message timeouts
  const portfolioMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heroMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // New state for portfolio sync
  const [isPortfolioSyncing, startPortfolioSyncTransition] = useTransition();
  const [portfolioSyncMessage, setPortfolioSyncMessage] = useState<string | null>(null);
  const [portfolioSyncSuccess, setPortfolioSyncSuccess] = useState<boolean | null>(null);

  // New state for hero sync
  const [isHeroSyncing, startHeroSyncTransition] = useTransition();
  const [heroSyncMessage, setHeroSyncMessage] = useState<string | null>(null);
  const [heroSyncSuccess, setHeroSyncSuccess] = useState<boolean | null>(null);

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
    { name: 'Wedding', path: '/portfolio/wedding' },
    { name: 'Portrait', path: '/portfolio/portrait' },
    { name: 'Lifestyle', path: '/portfolio/lifestyle' },
    { name: 'Landscape', path: '/portfolio/landscape' },
    { name: 'Animals', path: '/portfolio/animals' },
    { name: 'Sport', path: '/portfolio/sport' },
  ]

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setIsDropdownOpen(true)
  }

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false)
    }, 300)
  }

  useEffect(() => {
    const currentDropdownTimeout = dropdownTimeoutRef.current;
    return () => {
      if (currentDropdownTimeout) {
        clearTimeout(currentDropdownTimeout);
      }
    };
  }, [])

  // useEffect for cleaning up sync message timeouts on unmount
  useEffect(() => {
    return () => {
      if (portfolioMessageTimeoutRef.current) {
        clearTimeout(portfolioMessageTimeoutRef.current);
      }
      if (heroMessageTimeoutRef.current) {
        clearTimeout(heroMessageTimeoutRef.current);
      }
    };
  }, []);

  // Handler for "Sync All Portfolio"
  const handleSyncAllPortfolio = () => {
    if (portfolioMessageTimeoutRef.current) {
      clearTimeout(portfolioMessageTimeoutRef.current);
    }
    setPortfolioSyncMessage(null);
    setPortfolioSyncSuccess(null);
    startPortfolioSyncTransition(async () => {
      console.log("Client: Triggering all portfolio sync");
      const result = await triggerAllPortfolioGalleriesSync();
      setPortfolioSyncMessage(result.message);
      setPortfolioSyncSuccess(result.success);
      console.log("Client: Portfolio sync result:", result);
      if (result.details && result.details.some(d => d.status === 'failed')) {
        console.warn("Client: Some portfolio galleries failed to sync. Details:", result.details);
      }
      portfolioMessageTimeoutRef.current = setTimeout(() => {
        setPortfolioSyncMessage(null);
        setPortfolioSyncSuccess(null);
      }, 5000);
    });
  };

  // Handler for "Sync All Hero Images"
  const handleSyncAllHero = () => {
    if (heroMessageTimeoutRef.current) {
      clearTimeout(heroMessageTimeoutRef.current);
    }
    setHeroSyncMessage(null);
    setHeroSyncSuccess(null);
    startHeroSyncTransition(async () => {
      console.log("Client: Triggering all hero images sync");
      const result = await triggerAllHeroImagesSync();
      setHeroSyncMessage(result.message);
      setHeroSyncSuccess(result.success);
      console.log("Client: Hero sync result:", result);
      heroMessageTimeoutRef.current = setTimeout(() => {
        setHeroSyncMessage(null);
        setHeroSyncSuccess(null);
      }, 5000);
    });
  };

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
                            onClick={() => setIsDropdownOpen(false)}
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

        <footer className="bg-black border-t border-gray-800 relative">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex justify-center items-center relative">
            {/* Left side: Sync All Portfolio */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleSyncAllPortfolio}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSyncAllPortfolio(); } }}
              aria-label="Manually sync all portfolio images"
              className="absolute left-0 top-0 h-full w-1/4 opacity-0 hover:opacity-5 focus:opacity-5 bg-gray-500 cursor-pointer transition-opacity duration-300 flex items-center justify-center text-xs text-white z-10"
              title="Sync All Portfolio Images (Hidden Admin Action)"
            >
              {/* Optional: Sync All Portfolio */}
            </div>

            {/* Center: Existing footer content & Sync Status */}
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
              
              {/* Portfolio Sync Status Message */}
              {isPortfolioSyncing && (
                <p className="text-xs text-LBPBlue mt-2 flex items-center justify-center">
                  <FaSync className="animate-spin mr-2" /> Syncing All Portfolio Galleries...
                </p>
              )}
              {portfolioSyncMessage && (
                <p className={`text-xs mt-1 ${portfolioSyncSuccess ? 'text-green-400' : 'text-red-400'}`}>
                  Portfolio: {portfolioSyncMessage}
                </p>
              )}

              {/* Hero Sync Status Message */}
              {isHeroSyncing && (
                <p className="text-xs text-LBPBlue mt-2 flex items-center justify-center">
                  <FaSync className="animate-spin mr-2" /> Syncing Hero Images...
                </p>
              )}
              {heroSyncMessage && (
                <p className={`text-xs mt-1 ${heroSyncSuccess ? 'text-green-400' : 'text-red-400'}`}>
                  Hero: {heroSyncMessage}
                </p>
              )}
            </div>

            {/* Right side: Sync All Hero Images */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleSyncAllHero}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSyncAllHero(); } }}
              aria-label="Manually sync all hero images"
              className="absolute right-0 top-0 h-full w-1/4 opacity-0 hover:opacity-5 focus:opacity-5 bg-gray-500 cursor-pointer transition-opacity duration-300 flex items-center justify-center text-xs text-white z-10"
              title="Sync All Hero Images (Hidden Admin Action)"
            >
              {/* Optional: Sync All Hero */}
            </div>
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