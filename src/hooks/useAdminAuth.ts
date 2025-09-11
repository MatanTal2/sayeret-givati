'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { AdminCredentials, FormMessage } from '@/types/admin';
import { ADMIN_CONFIG, ADMIN_MESSAGES } from '@/constants/admin';
import { UserType } from '@/types/user';
import { UserDataService } from '@/lib/userDataService';

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Check if user is admin by fetching their user data
          const userDataResult = await UserDataService.fetchUserDataByUid(user.uid);
          
          if (userDataResult.success && userDataResult.userData) {
            // Check if user has admin user type
            if (userDataResult.userData.userType === UserType.ADMIN) {
              setIsAuthenticated(true);
              // Clear any previous login messages when successfully authenticated
              setMessage(null);
            } else {
              setIsAuthenticated(false);
            }
          } else {
            // Fallback: check if user email matches admin config (for backward compatibility)
            if (user.email === ADMIN_CONFIG.EMAIL) {
              setIsAuthenticated(true);
              setMessage(null);
            } else {
              setIsAuthenticated(false);
            }
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          // Fallback to email check in case of error
          if (user.email === ADMIN_CONFIG.EMAIL) {
            setIsAuthenticated(true);
            setMessage(null);
          } else {
            setIsAuthenticated(false);
          }
        }
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

    // Try Firebase Authentication first
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      
      // Authentication successful, now check if user is admin
      try {
        const userDataResult = await UserDataService.fetchUserDataByUid(userCredential.user.uid);
        
        if (userDataResult.success && userDataResult.userData) {
          if (userDataResult.userData.userType === UserType.ADMIN) {
            setMessage({
              text: ADMIN_MESSAGES.LOGIN_SUCCESS,
              type: 'success'
            });
          } else {
            // User is authenticated but not an admin - sign them out
            await signOut(auth);
            setMessage({
              text: 'Access denied. Admin privileges required.',
              type: 'error'
            });
          }
        } else {
          // Fallback: check admin email for backward compatibility
          if (userCredential.user.email === ADMIN_CONFIG.EMAIL) {
            setMessage({
              text: ADMIN_MESSAGES.LOGIN_SUCCESS,
              type: 'success'
            });
          } else {
            // Not admin and no user data found - sign them out
            await signOut(auth);
            setMessage({
              text: 'Access denied. Admin privileges required.',
              type: 'error'
            });
          }
        }
      } catch (userDataError) {
        console.error('Error checking user admin status:', userDataError);
        // Fallback to email check
        if (userCredential.user.email === ADMIN_CONFIG.EMAIL) {
          setMessage({
            text: ADMIN_MESSAGES.LOGIN_SUCCESS,
            type: 'success'
          });
        } else {
          await signOut(auth);
          setMessage({
            text: 'Access denied. Admin privileges required.',
            type: 'error'
          });
        }
      }
      
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