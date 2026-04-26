/**
 * Management page header — visually mirrors the global TopBar so the
 * management page feels part of the same app shell. The hamburger here
 * toggles the management sidebar (tabs), not the global app sidebar.
 */
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import AuthButton from '@/app/components/AuthButton';
import PageInfo from './PageInfo';
import { TEXT_CONSTANTS } from '@/constants/text';
import { cn } from '@/lib/cn';
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
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex items-center gap-1 justify-self-start">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label={TEXT_CONSTANTS.SHELL.OPEN_MENU}
              aria-expanded={sidebarOpen}
              className={cn(
                'lg:hidden p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                sidebarOpen
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-600',
              )}
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center justify-self-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md"
            aria-label={TEXT_CONSTANTS.SHELL.LOGO_HOME}
          >
            <Image
              src="/sayeret-givati-logo.png"
              alt={TEXT_CONSTANTS.ARIA_LABELS.LOGO}
              width={40}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>

          <div className="flex items-center justify-self-end">
            <AuthButton />
          </div>
        </div>
      </header>

      {activeTab && (
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <PageInfo tab={activeTab} />
          </div>
        </div>
      )}
    </>
  );
}
