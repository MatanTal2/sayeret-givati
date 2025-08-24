/**
 * Management page header component
 */
import React from 'react';
import MobileMenuButton from './MobileMenuButton';
import AppLogo from './AppLogo';
import PageInfo from './PageInfo';
import AuthButton from '@/app/components/AuthButton';
import type { ManagementTab } from '@/types/management';

export interface ManagementHeaderProps {
  activeTab?: ManagementTab;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function ManagementHeader({
  activeTab,
  sidebarOpen,
  onToggleSidebar,
}: ManagementHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <MobileMenuButton 
            isOpen={sidebarOpen}
            onClick={onToggleSidebar}
          />
          
          <AppLogo />
          
          {activeTab && <PageInfo tab={activeTab} />}
        </div>
        
        {/* Use existing AuthButton component */}
        <AuthButton />
      </div>
    </header>
  );
}

