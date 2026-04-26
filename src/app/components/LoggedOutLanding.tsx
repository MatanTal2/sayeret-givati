'use client';

import Image from 'next/image';
import { LogIn, Package, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT_CONSTANTS } from '@/constants/text';

export default function LoggedOutLanding() {
  const { setShowAuthModal } = useAuth();

  const features = [
    { Icon: Package, label: TEXT_CONSTANTS.HOME.LANDING.FEATURE_EQUIPMENT },
    { Icon: ShieldCheck, label: TEXT_CONSTANTS.HOME.LANDING.FEATURE_STATUS },
    { Icon: Wrench, label: TEXT_CONSTANTS.HOME.LANDING.FEATURE_TOOLS },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-primary-50/40 flex flex-col overflow-x-hidden"
      dir="rtl"
    >
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full flex flex-col items-center text-center gap-8">
          {/* Logo with soft halo */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-primary-200/50 blur-3xl rounded-full scale-150"
            />
            <Image
              src="/sayeret-givati-logo.png"
              alt={TEXT_CONSTANTS.ARIA_LABELS.LOGO}
              width={140}
              height={140}
              priority
              className="relative h-28 w-auto drop-shadow-sm"
            />
          </div>

          {/* Title + subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3 leading-tight">
              {TEXT_CONSTANTS.APP_NAME}
            </h1>
            <p className="text-base text-neutral-600 leading-relaxed">
              {TEXT_CONSTANTS.APP_SUBTITLE}
            </p>
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="btn-primary w-full flex items-center justify-center gap-2 shadow-primary"
            aria-label={TEXT_CONSTANTS.HOME.LANDING.SIGN_IN_PROMPT}
          >
            <LogIn className="w-5 h-5" aria-hidden="true" />
            <span>{TEXT_CONSTANTS.BUTTONS.LOGIN}</span>
          </button>

          {/* Feature teasers */}
          <ul className="w-full flex flex-col gap-3 pt-6 border-t border-neutral-200">
            {features.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-right">
                <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="text-sm text-neutral-700 leading-snug">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-neutral-500">
        {TEXT_CONSTANTS.COMPANY_NAME} • {TEXT_CONSTANTS.VERSION}
      </footer>
    </div>
  );
}
