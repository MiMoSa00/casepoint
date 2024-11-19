"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken
} from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const updateToken = async (currentUser: User): Promise<string | null> => {
    try {
      const newToken = await getIdToken(currentUser, true); // Force refresh
      setToken(newToken);
      return newToken;
    } catch (error) {
      console.error('Error getting token:', error);
      setToken(null);
      return null;
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    if (!user) {
      console.error('No user found when attempting to refresh token');
      return null;
    }

    try {
      const freshToken = await getIdToken(user, true); // Force refresh
      setToken(freshToken);
      return freshToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let tokenRefreshInterval: NodeJS.Timeout;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      try {
        if (firebaseUser) {
          await firebaseUser.reload();
          const freshToken = await getIdToken(firebaseUser, true);
          setUser(firebaseUser);
          setIsAuthenticated(true);
          setToken(freshToken);

          // Refresh token every 50 minutes (before the 1-hour expiration)
          tokenRefreshInterval = setInterval(async () => {
            if (firebaseUser) {
              await updateToken(firebaseUser);
            }
          }, 50 * 60 * 1000); // 50 minutes
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setToken(null);
        }
      } catch (error) {
        console.error('Error during auth state change:', error);
        setUser(null);
        setIsAuthenticated(false);
        setToken(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const freshToken = await getIdToken(result.user, true);
      setUser(result.user);
      setIsAuthenticated(true);
      setToken(freshToken);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(newUser, { displayName });
      const freshToken = await getIdToken(newUser, true);
      setUser(newUser);
      setIsAuthenticated(true);
      setToken(freshToken);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const freshToken = await getIdToken(result.user, true);
      setUser(result.user);
      setIsAuthenticated(true);
      setToken(freshToken);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Add the missing functions
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const updateUserProfile = async (displayName: string) => {
    try {
      if (!user) throw new Error('No user logged in');
      await updateProfile(user, { displayName });
      // Force refresh the user object to get updated data
      await user.reload();
      setUser({ ...user });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    setUser,
    loading,
    isAuthenticated,
    token,
    signIn,
    signUp,
    logout,
    signInWithGoogle,
    resetPassword,
    updateUserProfile,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}