// components/StripeProvider.tsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import React, { ReactNode } from 'react';

const stripePromise: Promise<Stripe | null> = loadStripe('your_publishable_key');

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
