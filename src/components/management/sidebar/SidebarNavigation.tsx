/**
 * Sidebar navigation component - renders categorized tabs
 */
import React from 'react';
import { cn } from '@/lib/cn';
import type { ManagementTab } from '@/types/management';

export interface SidebarNavigationProps {
  activeTab: string;
  tabsByCategory: Record<string, ManagementTab[]>;
  onTabChange: (tabId: string) => void;
}

// Category configurations
const CATEGORIES = [
  { id: 'user-management', name: 'ניהול משתמשים', order: 1 },
  { id: 'equipment', name: 'ציוד', order: 2 },
  { id: 'system', name: 'מערכת', order: 3 },
  { id: 'communication', name: 'תקשורת', order: 4 },
];

export default function SidebarNavigation({
  activeTab,
  tabsByCategory,
  onTabChange,
}: SidebarNavigationProps) {
  const sortedCategories = CATEGORIES.sort((a, b) => a.order - b.order);

  return (
    <nav className="flex-1 px-4 py-2 space-y-6">
      {sortedCategories.map((category) => {
        const categoryTabs = tabsByCategory[category.id] || [];
        if (categoryTabs.length === 0) return null;

        return (
          <div key={category.id}>
            {/* Category Title */}
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {category.name}
            </h3>
            
            {/* Gradient Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4" />
            
            {/* Category Tabs */}
            <div className="space-y-1">
              {categoryTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      'w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                      'hover:bg-purple-50 hover:text-purple-700',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
                      isActive
                        ? 'bg-purple-100 text-purple-700 border-r-2 border-purple-600'
                        : 'text-gray-700 hover:text-purple-700'
                    )}
                  >
                    <Icon className="w-5 h-5 ml-3 flex-shrink-0" />
                    <span className="flex-1 text-right">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
