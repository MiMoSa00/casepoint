"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';

// Check if the key exists and log an error if it doesn't
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey) {
  console.error('WARNING: Stripe publishable key is missing. Make sure to add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env.local file');
}

// Initialize Stripe with error handling
const stripePromise = stripeKey 
  ? loadStripe(stripeKey)
  : Promise.reject('No Stripe key available');

const Providers = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }));

  // Define options with correct typing
  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
    },
    // Only add clientSecret if you're using Payment Intents
    // If you're using Payment Elements without a clientSecret, you can remove this
    // mode: 'payment', // Use this instead of clientSecret if you're using Payment Element
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {stripeKey ? (
          <Elements stripe={stripePromise} options={options}>
            <Navbar />
            <main className="flex grainy-dark flex-col min-h-[calc(100vh-3.5rem-1px)]">
              <div className="flex-1 flex flex-col h-full">
                {children}
              </div>
              <Footer />
            </main>
            <Toaster />
          </Elements>
        ) : (
          <>
            <Navbar />
            <main className="flex grainy-dark flex-col min-h-[calc(100vh-3.5rem-1px)]">
              <div className="flex-1 flex flex-col h-full">
                {children}
              </div>
              <Footer />
            </main>
            <Toaster />
          </>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default Providers;