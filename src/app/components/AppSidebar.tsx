'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getMenuItems, MenuItem } from '@/utils/navigationUtils';
import { TEXT_CONSTANTS } from '@/constants/text';

const SIDEBAR_KEY = 'sidebar_expanded';

interface AppSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();
  const menuItems = getMenuItems();
  const [expanded, setExpanded] = useState(false);

  // Load persisted expansion on mount
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(SIDEBAR_KEY) : null;
      if (stored === 'true') setExpanded(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <>
      {/* Desktop rail (lg and up) — persistent, two-stage */}
      <aside
        aria-label={TEXT_CONSTANTS.ARIA_LABELS.MAIN_MENU}
        className={cn(
          'hidden lg:flex flex-col shrink-0 border-s border-neutral-200 bg-white transition-[width] duration-200 ease-out',
          expanded ? 'w-64' : 'w-24'
        )}
      >
        <button
          type="button"
          onClick={toggleExpanded}
          className={cn(
            'flex items-center h-12 px-3 border-b border-neutral-200 text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 transition-colors',
            expanded ? 'justify-end' : 'justify-center'
          )}
          aria-label={expanded ? TEXT_CONSTANTS.SHELL.COLLAPSE_SIDEBAR : TEXT_CONSTANTS.SHELL.EXPAND_SIDEBAR}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide">
          <ul className="flex flex-col gap-1 px-2">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                active={pathname === item.href}
                expanded={expanded}
              />
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile drawer (below lg) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-neutral-900/30 backdrop-blur-sm z-[9998] lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-strong z-[9999] lg:hidden flex flex-col"
              aria-label={TEXT_CONSTANTS.ARIA_LABELS.MAIN_MENU}
            >
              <div className="flex justify-between items-center h-14 px-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">תפריט</h2>
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="p-2 text-neutral-600 hover:text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label={TEXT_CONSTANTS.SHELL.CLOSE_MENU}
                >
                  <X className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-2">
                <ul className="flex flex-col gap-1 px-2">
                  {menuItems.map((item) => (
                    <SidebarItem
                      key={item.href}
                      item={item}
                      active={pathname === item.href}
                      expanded
                      onNavigate={onMobileClose}
                    />
                  ))}
                </ul>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

interface SidebarItemProps {
  item: MenuItem;
  active: boolean;
  expanded: boolean;
  onNavigate?: () => void;
}

function SidebarItem({ item, active, expanded, onNavigate }: SidebarItemProps) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg transition-colors relative group',
          expanded ? 'px-3 py-2.5' : 'justify-center h-11 w-11 mx-auto',
          active
            ? 'bg-primary-50 text-primary-700'
            : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-600'
        )}
        title={!expanded ? item.label : undefined}
        aria-current={active ? 'page' : undefined}
      >
        {item.icon && (
          <span className="text-lg shrink-0" aria-hidden="true">
            {item.icon}
          </span>
        )}
        {expanded && <span className="truncate">{item.label}</span>}
        {!expanded && (
          <span className="pointer-events-none absolute start-full ms-2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 shadow-medium group-hover:opacity-100 transition-opacity z-50">
            {item.label}
          </span>
        )}
      </Link>
    </li>
  );
}
