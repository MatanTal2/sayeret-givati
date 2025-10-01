/**
 * Management sidebar container component
 */
import React from 'react';
import { cn } from '@/lib/cn';
import SidebarHeader from './SidebarHeader';
import SidebarNavigation from './SidebarNavigation';
import SidebarFooter from './SidebarFooter';
import type { ManagementTab } from '@/types/management';

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
  return (
    <div className={cn(
      'fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl transform transition-all duration-500 ease-out',
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

