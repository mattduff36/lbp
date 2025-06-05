'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientLoginForm from '../components/ClientLoginForm';

export default function ClientLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (username: string, password: string) => {
    setError(null); // Clear previous errors

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim(); // Also trim password

    if (!trimmedUsername) {
      setError("Username is required.");
      return;
    }

    if (!trimmedPassword) {
      setError("Password is required.");
      return;
    }

    try {
      const response = await fetch('/api/clients/validate-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmedUsername, password: trimmedPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Credentials are valid, proceed to gallery
        router.push(`/client-login/${trimmedUsername}`);
      } else {
        // Invalid credentials or other server-side error reported by the API
        setError(data.message || 'Invalid username or password. Please try again.');
      }
    } catch (err) {
      console.error("Login process error:", err);
      setError('An unexpected error occurred during login. Please check your connection and try again.');
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