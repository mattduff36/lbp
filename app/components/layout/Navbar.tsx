'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { GALLERIES } from '@/app/config/galleries';

interface NavLinkItem {
  href: string;
  name: string;
}

const navLinks: NavLinkItem[] = [
  { href: '/', name: 'Home' },
  { href: '/portfolio', name: 'Portfolio' },
  { href: '/about', name: 'About' },
  { href: '/contact', name: 'Contact' },
  { href: '/client-login', name: 'Client Login' },
];

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false);
  const [isMobilePortfolioDropdownOpen, setIsMobilePortfolioDropdownOpen] = useState(false);
  const portfolioDropdownRef = useRef<HTMLDivElement>(null);
  const portfolioDropdownTimeoutRef = useRef<NodeJS.Timeout>();

  const isClientGalleryPage = pathname.startsWith('/client-login/') && pathname.length > '/client-login/'.length;

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/clients/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isMobileMenuOpen) {
      setIsMobilePortfolioDropdownOpen(false);
    }
  };

  const handleToggleMobilePortfolioDropdown = () => {
    setIsMobilePortfolioDropdownOpen(!isMobilePortfolioDropdownOpen);
  };

  const handlePortfolioMouseEnter = () => {
    if (portfolioDropdownTimeoutRef.current) {
      clearTimeout(portfolioDropdownTimeoutRef.current);
    }
    setIsPortfolioDropdownOpen(true);
  };

  const handlePortfolioMouseLeave = () => {
    portfolioDropdownTimeoutRef.current = setTimeout(() => {
      setIsPortfolioDropdownOpen(false);
    }, 300);
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  
  useEffect(() => {
    const currentDropdownTimeout = portfolioDropdownTimeoutRef.current;
    return () => {
      if (currentDropdownTimeout) {
        clearTimeout(currentDropdownTimeout);
      }
    };
  }, []);

  const baseLinkStyle = "px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white tracking-wider uppercase font-montserrat";
  const activeLinkStyle = "px-1 pt-1 text-sm font-medium text-white tracking-wider uppercase font-montserrat border-b-2 border-gray-300";
  const portfolioButtonDesktopStyle = "inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white tracking-wider uppercase font-montserrat h-full";
  const dropdownLinkDesktopStyle = "block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-900 uppercase font-montserrat whitespace-nowrap";

  const primaryMobileLinkNames = ['Home', 'Portfolio', 'Client Login'];
  const primaryMobileLinks = navLinks.filter(link => primaryMobileLinkNames.includes(link.name));
  const moreDropdownLinks = navLinks.filter(link => !primaryMobileLinkNames.includes(link.name));

  const mobileDropdownLinkBaseStyle = "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 uppercase font-montserrat";
  const mobileDropdownLinkActiveStyle = "block px-3 py-2 rounded-md text-base font-medium bg-gray-700 text-white uppercase font-montserrat";
  const mobilePortfolioItemStyle = "block px-4 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 uppercase font-montserrat whitespace-nowrap";

  useEffect(() => {
    if (isMobileMenuOpen || isMobilePortfolioDropdownOpen) {
      setIsMobileMenuOpen(false);
      setIsMobilePortfolioDropdownOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav className="bg-black shadow-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16">
          {/* Logo div removed */}

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-stretch space-x-8">
            {navLinks.map((link) => {
              if (link.name === 'Portfolio') {
                return (
                  <div
                    key={link.name}
                    className="relative flex items-center"
                    ref={portfolioDropdownRef}
                    onMouseEnter={handlePortfolioMouseEnter}
                    onMouseLeave={handlePortfolioMouseLeave}
                  >
                    <button
                      type="button"
                      className={portfolioButtonDesktopStyle}
                      onClick={() => setIsPortfolioDropdownOpen(!isPortfolioDropdownOpen)}
                      aria-expanded={isPortfolioDropdownOpen}
                      aria-haspopup="true"
                    >
                      Portfolio
                      <svg
                        className={`ml-2 h-4 w-4 transition-transform ${isPortfolioDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isPortfolioDropdownOpen && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[1px] w-auto min-w-max rounded-b-md shadow-lg bg-black ring-1 ring-gray-800 z-50 py-1">
                        {GALLERIES.map((gallery) => (
                          <Link
                            key={gallery.localDir}
                            href={`/portfolio/${gallery.localDir}`}
                            className={dropdownLinkDesktopStyle}
                            onClick={() => setIsPortfolioDropdownOpen(false)}
                          >
                            {gallery.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              if (link.name === 'Client Login') {
                if (isClientGalleryPage) {
                  return (
                    <button
                      key="logout"
                      onClick={handleLogout}
                      className={`${baseLinkStyle} text-red-500 hover:text-red-400 flex items-center`}
                    >
                      Log Out
                    </button>
                  );
                }
              }
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`${pathname === link.href ? activeLinkStyle : baseLinkStyle} flex items-center`}
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile: Visible Primary Links + More Button */}
          <div className="flex items-center md:hidden">
            {primaryMobileLinks.map((link) => {
              if (link.name === 'Portfolio') {
                return (
                  <div key={link.name} className="relative mr-3 sm:mr-4">
                    <button
                      type="button"
                      onClick={handleToggleMobilePortfolioDropdown}
                      className={`${baseLinkStyle} flex items-center`}
                      aria-expanded={isMobilePortfolioDropdownOpen}
                      aria-haspopup="true"
                    >
                      Portfolio
                      <svg
                        className={`ml-2 h-4 w-4 transition-transform ${isMobilePortfolioDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isMobilePortfolioDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-auto min-w-max rounded-md shadow-lg bg-black ring-1 ring-gray-800 z-50 py-1">
                        {GALLERIES.map((gallery) => (
                          <Link
                            key={gallery.localDir}
                            href={`/portfolio/${gallery.localDir}`}
                            className={mobilePortfolioItemStyle}
                            onClick={() => {
                              setIsMobilePortfolioDropdownOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            {gallery.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              if (link.name === 'Client Login') {
                if (isClientGalleryPage) {
                  return (
                    <button
                      key="logout-mobile"
                      onClick={handleLogout}
                      className={`${baseLinkStyle} text-red-500 hover:text-red-400 mr-3 sm:mr-4`}
                    >
                      Log Out
                    </button>
                  );
                }
              }
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`${pathname === link.href ? activeLinkStyle : baseLinkStyle} mr-3 sm:mr-4`}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  onClick={() => {
                    isMobileMenuOpen && setIsMobileMenuOpen(false);
                    isMobilePortfolioDropdownOpen && setIsMobilePortfolioDropdownOpen(false);
                  }}
                >
                  {link.name}
                </Link>
              );
            })}
            <button
              onClick={handleToggleMobileMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && !isMobilePortfolioDropdownOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 z-40 transform transition-transform duration-300 ease-in-out" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1 sm:px-3 px-2 bg-black border-t border-gray-800 shadow-lg rounded-b-md">
            {moreDropdownLinks.map((link) => {
              if (link.name === 'Client Login') {
                if (isClientGalleryPage) {
                  return null;
                }
              }
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={pathname === link.href ? mobileDropdownLinkActiveStyle : mobileDropdownLinkBaseStyle}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 