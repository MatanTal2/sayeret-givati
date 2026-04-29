'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { sendVerificationEmail as sendVerificationEmailHelper } from '@/lib/firebasePhoneAuth';
import { ADMIN_CONFIG, ADMIN_MESSAGES } from '@/constants/admin';
import { UserDataService } from '@/lib/userDataService';
import { EnhancedAuthUser, UserType } from '@/types/user';
import { isRegistrationInProgress } from '@/lib/registrationFlowFlag';

// Types
export interface AuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  userType: UserType | null;
  militaryId?: string;
  rank?: string;
  firstName?: string;
  lastName?: string;
}

// Enhanced user type that includes Firestore data
export type { EnhancedAuthUser, FirestoreUserProfile } from '@/types/user';

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
  enhancedUser: EnhancedAuthUser | null; // Full user data from Firestore
  isAuthenticated: boolean;
  isLoading: boolean;
  message: FormMessage | null;
  
  // Actions
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearMessage: () => void;
  refreshEnhancedUser: () => Promise<void>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  refreshEmailVerified: () => Promise<void>;
  
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
  const [enhancedUser, setEnhancedUser] = useState<EnhancedAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Computed values
  const isAuthenticated = user !== null;

  // Initialize auth state listener with Firestore data fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Always fetch user data from Firestore to get the most up-to-date user type
        // Fallback to email-based admin check only if Firestore data is unavailable
        let userType: UserType | null = null;
        
        try {
          console.log('🔍 Fetching user data from Firestore...');
          const userDataResult = await UserDataService.fetchUserDataByUid(firebaseUser.uid);
          
          if (!userDataResult.success || !userDataResult.userData) {
            // No Firestore profile: this user is either an admin without a
            // profile yet, or an orphan from an abandoned registration. We
            // do NOT trust Firebase Auth alone — sign them out unless they
            // are actively progressing through the registration flow.
            if (!isRegistrationInProgress()) {
              console.warn('[AuthContext] No Firestore profile; signing out orphan auth user');
              try { await signOut(auth); } catch (signOutErr) { console.error(signOutErr); }
              setUser(null);
              setEnhancedUser(null);
              setIsLoading(false);
              return;
            }
          }

          if (userDataResult.success && userDataResult.userData) {
            const firestoreData = userDataResult.userData;
            userType = firestoreData.userType;
            
            // Create enhanced user object with all data
            const enhanced: EnhancedAuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              displayName: firebaseUser.displayName || undefined,
              emailVerified: firebaseUser.emailVerified,
              userType,
              firstName: firestoreData.firstName,
              lastName: firestoreData.lastName,
              gender: firestoreData.gender,
              birthday: firestoreData.birthday,
              phoneNumber: firestoreData.phoneNumber,
              rank: firestoreData.rank,
              role: firestoreData.role,
              status: firestoreData.status,
              militaryPersonalNumberHash: firestoreData.militaryPersonalNumberHash,
              permissions: firestoreData.permissions,
              joinDate: firestoreData.joinDate,
              profileImage: firestoreData.profileImage,
              testUser: firestoreData.testUser,
              teamId: firestoreData.teamId,
              communicationPreferences: firestoreData.communicationPreferences,
              initials: UserDataService.generateInitials(firestoreData)
            };
            
            setUser(enhanced);
            setEnhancedUser(enhanced);
            console.log('✅ Enhanced user data loaded with userType:', userType);
          } else {
            // Fallback: use email-based admin check if no Firestore data
            userType = firebaseUser.email === ADMIN_CONFIG.EMAIL ? UserType.ADMIN : null;
            
            const authUser: AuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              displayName: firebaseUser.displayName || undefined,
              userType,
            };

            setUser(authUser);
            setEnhancedUser({ ...authUser, emailVerified: firebaseUser.emailVerified });
            console.log('⚠️ Could not fetch user data from Firestore, using Firebase Auth data only with userType:', userType);
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
          // Fallback: use email-based admin check if error occurs
          userType = firebaseUser.email === ADMIN_CONFIG.EMAIL ? UserType.ADMIN : null;

          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            displayName: firebaseUser.displayName || undefined,
            userType,
          };
          
          setUser(authUser);
          setEnhancedUser({ ...authUser, emailVerified: firebaseUser.emailVerified });
          console.log('❌ Error loading user data, using fallback with userType:', userType);
        }
        
        // Clear any previous login messages when successfully authenticated
        setMessage(null);
      } else {
        // User is signed out
        setUser(null);
        setEnhancedUser(null);
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
      // Remove email-based admin validation - admin status will be checked via UserType

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

  const refreshEnhancedUser = async (): Promise<void> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    const result = await UserDataService.fetchUserDataByUid(firebaseUser.uid);
    if (!result.success || !result.userData) return;
    const firestoreData = result.userData;
    const refreshed: EnhancedAuthUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || undefined,
      displayName: firebaseUser.displayName || undefined,
      emailVerified: firebaseUser.emailVerified,
      userType: firestoreData.userType,
      firstName: firestoreData.firstName,
      lastName: firestoreData.lastName,
      gender: firestoreData.gender,
      birthday: firestoreData.birthday,
      phoneNumber: firestoreData.phoneNumber,
      rank: firestoreData.rank,
      role: firestoreData.role,
      status: firestoreData.status,
      militaryPersonalNumberHash: firestoreData.militaryPersonalNumberHash,
      permissions: firestoreData.permissions,
      joinDate: firestoreData.joinDate,
      profileImage: firestoreData.profileImage,
      testUser: firestoreData.testUser,
      teamId: firestoreData.teamId,
      communicationPreferences: firestoreData.communicationPreferences,
      initials: UserDataService.generateInitials(firestoreData),
    };
    setUser(refreshed);
    setEnhancedUser(refreshed);
  };

  const resendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return { success: false, error: 'No authenticated user' };
    try {
      await sendVerificationEmailHelper(firebaseUser);
      return { success: true };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'unknown',
      };
    }
  };

  const refreshEmailVerified = async (): Promise<void> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    await firebaseUser.reload();
    setEnhancedUser((prev) => (prev ? { ...prev, emailVerified: firebaseUser.emailVerified } : prev));
  };

  const contextValue: AuthContextType = {
    // State
    user,
    enhancedUser,
    isAuthenticated,
    isLoading,
    message,

    // Actions
    login,
    logout,
    clearMessage,
    refreshEnhancedUser,
    resendVerificationEmail,
    refreshEmailVerified,

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