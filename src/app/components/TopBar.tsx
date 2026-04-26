'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Menu } from 'lucide-react';
import AuthButton from './AuthButton';
import { TEXT_CONSTANTS } from '@/constants/text';

interface TopBarProps {
  showBackArrow?: boolean;
  onOpenSidebar: () => void;
}

export default function TopBar({ showBackArrow = false, onOpenSidebar }: TopBarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Start side (right in RTL): hamburger + optional back */}
        <div className="flex items-center gap-1 justify-self-start">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            aria-label={TEXT_CONSTANTS.SHELL.OPEN_MENU}
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>
          {showBackArrow && (
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              aria-label={TEXT_CONSTANTS.SHELL.BACK}
            >
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Center: logo → home (always true viewport-center via grid auto col) */}
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

        {/* End side (left in RTL): profile + notifications (AuthButton contains both when signed in) */}
        <div className="flex items-center justify-self-end">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
