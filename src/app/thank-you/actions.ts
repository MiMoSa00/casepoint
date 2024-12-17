"use server";

import { db } from "@/db";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

// Firebase configuration (replace these with your actual Firebase project config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Function to get the currently logged-in user.
 * It validates user presence and required properties (id and email).
 */
export const getUser = async (): Promise<User> => {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(
      auth,
      (user) => {
        if (user && user.uid && user.email) {
          resolve(user);
        } else {
          reject(new Error("You must be logged in to access this feature."));
        }
      },
      (error) => {
        reject(error); // Handle Firebase errors
      }
    );
  });
};

/**
 * Function to validate user and fetch orders based on the logged-in user.
 */
export const getPaymentStatus = async ({ orderId }: { orderId: string }) => {
  try {
    const user = await getUser();
    console.log("Logged-in User:", { id: user.uid, email: user.email });

    // Fetch the user's order
    const order = await db.order.findFirst({
      where: { id: orderId, userId: user.uid },
      include: {
        billingAddress: true, 
        configuration: true,
        shippingAddress: true,
        user: true,
      }
    });

    if (!order) {
      throw new Error("This order does not exist.");
    }
     if(order.isPaid) {
        return order;  
     } else {
        return false
     }

    
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
      throw new Error(error.message);
    } else {
      console.error("Unexpected error:", error);
      throw new Error("An unexpected error occurred.");
    }
  }
};
