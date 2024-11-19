import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useEffect } from 'react';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // If already initialized, use that one
}

// Export Firebase services
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Set up a token refresh mechanism
    let tokenRefreshTimeout: NodeJS.Timeout;

    console.log(user, auth)
    // const refreshToken = async () => {
    //   try {
    //     // Get the current user
    //     const user = auth.currentUser;
    //     if (!user) {
    //       console.error('No user logged in');
    //       return;
    //     }
    
    //     // Get the current token expiration time
    //     const tokenResult = await user.getIdTokenResult();
    //     console.log(tokenResult)
    //     const expirationTime = tokenResult.expirationTime
    //       ? new Date(tokenResult.expirationTime).getTime()
    //       : 0;
    //     const now = new Date().getTime();
    //     console.log("Current time:", now);
    //     console.log("Token expiration time:", expirationTime);
    
    //     // If the token will expire in the next 5 minutes, refresh it
    //     if (expirationTime - now < 5 * 60 * 1000) {
    //       // Force refresh the token
    //       await user.getIdToken(true);
    //       console.log('Token refreshed successfully');
    //     }
    
    //     // Set up the next refresh
    //     tokenRefreshTimeout = setTimeout(refreshToken, 5 * 60 * 1000); // Refresh every 5 minutes
    //   } catch (error) {
    //     console.error('Token refresh error:', error);
    
    //     // If token refresh fails, try again in 1 minute
    //     tokenRefreshTimeout = setTimeout(refreshToken, 60 * 1000);
    //   }
    // };
    // const refreshToken = async () => {
    //   try {
        
    //     const user = auth.currentUser;
    //     if (!user) {
    //       console.error('No user logged in');
    //       return;
    //     }
    
    //     // Force refresh the token to ensure up-to-date data
    //     const tokenResult = await user.getIdTokenResult(true);
    //     console.log('Token details:', tokenResult);
    
    //     // Parse the expiration time and issued time
    //     const expirationTime = tokenResult.expirationTime 
    //       ? new Date(tokenResult.expirationTime).getTime() 
    //       : 0;
    //     const issuedAtTime = tokenResult.issuedAtTime 
    //       ? new Date(tokenResult.issuedAtTime).getTime() 
    //       : 0;
    //     const now = new Date().getTime();
    
    //     console.log('Current time:', now);
    //     console.log('Token issued at time:', issuedAtTime);
    //     console.log('Token expiration time:', expirationTime);
    
    //     // Check for any clock discrepancy and handle it
    //     if (expirationTime <= now) {
    //       console.warn(
    //         'Token appears expired (or very close to expiring). Refreshing immediately...'
    //       );
    //       await user.getIdToken(true); // Force refresh again
    //       console.log('Token refreshed successfully');
    //     } else if (expirationTime - now < 5 * 60 * 1000) {
    //       console.warn(
    //         'Token is expiring soon (less than 5 minutes remaining). Refreshing...'
    //       );
    //       await user.getIdToken(true); // Force refresh if close to expiration
    //       console.log('Token refreshed successfully');
    //     } else {
    //       console.log('Token is valid, no immediate refresh needed.');
    //     }
    
    //     // Adjust next refresh timing dynamically, based on expiration
    //     const bufferTime = 5 * 60 * 1000; // 5-minute buffer
    //     const nextRefreshTime = Math.max(expirationTime - now - bufferTime, bufferTime);
    //     console.log(`Scheduling next refresh in ${nextRefreshTime / 1000} seconds`);
    //     tokenRefreshTimeout = setTimeout(refreshToken, nextRefreshTime);
    
    //   } catch (error) {
    //     console.error('Token refresh error:', error);
    
    //     // Retry refreshing in 1 minute if there's an error
    //     tokenRefreshTimeout = setTimeout(refreshToken, 60 * 1000);
    //   }
    // };
    
    // refreshToken();
   
    // Initial token refresh
   
   

    // return () => {
    //   if (tokenRefreshTimeout) {
    //     clearTimeout(tokenRefreshTimeout);
    //   } 
    // };
    
  } else {
    console.log('no user logged in')
  }

});
const db = getFirestore(app);

// Enhanced token verification function with retry mechanism
// export const verifyFirebaseToken = async (forceRefresh = true): Promise<string> => {
//   try {
//     const user = auth.currentUser;
//     if (!user) {
//       throw new Error('User not authenticated');
//     }

//     // Try to get a fresh token
//     const token = await user.getIdToken(forceRefresh);
//     if (!token) {
//       throw new Error('Failed to get token');
//     }

//     return token;
//   } catch (error) {
//     console.error('Token verification error:', error);
//     throw error;
//   }
// };
export const verifyFirebaseToken = async (forceRefresh = true): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const tokenResult = await user.getIdTokenResult();
    const expirationTime = tokenResult.expirationTime
      ? new Date(tokenResult.expirationTime).getTime()
      : 0;
    const now = new Date().getTime();

    // If the token is about to expire in less than 5 minutes, force refresh
    const shouldRefresh = expirationTime - now < 5 * 60 * 1000 || forceRefresh;

    const token = await user.getIdToken(shouldRefresh);
    if (!token) {
      throw new Error('Failed to get token');
    }

    return token;
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};


// Utility function for making authenticated requests
export const makeAuthenticatedRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  let token: string;
  
  try {
    // First attempt with normal token
    token = await verifyFirebaseToken(false);
  } catch (error) {
    // If first attempt fails, try force refresh
    token = await verifyFirebaseToken(true);
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

// Example checkout implementation
export const handleCheckout = async (designData: any) => {
  try {
    let retries = 2; // Number of retry attempts
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        const result = await makeAuthenticatedRequest('/api/checkout', {
          method: 'POST',
          body: JSON.stringify(designData),
        });
        return result;
      } catch (error: any) {
        lastError = error;
        if (error.message.includes('token-expired') || error.message.includes('id-token-expired')) {
          retries--;
          if (retries > 0) {
            // Wait briefly before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        throw error;
      }
    }

    if (lastError) {
      throw lastError;
    }
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
};