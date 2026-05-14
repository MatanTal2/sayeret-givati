/**
 * Management sidebar container component
 */
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import SidebarHeader from './SidebarHeader';
import SidebarNavigation from './SidebarNavigation';
import SidebarFooter from './SidebarFooter';
import type { ManagementTab } from '@/types/management';
import { useScrollLock } from '@/hooks/useScrollLock';

export interface ManagementSidebarProps {
  isOpen: boolean;
  activeTab: string;
  tabsByCategory: Record<string, ManagementTab[]>;
  onTabChange: (tabId: string) => void;
  onClose: () => void;
  userName?: string;
}

export default function ManagementSidebar({
  isOpen,
  activeTab,
  tabsByCategory,
  onTabChange,
  onClose,
  userName,
}: ManagementSidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  useScrollLock(isOpen && isMobile);
  return (
    <div className={cn(
      // `start-0` anchors to inline-start (visual right in RTL) on the
      // mobile fixed layout; the lg breakpoint switches to `relative`,
      // where the inset has no effect and the sidebar flows naturally on
      // the inline-start side of the management grid. `translate-x-full`
      // is physical — pushes the panel visually right (off-screen) when
      // closed. `flex flex-col` activates `flex-1 min-h-0` on the
      // navigation so the tab list can scroll independently when the
      // 14-tab content exceeds viewport height (bug #20).
      'fixed inset-y-0 start-0 z-50 w-80 bg-white shadow-2xl transform transition-all duration-500 ease-out flex flex-col',
      'lg:relative lg:translate-x-0 lg:w-72 lg:shadow-lg lg:duration-0',
      isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'
    )}>
      <SidebarHeader 
        userName={userName}
        onClose={onClose}
      />
      
      <SidebarNavigation
        activeTab={activeTab}
        tabsByCategory={tabsByCategory}
        onTabChange={onTabChange}
      />
      
      <SidebarFooter />
    </div>
  );
}

