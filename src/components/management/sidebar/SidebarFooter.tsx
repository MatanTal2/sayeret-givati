/**
 * Sidebar footer component with user role display
 */
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MANAGEMENT } from '@/constants/text';

export default function SidebarFooter() {
  const { enhancedUser } = useAuth();

  return (
    <div className="p-4 border-t border-neutral-200">
      <div className="text-xs text-neutral-500 text-center">
        {MANAGEMENT.ROLE_LABEL}: {
          enhancedUser?.userType === 'admin' 
            ? MANAGEMENT.DEFAULT_MANAGER 
            : enhancedUser?.role || MANAGEMENT.ROLE_NOT_IDENTIFIED
        }
      </div>
    </div>
  );
}

