import { db } from "@/db";
import { adminAuth } from "@/firebase/firebaseAdmin";
import { User } from "@prisma/client";

/**
 * Gets or creates a user based on their Firebase UID
 */
export async function getOrCreateUser(firebaseUid: string): Promise<User> {
  try {
    // First try to find existing user
    let user = await db.user.findUnique({
      where: {
        firebaseUid: firebaseUid,
      },
    });

    if (!user) {
      console.log(`[User Service] User ${firebaseUid} not found in Prisma, fetching from Firebase`);
      
      // Get Firebase user data
      const firebaseUser = await adminAuth.getUser(firebaseUid);
      
      if (!firebaseUser.email) {
        throw new Error("Firebase user missing email");
      }

      // Create new user in Prisma
      user = await db.user.create({
        data: {
          firebaseUid: firebaseUid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || '',
          imageUrl: firebaseUser.photoURL || '',
        },
      });

      console.log(`[User Service] Created new user in Prisma:`, user);
    }

    return user;
  } catch (error) {
    console.error('[User Service] Error in getOrCreateUser:', error);
    throw error;
  }
}

/**
 * Gets a user by their Firebase UID
 */
export async function getUser(firebaseUid: string): Promise<User | null> {
  try {
    return await getOrCreateUser(firebaseUid);
  } catch (error) {
    console.error('[User Service] Error in getUser:', error);
    throw error;
  }
}

/**
 * Syncs a Firebase user with Prisma database
 */
export interface FirebaseUserData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export async function syncUserWithPrisma(firebaseUser: FirebaseUserData): Promise<User> {
  if (!firebaseUser?.uid) {
    throw new Error('No Firebase user provided');
  }

  return await getOrCreateUser(firebaseUser.uid);
}