'use client';

import { useState, useEffect } from 'react';
import AdminDashboard from '@/app/components/AdminDashboard';

const ADMIN_PASSWORD = 'mpdee2025';
const AUTH_KEY = 'isAdminAuthenticated';

export default function AdminPage() {
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check sessionStorage on initial load
    if (sessionStorage.getItem(AUTH_KEY) === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem(AUTH_KEY, 'true');
      setError('');
      setPasswordInput(''); // Clear password input
    } else {
      setError('Invalid password');
      sessionStorage.removeItem(AUTH_KEY);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(AUTH_KEY);
    setPasswordInput('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center text-LBPBlue">Admin Access</h1>
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
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full bg-LBPBlue hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-LBPBlue focus:ring-opacity-50"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
} 