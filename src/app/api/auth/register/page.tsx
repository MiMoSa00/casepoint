// src/app/api/auth/register/page.tsx

"use client";

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig'; // Ensure this path is correct
import { useRouter } from 'next/navigation'; // for programmatic navigation
import Link from 'next/link';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state before new submission

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/'); // Redirect to the dashboard after sign-up
    } catch (err) {
      console.log(err)
      // Check if the error has a message property
      if (err instanceof Error) {
        setError(err.message); // Safely access message if err is an instance of Error
      } else {
        setError("An unknown error occurred."); // Fallback for unknown error types
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Sign Up</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form >
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <button
           onClick={(e) => handleSignUp(e)}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-300"
          >
            Sign Up
          </button>
        </form>
       
        <p className="mt-4 text-sm">
          Already have an account? <Link href='/login' className="text-blue-600">Log in </Link>
        </p>
       
       
      </div>
    </div>
  );
};

export default RegisterPage;
