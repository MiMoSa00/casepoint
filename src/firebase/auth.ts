import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  Auth,
  User
} from 'firebase/auth';
import { auth } from './firebaseConfig';

// Function to refresh the ID token with retry logic
export async function refreshToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  
  if (user) {
    try {
      const newToken = await user.getIdToken(forceRefresh);
      return newToken;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error refreshing token:', error.message);
      } else {
        console.error('Unknown error refreshing token:', String(error));
      }
      throw error;
    }
  }
  return null;
}

// Enhanced wrapper for authenticated API calls
export const authenticatedFetch = async <T>(
  callback: (token: string) => Promise<T>
): Promise<T> => {
  try {
    const token = await refreshToken(true);
    if (!token) {
      throw new Error('No authentication token available');
    }
    return await callback(token);
  } catch (error) {
    // If the error is due to token expiration, try one more time
    if (error instanceof Error && 
        (error.message.includes('token-expired') || 
         error.message.includes('id-token-expired'))) {
      const retryToken = await refreshToken(true);
      if (retryToken) {
        return await callback(retryToken);
      }
    }
    throw error;
  }
};

// Function to set up authentication state listener with token refresh
export async function setupAuthListener(): Promise<string | null> {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await refreshToken(true);
          resolve(token);
        } catch (error: unknown) {
          console.error('Error getting token in auth listener:',
            error instanceof Error ? error.message : String(error));
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
}

// Function to handle user sign-up
export const signUp = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Sign up error:', error.message);
      throw new Error(`Failed to create account: ${error.message}`);
    }
    throw new Error('An unknown error occurred during sign up');
  }
};

// Function to handle user login
export const login = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Login error:', error.message);
      throw new Error(`Login failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during login');
  }
};

// Function to log the user out
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Logout error:', error.message);
      throw new Error(`Logout failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during logout');
  }
};

// Helper function to get current auth state
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Enhanced helper function to get current ID token with automatic refresh
export const getCurrentToken = async (): Promise<string | null> => {
  const user = getCurrentUser();
  if (!user) return null;

  try {
    return await refreshToken(true);
  } catch (error: unknown) {
    console.error('Error getting current token:',
      error instanceof Error ? error.message : String(error));
    return null;
  }
};

// Example usage for authenticated API calls
export const makeAuthenticatedRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  return authenticatedFetch(async (token) => {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  });
};