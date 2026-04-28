'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { TEXT_CONSTANTS } from '@/constants/text';
import AppShell from '@/app/components/AppShell';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

export default function AdminPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <AppShell title={TEXT_CONSTANTS.ADMIN.PANEL_TITLE} showFab={false}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">{TEXT_CONSTANTS.ADMIN.LOADING_MESSAGE}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => { /* state managed by hook */ }} />;
  }

  return (
    <AppShell title={TEXT_CONSTANTS.ADMIN.PANEL_TITLE} showFab={false}>
      <AdminDashboard onLogout={() => { /* logout handled internally */ }} />
    </AppShell>
  );
}
