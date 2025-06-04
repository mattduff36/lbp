'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientLoginForm from '../components/ClientLoginForm';

export default function ClientLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (username: string, password: string) => {
    try {
      // In a real implementation, you would validate against a database
      // For now, we'll just redirect to the client's gallery page
      router.push(`/client-login/${username}`);
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat">
            Client Login
          </h1>
          <p className="text-gray-400 mt-2">Enter your credentials to view your photos</p>
        </div>
        
        <ClientLoginForm onLogin={handleLogin} error={error} />
      </div>
    </div>
  );
} 