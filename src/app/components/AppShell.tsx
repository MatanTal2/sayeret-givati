'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import TopBar from './TopBar';
import PageHeader from './PageHeader';
import AppSidebar from './AppSidebar';
import QuickActionFab from './QuickActionFab';
import WelcomeModal from '@/components/onboarding/WelcomeModal';
import { useAuth } from '@/contexts/AuthContext';
import { trackRouteVisit } from '@/utils/recentRoutesStorage';

interface AppShellProps {
  title: string;
  subtitle?: string;
  showBackArrow?: boolean;
  showFab?: boolean;
  children: ReactNode;
}

export default function AppShell({
  title,
  subtitle,
  showBackArrow = false,
  showFab = true,
  children,
}: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, enhancedUser } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    trackRouteVisit({ href: pathname, title });
  }, [isAuthenticated, pathname, title]);

  // Onboarding gate: block UI when authenticated user hasn't filled team yet.
  // Equipment scope queries depend on this field, so we surface a mandatory modal.
  const needsOnboarding = !!enhancedUser && !enhancedUser.teamId;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col overflow-x-hidden">
      <TopBar
        showBackArrow={showBackArrow}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />
      <div className="flex flex-1 min-h-0">
        <AppSidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 min-w-0 flex flex-col">
          <PageHeader title={title} subtitle={subtitle} />
          <main className="flex-1 px-4 sm:px-6 pb-24 lg:pb-12">{children}</main>
        </div>
      </div>
      {showFab && isAuthenticated && <QuickActionFab />}
      {needsOnboarding && <WelcomeModal />}
    </div>
  );
}
