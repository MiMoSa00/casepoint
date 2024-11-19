import { adminAuth, adminDb } from './firebaseAdmin';

export const checkFirebaseAdmin = () => {
  if (!adminAuth || !adminDb) {
    throw new Error('Firebase Admin not properly initialized. Please check your environment variables.');
  }
  return { adminAuth, adminDb };
};