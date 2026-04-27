'use client';

import { LayoutGrid } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppShell from './components/AppShell';
import FeatureCard from './components/FeatureCard';
import LoggedOutLanding from './components/LoggedOutLanding';
import AnnouncementsWidget from './components/home/AnnouncementsWidget';
import MediaWidget from './components/home/MediaWidget';
import RecentRoutesWidget from './components/home/RecentRoutesWidget';
import LinksWidget from './components/home/LinksWidget';
import CollapsibleSection from './components/home/CollapsibleSection';
import { getFeatureRoutes } from '@/utils/navigationUtils';
import { TEXT_CONSTANTS } from '@/constants/text';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const features = getFeatureRoutes();

  // Avoid flash of either view while auth is resolving
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"
          role="status"
          aria-label={TEXT_CONSTANTS.BUTTONS.LOADING}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoggedOutLanding />;
  }

  return (
    <AppShell title={TEXT_CONSTANTS.APP_NAME} subtitle={TEXT_CONSTANTS.APP_SUBTITLE}>
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-5 lg:gap-6">
        {/* Bento row: announcements + media on the left (wider), recent + links on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5 lg:gap-6">
          <div className="flex flex-col gap-5 lg:gap-6 min-w-0">
            <AnnouncementsWidget />
            <MediaWidget />
          </div>
          <div className="flex flex-col gap-5 lg:gap-6 min-w-0">
            <RecentRoutesWidget />
            <LinksWidget />
          </div>
        </div>

        {/* Features grid — collapsed by default */}
        <CollapsibleSection
          id="features"
          title={TEXT_CONSTANTS.HOME.FEATURES_TITLE}
          icon={<LayoutGrid className="w-4 h-4" aria-hidden="true" />}
          defaultCollapsed
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feature) => (
              <FeatureCard
                key={feature.href}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                href={feature.href}
                available={feature.available}
                color={feature.color}
              />
            ))}
          </div>
        </CollapsibleSection>

        <footer className="pt-2 text-center text-xs text-neutral-500">
          {TEXT_CONSTANTS.COMPANY_NAME} • {TEXT_CONSTANTS.VERSION} • © Matan Tal
        </footer>
      </div>
    </AppShell>
  );
}
