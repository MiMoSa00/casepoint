"use server"

import { adminAuth } from '@/firebase/firebaseAdmin'; // Keep Firebase Admin SDK
import { db } from '@/db';

// Function to get the current logged-in user using Firebase Admin SDK
const getFirebaseUser = async (idToken: string) => {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw new Error("Authentication failed");
  }
};

// Server-side function to check user in DB and create if doesn't exist
export const getAuthStatus = async (idToken: string) => {
  try {
    // Get Firebase user data (UID, email)
    const firebaseUser = await getFirebaseUser(idToken);
    const { uid, email } = firebaseUser;

    if (!uid || !email) {
      throw new Error("Invalid user data");
    }

    // Check if the user exists in the database
    const existingUser = await db.user.findFirst({
      where: { firebaseUid: uid }, // Assumes firebaseUid is stored in your DB
    });

    // If the user doesn't exist, create a new one
    if (!existingUser) {
      await db.user.create({
        data: {
          firebaseUid: uid, // Store the Firebase UID in DB
          email: email,
        },
      });
    }

    // Return a success response
    return { success: true, user: { id: uid, email: email } };

  } catch (error) {
    console.error("Error in getAuthStatus:", error);
    throw new Error("Authentication failed");
  }
};
