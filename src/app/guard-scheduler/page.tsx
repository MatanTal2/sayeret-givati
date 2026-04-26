'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import ComingSoon from '@/components/ui/ComingSoon';
import { TEXT_CONSTANTS } from '@/constants/text';

export default function GuardSchedulerPage() {
  return (
    <AuthGuard>
      <AppShell title={TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.TITLE}>
        <ComingSoon
          title={TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.TITLE}
          description={TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.DESCRIPTION}
          expectedDate="רבעון ראשון 2025"
          showBackButton={false}
        />
      </AppShell>
    </AuthGuard>
  );
}
