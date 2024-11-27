import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration object (should be in your .env)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase app
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth();
const db = getFirestore(app);

// Token refresh logic for when a user is logged in
export const refreshUserToken = async (user: User, forceRefresh = true): Promise<string> => {
  try {
    const tokenResult = await user.getIdTokenResult(forceRefresh);
    const expirationTime = tokenResult.expirationTime ? new Date(tokenResult.expirationTime).getTime() : 0;
    const now = new Date().getTime();

    // If the token expires in less than 5 minutes, refresh it
    if (expirationTime - now < 5 * 60 * 1000 || forceRefresh) {
      console.log('Token is expiring soon or force-refresh requested, refreshing...');
      await user.getIdToken(true);
    }

    return user.getIdToken();
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

// Make authenticated API requests using Firebase token
export const makeAuthenticatedRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  let token: string;

  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    token = await refreshUserToken(user, false); // Attempt without forcing refresh
  } catch (error) {
    // If token refresh fails, force a refresh and try again
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    token = await refreshUserToken(user, true);
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response.json();
};

export { auth, db };
