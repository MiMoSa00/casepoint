'use server'

import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { cookies } from 'next/headers';
import { DecodedIdToken } from 'firebase-admin/auth';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Stripe with the current API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia',
});

// Initialize Firebase Admin with improved error handling
const initializeFirebaseAdmin = () => {
  // console.log( ':::::::::::::::' ,process.env.FIREBASE_ADMIN_PROJECT_ID,  process.env.FIREBASE_ADMIN_CLIENT_EMAIL)
  // console.log('::::::::::::::::::::::' ,process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'))
  try {
    // Check if already initialized
    if (getApps().length > 0) {
      return getApps()[0];
    }

    // Validate required environment variables
    if (!process.env.FIREBASE_ADMIN_PROJECT_ID ||
        !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
        !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      throw new Error('Missing Firebase Admin environment variables');
    }
   
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });

  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin');
  }
};

// Function to get Firestore instance
const getDb = () => {
  initializeFirebaseAdmin();
  return getFirestore();
};

interface VerifyTokenResponse {
  success: boolean;
  decodedToken: DecodedIdToken | null;
  error?: string;
}

export async function verifyFirebaseToken(token: string): Promise<VerifyTokenResponse> {
  if (!token) {
    return {
      success: false,
      decodedToken: null,
      error: 'No token provided'
    };
  }

  try {
    initializeFirebaseAdmin();
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token, true);
    
    return {
      success: true,
      decodedToken
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return {
      success: false,
      decodedToken: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function verifyFirebaseTokenWithUid(
  token: string,
  uid: string
): Promise<VerifyTokenResponse> {
  const result = await verifyFirebaseToken(token);

  if (!result.success || !result.decodedToken) {
    return result;
  }

  if (result.decodedToken.uid !== uid) {
    return {
      success: false,
      decodedToken: null,
      error: 'UID mismatch'
    };
  }

  return result;
}

interface CreateCheckoutSessionOptions {
  configId: string;
  uid: string;
  token: string;
}

interface CheckoutSessionResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// Helper function to get price ID from config ID
async function getPriceIdFromConfigId(configId: string): Promise<string> {
  try {
    const db = getDb();
    
    // Get the configuration document
    const configDoc = await db.collection('configs').doc(configId).get();
    
    if (!configDoc.exists) {
      throw new Error('Configuration not found');
    }

    const configData = configDoc.data();

    // Check if there's a direct priceId field
    if (configData?.priceId) {
      return configData.priceId;
    }

    // If there's no direct priceId, we might need to create one
    const amount = configData?.amount || configData?.price;
    if (!amount) {
      throw new Error('No price information found in configuration');
    }

    // Create a new price in Stripe if needed
    const product = await stripe.products.create({
      name: `Configuration ${configId}`,
      metadata: {
        configId: configId
      }
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd', // Change this if you use a different currency
      recurring: {
        interval: 'month' // Change this if you want different billing interval
      }
    });

    // Store the price ID in your config document for future use
    await db.collection('configs').doc(configId).update({
      priceId: price.id,
      stripeProductId: product.id
    });

    return price.id;
  } catch (error) {
    console.error('Error getting price ID:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get price ID');
  }
}

export async function createCheckoutSession({
  configId,
  uid,
  token
}: CreateCheckoutSessionOptions): Promise<CheckoutSessionResponse> {
  try {
    // First verify the token
    const tokenVerification = await verifyFirebaseTokenWithUid(token, uid);
    if (!tokenVerification.success) {
      if (tokenVerification.error?.includes('Firebase ID token has expired')) {
        return {
          success: false,
          error: 'Token expired. Please re-authenticate.'
        };
      }
      return {
        success: false,
        error: tokenVerification.error || 'Authentication failed'
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing Stripe secret key');
    }

    // Get the price ID for this configuration
    const priceId = await getPriceIdFromConfigId(configId);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      client_reference_id: uid,
      metadata: {
        userId: uid,
        configId: configId
      },
    });

    return { 
      success: true,
      url: session.url || undefined
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session'
    };
  }
}