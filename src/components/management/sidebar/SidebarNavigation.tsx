/**
 * Sidebar navigation component - renders categorized tabs
 *
 * Scroll behavior (bug #20): the tab list can grow to 14 items across
 * 4 categories. On short viewports it overflows the sidebar height. The
 * `<nav>` is `overflow-y-auto min-h-0` (parent `ManagementSidebar` is
 * `flex flex-col`, so `flex-1` actually constrains height now), and
 * top / bottom fade overlays signal that more content exists above or
 * below the viewport. Overlays only render when there's actually
 * content to scroll to.
 */
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { ManagementTab } from '@/types/management';

export interface SidebarNavigationProps {
  activeTab: string;
  tabsByCategory: Record<string, ManagementTab[]>;
  onTabChange: (tabId: string) => void;
}

const CATEGORIES = [
  { id: 'user-management', name: 'ניהול משתמשים', order: 1 },
  { id: 'equipment', name: 'ציוד', order: 2 },
  { id: 'system', name: 'מערכת', order: 3 },
  { id: 'communication', name: 'תקשורת', order: 4 },
];

const SCROLL_TOLERANCE_PX = 4;

export default function SidebarNavigation({
  activeTab,
  tabsByCategory,
  onTabChange,
}: SidebarNavigationProps) {
  const sortedCategories = CATEGORIES.sort((a, b) => a.order - b.order);
  const navRef = useRef<HTMLElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setCanScrollUp(scrollTop > SCROLL_TOLERANCE_PX);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - SCROLL_TOLERANCE_PX);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [tabsByCategory]);

  return (
    <div className="relative flex-1 min-h-0">
      <nav ref={navRef} className="h-full overflow-y-auto px-4 py-2 space-y-6">
        {sortedCategories.map((category) => {
          const categoryTabs = tabsByCategory[category.id] || [];
          if (categoryTabs.length === 0) return null;

          return (
            <div key={category.id}>
              {/* Category Title */}
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                {category.name}
              </h3>

              {/* Gradient Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent mb-4" />

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
                        'hover:bg-primary-50 hover:text-primary-700',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        isActive
                          ? 'bg-primary-100 text-primary-700 border-e-2 border-primary-600'
                          : 'text-neutral-700 hover:text-primary-700'
                      )}
                    >
                      <Icon className="w-5 h-5 me-3 flex-shrink-0" />
                      <span className="flex-1 text-start">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white to-transparent transition-opacity duration-150',
          canScrollUp ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent transition-opacity duration-150',
          canScrollDown ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}
