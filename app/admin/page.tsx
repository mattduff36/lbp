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
        setIsAuthenticated(false);
        // Reset active tab to default or last known, though it will go to login form anyway
        setActiveTab('clientManagement'); 
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
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat mb-8 text-center">
            Admin Access
          </h1>
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
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4">
      {/* Tabs Navigation - Centered */}
      <div className="mb-2 border-b border-gray-700 flex justify-center">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('clientManagement')}
            className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium text-base 
              ${activeTab === 'clientManagement' 
                ? 'border-LBPBlue text-LBPBlue' 
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
              focus:outline-none transition-colors duration-150 ease-in-out
            `}
          >
            Client Management
          </button>
          <button
            onClick={() => setActiveTab('manualSync')}
            className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium text-base 
              ${activeTab === 'manualSync' 
                ? 'border-LBPBlue text-LBPBlue' 
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
              focus:outline-none transition-colors duration-150 ease-in-out
            `}
          >
            Manual Syncing
          </button>
        </nav>
      </div>

      {/* Tab Content Area */}
      <div className="pb-8">
        {activeTab === 'clientManagement' && <ClientManagement onLogout={handleLogoutForTabs} />}
        {activeTab === 'manualSync' && <AdminDashboard onLogout={handleLogoutForTabs} />}
      </div>
    </div>
  );
} 