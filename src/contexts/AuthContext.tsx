'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { ADMIN_CONFIG, ADMIN_MESSAGES } from '@/constants/admin';

// Types
export interface AuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  userType: 'admin' | 'personnel' | null;
  militaryId?: string;
  rank?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface FormMessage {
  text: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface AuthContextType {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  message: FormMessage | null;
  
  // Actions
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearMessage: () => void;
  
  // UI State
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Computed values
  const isAuthenticated = user !== null;

  // Initialize auth state listener (reused from useAdminAuth)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Determine user type based on email
        const userType = firebaseUser.email === ADMIN_CONFIG.EMAIL ? 'admin' : 'personnel';
        
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || undefined,
          userType,
        };

        // TODO: For personnel users, fetch additional data from Firestore
        // (military ID, rank, etc.) in future steps
        
        setUser(authUser);
        // Clear any previous login messages when successfully authenticated
        setMessage(null);
      } else {
        // User is signed out
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Enhanced login function (based on useAdminAuth logic)
  const login = async (credentials: AuthCredentials): Promise<void> => {
    setIsLoading(true);
    setMessage(null);

    try {
      // For admin login, validate email first
      if (credentials.email === ADMIN_CONFIG.EMAIL) {
        if (!ADMIN_CONFIG.EMAIL) {
          setMessage({
            text: 'Admin login is not configured. Please contact the system administrator.',
            type: 'error'
          });
          setIsLoading(false);
          return;
        }
      }

      // Attempt Firebase Authentication
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      
      // Success message will be handled by onAuthStateChanged
      setMessage({
        text: ADMIN_MESSAGES.LOGIN_SUCCESS,
        type: 'success'
      });
      
      // Close modal on successful login
      setShowAuthModal(false);
      
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      // Handle specific Firebase Auth errors (reused from useAdminAuth)
      let errorMessage = 'Invalid credentials. Please try again.';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        
        switch (firebaseError.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-email':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid credentials. Please try again.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'auth/api-key-not-valid':
            errorMessage = 'Authentication service unavailable. Please try again later.';
            break;
          default:
            errorMessage = 'Login failed. Please try again.';
        }
      }
      
      setMessage({
        text: errorMessage,
        type: 'error'
      });
    }

    setIsLoading(false);
  };

  // Logout function (reused from useAdminAuth)
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setUser(null);
      setShowAuthModal(false);
      setMessage(null);
    } catch (error) {
      console.error('Logout error:', error);
      setMessage({
        text: 'Logout failed. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage(null);
  };

  const contextValue: AuthContextType = {
    // State
    user,
    isAuthenticated,
    isLoading,
    message,
    
    // Actions
    login,
    logout,
    clearMessage,
    
    // UI State
    showAuthModal,
    setShowAuthModal,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 