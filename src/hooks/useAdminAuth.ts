'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { AdminCredentials, FormMessage } from '@/types/admin';
import { ADMIN_CONFIG, ADMIN_MESSAGES } from '@/constants/admin';

interface UseAdminAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  message: FormMessage | null;
  showLogoutModal: boolean;
  login: (credentials: AdminCredentials) => Promise<void>;
  requestLogout: () => void;
  confirmLogout: () => Promise<void>;
  cancelLogout: () => void;
  checkSession: () => void;
  clearMessage: () => void;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [, setCurrentUser] = useState<User | null>(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Check if user is admin
      if (user && user.email === ADMIN_CONFIG.EMAIL) {
        setIsAuthenticated(true);
        // Clear any previous login messages when successfully authenticated
        setMessage(null);
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkSession = () => {
    // Firebase Auth handles session management automatically
    // No need for manual session checking
  };

  const login = async (credentials: AdminCredentials) => {
    setIsLoading(true);
    setMessage(null);

    // If admin email is not set in env, always fail
    if (!ADMIN_CONFIG.EMAIL) {
      setMessage({
        text: 'Admin login is not configured. Please contact the system administrator.',
        type: 'error'
      });
      setIsLoading(false);
      return;
    }

    // Step 1: Validate email matches admin email
    if (credentials.email !== ADMIN_CONFIG.EMAIL) {
      setMessage({
        text: 'Invalid email. Please try again.', // Generic error for security
        type: 'error'
      });
      setIsLoading(false);
      return;
    }

    // Step 2: Try Firebase Authentication
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      
      // If we get here, login was successful
      // The onAuthStateChanged listener will handle setting isAuthenticated
      setMessage({
        text: ADMIN_MESSAGES.LOGIN_SUCCESS,
        type: 'success'
      });
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      // Handle specific Firebase Auth errors
      let errorMessage = 'Invalid credentials. Please try again.'; // Generic error
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        
        if (firebaseError.code === 'auth/user-not-found') {
          errorMessage = 'Invalid credentials. Please try again.';
        } else if (firebaseError.code === 'auth/wrong-password') {
          errorMessage = 'Invalid credentials. Please try again.';
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = 'Invalid credentials. Please try again.';
        } else if (firebaseError.code === 'auth/too-many-requests') {
          errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (firebaseError.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      setMessage({
        text: errorMessage,
        type: 'error'
      });
    }

    setIsLoading(false);
  };

  const requestLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setMessage(null);
      setShowLogoutModal(false);
    } catch (error) {
      console.error('Logout error:', error);
      setMessage({
        text: 'Logout failed. Please try again.',
        type: 'error'
      });
      setShowLogoutModal(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const clearMessage = () => {
    setMessage(null);
  };

  return {
    isAuthenticated,
    isLoading,
    message,
    showLogoutModal,
    login,
    requestLogout,
    confirmLogout,
    cancelLogout,
    checkSession,
    clearMessage
  };
} 