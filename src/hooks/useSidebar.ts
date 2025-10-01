/**
 * Hook for managing sidebar state and behavior
 */
import { useState, useEffect, useCallback } from 'react';
import type { SidebarState } from '@/types/management';

export interface UseSidebarReturn extends SidebarState {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  closeSidebarOnMobile: () => void;
}

export function useSidebar(defaultTab: string): UseSidebarReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeSidebarOnMobile = useCallback(() => {
    // Only close on mobile/tablet screens
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, []);

  const handleSetActiveTab = useCallback((tab: string) => {
    setActiveTab(tab);
    closeSidebarOnMobile();
  }, [closeSidebarOnMobile]);

  // Only set default tab on the very first initialization
  useEffect(() => {
    if (defaultTab && !hasInitialized) {
      setActiveTab(defaultTab);
      setHasInitialized(true);
    }
  }, [defaultTab, hasInitialized]);

  return {
    isOpen,
    activeTab,
    setSidebarOpen,
    toggleSidebar,
    setActiveTab: handleSetActiveTab,
    closeSidebarOnMobile,
  };
}

