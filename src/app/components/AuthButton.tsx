'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT_CONSTANTS } from '@/constants/text';
import { ChevronDownIcon, UserIcon, CogIcon, LogOutIcon, LogInIcon, BellIcon, Settings2Icon } from 'lucide-react';
import { UserDataService } from '@/lib/userDataService';
import { FirestoreUserProfile } from '@/types/user';
import { UserRole } from '@/types/equipment';
import Link from 'next/link';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function AuthButton() {
  const { user, enhancedUser, isAuthenticated, isLoading, logout, setShowAuthModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Helper function to check if user has management access
  const hasManagementAccess = useCallback(() => {
    if (!enhancedUser) return false;
    // Check if user is admin (userType) or has officer/commander role
    return enhancedUser.userType === 'admin' || 
           [UserRole.OFFICER, UserRole.COMMANDER].includes(enhancedUser.role as UserRole);
  }, [enhancedUser]);
  
  // Refs for both button and menu to properly handle outside clicks
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Memoized outside click handler to prevent unnecessary re-renders
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    
    // Only close if click is outside both button AND menu
    if (
      menuRef.current && 
      buttonRef.current &&
      !menuRef.current.contains(target) && 
      !buttonRef.current.contains(target)
    ) {
      setIsMenuOpen(false);
    }
  }, []);

  // Optimized event listener management
  useEffect(() => {
    if (isMenuOpen) {
      // Small delay to prevent immediate close
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 50);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen, handleClickOutside]);

  // Keyboard navigation support
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsMenuOpen(false);
      buttonRef.current?.focus();
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsMenuOpen(!isMenuOpen);
    }
  }, [isMenuOpen]);

  // Get user initials using enhanced user data or fallback methods
  const getUserInitials = useCallback(() => {
    // Priority 1: Use computed initials from enhanced user data (Firestore)
    if (enhancedUser?.initials) {
      return enhancedUser.initials;
    }
    
    // Priority 2: Use enhanced user firstName and lastName
    if (enhancedUser?.firstName && enhancedUser?.lastName) {
      return UserDataService.generateInitials({
        firstName: enhancedUser.firstName,
        lastName: enhancedUser.lastName,
        email: enhancedUser.email || '',
        uid: enhancedUser.uid
      } as FirestoreUserProfile);
    }
    
    // Priority 3: Use basic user firstName and lastName
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    
    // Priority 4: Use displayName if available
    if (user?.displayName) {
      const names = user.displayName.trim().split(' ').filter(name => name.length > 0);
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
      } else if (names.length === 1) {
        return names[0].substring(0, 2).toUpperCase();
      }
    }
    
    // Priority 5: Use email initial as fallback
    if (user?.email) {
      const emailInitial = user.email.charAt(0).toUpperCase();
      return `${emailInitial}U`; // U for User
    }
    
    // Last resort: Default icon symbol
    return '👤';
  }, [user, enhancedUser]);

  // Get user first name for display using enhanced data
  const getUserFirstName = useCallback(() => {
    if (enhancedUser?.firstName) return enhancedUser.firstName;
    if (user?.firstName) return user.firstName;
    if (user?.displayName) return user.displayName.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return TEXT_CONSTANTS.PROFILE.DEFAULT_USER;
  }, [user, enhancedUser]);

  // Get user last name for desktop greeting using enhanced data
  const getUserLastName = useCallback(() => {
    if (enhancedUser?.lastName) return enhancedUser.lastName;
    if (user?.lastName) return user.lastName;
    if (user?.displayName) {
      const names = user.displayName.trim().split(' ').filter(name => name.length > 0);
      return names.length >= 2 ? names[names.length - 1] : null;
    }
    return null;
  }, [user, enhancedUser]);

  // Get desktop greeting display using UserDataService if enhanced data available
  const getDesktopGreeting = useCallback(() => {
    if (enhancedUser?.firstName && enhancedUser?.lastName) {
      return UserDataService.generateDisplayName({
        firstName: enhancedUser.firstName,
        lastName: enhancedUser.lastName,
        email: enhancedUser.email || '',
        uid: enhancedUser.uid
      } as FirestoreUserProfile);
    }
    
    const lastName = getUserLastName();
    return lastName ? `${lastName}, שלום` : getUserFirstName();
  }, [enhancedUser, getUserLastName, getUserFirstName]);

  const handleLoginClick = useCallback(() => {
    setShowAuthModal(true);
  }, [setShowAuthModal]);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  }, []);

  const handleProfileClick = useCallback(() => {
    setIsMenuOpen(false);
    // Navigation to profile page handled by Link component
  }, []);

  const handleSettingsClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    // Navigate to settings page
    window.location.href = '/settings';
  }, []);

  const handleLogout = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    await logout();
  }, [logout]);

  const handleButtonClick = useCallback((action: string) => {
    // TODO: Implement actual actions when backend is ready
    console.log(`${action} clicked - UI only, no backend action`);
    if (action === 'notifications') {
      // TODO: Open notifications panel or navigate to notifications page
      setShowNotificationModal(true);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-9 h-9" role="status" aria-label="טוען...">
        <div 
          className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"
          aria-hidden="true"
        />
      </div>
    );
  }

  // Signed-out state - Login Button
  if (!isAuthenticated) {
    return (
      <button 
        type="button"
        onClick={handleLoginClick}
        className="btn-primary flex items-center gap-2 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        aria-label={TEXT_CONSTANTS.BUTTONS.LOGIN}
        style={{
          position: 'relative',
          zIndex: 50,
          pointerEvents: 'auto'
        }}
      >
        <LogInIcon className="w-5 h-5" aria-hidden="true" />
        <span>{TEXT_CONSTANTS.BUTTONS.LOGIN}</span>
      </button>
    );
  }

  // Signed-in state - Profile Menu with Notifications
  return (
    <div 
      className="relative flex items-center gap-2"
      style={{
        position: 'relative',
        zIndex: 50,
        pointerEvents: 'auto'
      }}
    >
      {/* Equipment Transfer Notification Button */}
      <button
        type="button"
        onClick={() => handleButtonClick('notifications')}
        className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 
                   focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-gray-600 
                   hover:text-gray-900 transition-colors duration-200"
        aria-label={TEXT_CONSTANTS.ARIA_LABELS.EQUIPMENT_NOTIFICATIONS}
        title="התראות העברת ציוד"
      >
        <BellIcon className="w-5 h-5" />
        {/* Notification Badge - TODO: Replace with actual count when backend is ready */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          3
        </span>
      </button>
      
      {/* Profile Menu Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleMenuToggle}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 
                   focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-gray-900 
                   transition-colors duration-200 cursor-pointer select-none"
        aria-label={`פרופיל של ${getUserLastName() || getUserFirstName()}`}
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
        id="profile-menu-button"
        style={{
          position: 'relative',
          zIndex: 50,
          pointerEvents: 'auto'
        }}
      >
        <span 
          className="bg-purple-600 text-white rounded-full w-9 h-9 flex items-center justify-center 
                     font-bold text-lg select-none shrink-0"
          aria-hidden="true"
          style={{ pointerEvents: 'none' }}
        >
          {getUserInitials()}
        </span>
        <span 
          className="font-medium text-base hidden sm:inline select-none text-right"
          style={{ pointerEvents: 'none' }}
        >
          {getDesktopGreeting()}
        </span>
        <ChevronDownIcon 
          className={`w-5 h-5 transition-transform duration-200 shrink-0 ${
            isMenuOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
          style={{ pointerEvents: 'none' }}
        />
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl 
                     border border-gray-200 py-2 z-[9999] overflow-visible"
          role="menu"
          aria-labelledby="profile-menu-button"
          style={{ 
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '0.5rem',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
        >
          <Link
            href="/profile"
            className="w-full text-right px-4 py-2 text-gray-900 hover:bg-gray-100 
                       focus:bg-gray-100 transition-colors duration-150 flex items-center gap-2 
                       cursor-pointer"
            onClick={handleProfileClick}
            role="menuitem"
            tabIndex={0}
          >
            <UserIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="text-right">{TEXT_CONSTANTS.PROFILE.MY_PROFILE}</span>
          </Link>
          
          <button
            type="button"
            className="w-full text-right px-4 py-2 text-gray-900 hover:bg-gray-100 
                       focus:bg-gray-100 transition-colors duration-150 flex items-center gap-2 
                       cursor-pointer"
            onClick={handleSettingsClick}
            role="menuitem"
            tabIndex={0}
          >
            <CogIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="text-right">{TEXT_CONSTANTS.PROFILE.SETTINGS}</span>
          </button>

          {/* Management menu item - only visible for officer, commander, or admin roles */}
          {hasManagementAccess() && (
            <Link
              href="/management"
              className="w-full text-right px-4 py-2 text-gray-900 hover:bg-gray-100 
                         focus:bg-gray-100 transition-colors duration-150 flex items-center gap-2 
                         cursor-pointer"
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
              tabIndex={0}
            >
              <Settings2Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-right">ניהול</span>
            </Link>
          )}
          
          <hr className="border-t border-gray-200 my-1" role="separator" />
          
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-right px-4 py-2 text-red-600 hover:bg-red-50 
                       focus:bg-red-50 transition-colors duration-150 flex items-center gap-2 
                       cursor-pointer"
            role="menuitem"
            tabIndex={0}
          >
            <LogOutIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="text-right">{TEXT_CONSTANTS.BUTTONS.LOGOUT}</span>
          </button>
        </div>
      )}

      {/* Notifications Coming Soon Modal */}
      <ConfirmationModal
        isOpen={showNotificationModal}
        title={TEXT_CONSTANTS.CONFIRMATIONS.NOTIFICATIONS_COMING_SOON_TITLE}
        message={TEXT_CONSTANTS.CONFIRMATIONS.NOTIFICATIONS_COMING_SOON_MESSAGE}
        confirmText={TEXT_CONSTANTS.CONFIRMATIONS.OK}
        cancelText={TEXT_CONSTANTS.CONFIRMATIONS.CLOSE}
        onConfirm={() => setShowNotificationModal(false)}
        onCancel={() => setShowNotificationModal(false)}
        variant="info"
        icon="🔔"
        singleButton={true}
        useHomePageStyle={true}
      />
    </div>
  );
} 