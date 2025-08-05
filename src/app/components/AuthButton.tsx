'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT_CONSTANTS } from '@/constants/text';
import { ChevronDownIcon, UserIcon, CogIcon, LogOutIcon, LogInIcon } from 'lucide-react';

export default function AuthButton() {
  const { user, isAuthenticated, isLoading, logout, setShowAuthModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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

  // Get user initials from first and last name, with proper fallbacks
  const getUserInitials = useCallback(() => {
    // Priority 1: Use firstName and lastName if available
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    
    // Priority 2: Use displayName if available
    if (user?.displayName) {
      const names = user.displayName.trim().split(' ').filter(name => name.length > 0);
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
      } else if (names.length === 1) {
        return names[0].substring(0, 2).toUpperCase();
      }
    }
    
    // Priority 3: Use email initial as fallback
    if (user?.email) {
      const emailInitial = user.email.charAt(0).toUpperCase();
      return `${emailInitial}U`; // U for User
    }
    
    // Last resort: Default icon symbol
    return '👤';
  }, [user]);

  // Get user first name for display
  const getUserFirstName = useCallback(() => {
    if (user?.firstName) return user.firstName;
    if (user?.displayName) return user.displayName.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return TEXT_CONSTANTS.PROFILE.DEFAULT_USER;
  }, [user]);

  // Get user last name for desktop greeting
  const getUserLastName = useCallback(() => {
    if (user?.lastName) return user.lastName;
    if (user?.displayName) {
      const names = user.displayName.trim().split(' ').filter(name => name.length > 0);
      return names.length >= 2 ? names[names.length - 1] : null;
    }
    return null;
  }, [user]);

  // Get desktop greeting display
  const getDesktopGreeting = useCallback(() => {
    const lastName = getUserLastName();
    return lastName ? `${lastName}, שלום` : getUserFirstName();
  }, [getUserLastName, getUserFirstName]);

  const handleLoginClick = useCallback(() => {
    setShowAuthModal(true);
  }, [setShowAuthModal]);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  }, []);

  const handleProfileClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    // TODO: Navigate to profile page
  }, []);

  const handleSettingsClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    // TODO: Navigate to settings page
  }, []);

  const handleLogout = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    await logout();
  }, [logout]);

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

  // Signed-in state - Profile Menu
  return (
    <div 
      className="relative"
      style={{
        position: 'relative',
        zIndex: 50,
        pointerEvents: 'auto'
      }}
    >
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
          <button
            type="button"
            className="w-full text-right px-4 py-2 text-gray-900 hover:bg-gray-100 
                       focus:bg-gray-100 transition-colors duration-150 flex items-center gap-2 
                       cursor-pointer"
            onClick={handleProfileClick}
            role="menuitem"
            tabIndex={0}
          >
            <UserIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="text-right">{TEXT_CONSTANTS.PROFILE.MY_PROFILE}</span>
          </button>
          
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
    </div>
  );
} 