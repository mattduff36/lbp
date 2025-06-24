'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ClientManagement from '../components/ClientManagement';
import AdminDashboard from '../components/AdminDashboard';

type AdminTab = 'clientManagement' | 'manualSync';

export default function AdminPage() {
  const router = useRouter();
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('clientManagement');

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsCheckingAuth(true);
      try {
        const response = await fetch('/api/admin/clients');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          if (response.status !== 401) {
            console.warn('Auth check failed with status:', response.status);
          }
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (response.ok) {
        setIsAuthenticated(true);
        setPasswordInput('');
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid password');
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Error during admin login:', err);
      setError('Login request failed. Please try again.');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // This logout handler is now primarily for the components within the tabs
  const handleLogoutForTabs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/');
      } else {
        console.error('Logout failed on server, forcing client logout.');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error logging out:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="text-white">Checking authentication...</div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-grow bg-gradient-to-br from-red-950 via-black to-red-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat">
              Admin Access
            </h1>
            <p className="text-gray-400 mt-2">Enter your credentials to manage the site</p>
          </div>
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  id="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-LBPBlue focus:border-LBPBlue"
                  required
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
              <button
                type="submit"
                className="w-full px-6 py-2.5 bg-LBPBlue text-white font-medium rounded-md shadow-lg border-2 border-LBPBlue/70 hover:bg-LBPBlue/80 hover:border-LBPBlue hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-LBPBlue focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-150 ease-in-out disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-red-950 text-white">
      <div className="max-w-4xl mx-auto px-8">
        {/* Tabs Navigation - Centered with Logout Button */}
        <div className="relative flex justify-center items-center">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('clientManagement')}
              className={`whitespace-nowrap py-4 px-3 border-b-2 font-montserrat tracking-wider uppercase text-sm font-medium 
                ${activeTab === 'clientManagement' 
                  ? 'border-LBPBlue text-LBPBlue' 
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
                focus:outline-none transition-colors duration-150 ease-in-out
              `}
            >
              <span className="md:hidden">Clients</span>
              <span className="hidden md:inline">Client Management</span>
            </button>
            <button
              onClick={() => setActiveTab('manualSync')}
              className={`whitespace-nowrap py-4 px-3 border-b-2 font-montserrat tracking-wider uppercase text-sm font-medium
                ${activeTab === 'manualSync' 
                  ? 'border-LBPBlue text-LBPBlue' 
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
                focus:outline-none transition-colors duration-150 ease-in-out
              `}
            >
              <span className="md:hidden">Syncing</span>
              <span className="hidden md:inline">Manual Syncing</span>
            </button>
          </nav>
          <button
            onClick={handleLogoutForTabs}
            className="absolute right-0 px-4 py-1.5 bg-red-600 text-white font-medium rounded-md shadow-lg border-2 border-red-600/70 hover:bg-red-700 hover:border-red-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-150 ease-in-out disabled:opacity-50"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Fading Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

      {/* Tab Content Area */}
      <div className="max-w-4xl mx-auto px-8">
        <div className="py-8">
          {activeTab === 'clientManagement' && <ClientManagement onLogout={handleLogoutForTabs} />}
          {activeTab === 'manualSync' && <AdminDashboard onLogout={handleLogoutForTabs} />}
        </div>
      </div>
    </div>
  );
} 