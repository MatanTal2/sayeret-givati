/**
 * Hook for managing sidebar state and behavior.
 *
 * The active tab is sourced from the `?tab=` URL query param so a refresh
 * lands the user back on the tab they were viewing. Sidebar open/closed
 * is local state — no reason to survive navigation.
 */
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { SidebarState } from '@/types/management';

export const SIDEBAR_TAB_QUERY_KEY = 'tab';

export interface UseSidebarReturn extends SidebarState {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  closeSidebarOnMobile: () => void;
}

export function useSidebar(defaultTab: string): UseSidebarReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  const activeTab = searchParams.get(SIDEBAR_TAB_QUERY_KEY) ?? defaultTab;

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeSidebarOnMobile = useCallback(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, []);

  const handleSetActiveTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(SIDEBAR_TAB_QUERY_KEY, tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      closeSidebarOnMobile();
    },
    [router, pathname, searchParams, closeSidebarOnMobile]
  );

  return {
    isOpen,
    activeTab,
    setSidebarOpen,
    toggleSidebar,
    setActiveTab: handleSetActiveTab,
    closeSidebarOnMobile,
  };
}
