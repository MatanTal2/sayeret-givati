'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import ComingSoon from '@/components/ui/ComingSoon';
import { TEXT_CONSTANTS } from '@/constants/text';

export default function LogisticsPage() {
  return (
    <AuthGuard>
      <AppShell title={TEXT_CONSTANTS.FEATURES.LOGISTICS.TITLE}>
        <ComingSoon
          title={TEXT_CONSTANTS.FEATURES.LOGISTICS.TITLE}
          description={TEXT_CONSTANTS.FEATURES.LOGISTICS.DESCRIPTION}
          expectedDate="רבעון שני 2025"
          showBackButton={false}
        />
      </AppShell>
    </AuthGuard>
  );
}
