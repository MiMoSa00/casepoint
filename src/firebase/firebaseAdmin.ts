import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Global instances with explicit types
let adminAuth: Auth;
let adminDb: Firestore;

const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    try {
      // Debug logging to check environment variables
      console.log('Firebase Admin Config:', {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKeyExists: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      });

      // Validate required environment variables
      if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
        throw new Error('Missing FIREBASE_ADMIN_PROJECT_ID');
      }
      if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
        throw new Error('Missing FIREBASE_ADMIN_CLIENT_EMAIL');
      }
      if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        throw new Error('Missing FIREBASE_ADMIN_PRIVATE_KEY');
      }

      // Initialize the app
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

// Initialize Firebase Admin on module load
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  // Don't throw here - let the app continue loading but services will be unavailable
}

export { adminAuth, adminDb };