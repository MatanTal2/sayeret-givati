'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { TEXT_CONSTANTS } from '@/constants/text';
import LogisticsInventoryPage from '@/components/logistics/LogisticsInventoryPage';

export default function LogisticsPage() {
  return (
    <AuthGuard>
      <AppShell
        title={`📦 ${TEXT_CONSTANTS.FEATURES.LOGISTICS.TITLE}`}
        subtitle={TEXT_CONSTANTS.FEATURES.LOGISTICS.DESCRIPTION}
      >
        <LogisticsInventoryPage />
      </AppShell>
    </AuthGuard>
  );
}
