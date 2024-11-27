// lib/firebaseAdmin.ts

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { db } from '@/db'; // Assuming Prisma is your main DB

// Global instances with explicit types
let adminAuth: Auth;
let adminDb: Firestore;

// Initialize Firebase Admin
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    try {
      console.log('Initializing Firebase Admin...');

      // Validate environment variables
      if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        throw new Error('Firebase admin credentials are missing');
      }

      // Initialize Firebase Admin
      const app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });

      // Initialize Auth and Firestore
      adminAuth = getAuth(app);
      adminDb = getFirestore(app);

      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      throw error;
    }
  }

  return { adminAuth, adminDb };
};

// Initialize Firebase Admin
initializeFirebaseAdmin();

// Verify Firebase ID token
export const getFirebaseUser = async (idToken: string) => {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw new Error("Authentication failed");
  }
};

// Check user status and create if not exists in Prisma (Primary DB)
export const getAuthStatus = async (idToken: string) => {
  try {
    // Get Firebase user data (UID and email)
    const firebaseUser = await getFirebaseUser(idToken);
    const { uid, email } = firebaseUser;

    if (!uid || !email) {
      throw new Error("Invalid user data");
    }

    // Check if the user exists in the Prisma DB using the Firebase UID (assumed to be stored as firebaseUid)
    const existingUser = await db.user.findFirst({
      where: { firebaseUid: uid },
    });

    // If the user doesn't exist, create a new user in Prisma DB
    if (!existingUser) {
      await db.user.create({
        data: {
          firebaseUid: uid, // Store Firebase UID in Prisma DB
          email: email,
        },
      });
    }

    // Return a success response with the user data
    return { success: true, user: { id: uid, email: email } };

  } catch (error) {
    console.error("Error in getAuthStatus:", error);
    throw new Error("Authentication failed");
  }
};

// Export Firebase Admin instances for use elsewhere
export { adminAuth, adminDb };
