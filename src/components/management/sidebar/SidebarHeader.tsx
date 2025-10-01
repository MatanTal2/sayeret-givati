/**
 * Sidebar header component with title and close button
 */
import React from 'react';
import { Settings, X } from 'lucide-react';
import { MANAGEMENT } from '@/constants/text';

export interface SidebarHeaderProps {
  userName?: string;
  onClose: () => void;
}

export default function SidebarHeader({ userName, onClose }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {MANAGEMENT.PAGE_TITLE}
          </h2>
          <p className="text-sm text-gray-600">
            {userName || MANAGEMENT.DEFAULT_MANAGER}
          </p>
        </div>
      </div>
      
      {/* Close button for mobile */}
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-gray-500"
        onClick={onClose}
        aria-label="סגור תפריט"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

