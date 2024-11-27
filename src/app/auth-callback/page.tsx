'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const [configId, setConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const configurationId = localStorage.getItem('configurationId');
    if (configurationId) {
      setConfigId(configurationId);
    }
  }, []);

  const handleAuthCallback = async (idToken: string) => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      // Call the server action to check the user and create if necessary
      const response = await fetch('/api/auth-callback/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      console.log('API response:', data); // Debugging line

      if (response.ok) {
        setUser(data.user);
        // Handle success, maybe store user in state or redirect
        if (configId) {
          localStorage.removeItem('configurationId');
          router.push(`/configure/preview?id=${configId}`);
        } else {
          router.push('/'); // Redirect to home page
        }
        
      } else {
        throw new Error(data.error || 'Failed to sync user');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  // You can replace this with actual logic to get the ID token
  useEffect(() => {
    const idToken = localStorage.getItem('idToken'); // Assuming you have stored the token in localStorage
    if (idToken) {
      handleAuthCallback(idToken);
    } else {
      setError('No ID token found.');
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="w-full mt-24 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <h3 className="font-semibold text-xl">Logging you in...</h3>
          <p>You will be redirected automatically.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mt-24 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <h3 className="font-semibold text-xl text-red-500">Authentication failed</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="w-full mt-24 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <h3 className="font-semibold text-xl">Welcome, {user.email}</h3>
          <p>Your account is now synced.</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
