'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import ComingSoon from '@/components/ui/ComingSoon';
import { TEXT_CONSTANTS } from '@/constants/text';

export default function ConvoysPage() {
  return (
    <AuthGuard>
      <AppShell title={TEXT_CONSTANTS.FEATURES.CONVOYS.TITLE}>
        <ComingSoon
          title={TEXT_CONSTANTS.FEATURES.CONVOYS.TITLE}
          description={TEXT_CONSTANTS.FEATURES.CONVOYS.DESCRIPTION}
          expectedDate="רבעון ראשון 2025"
          showBackButton={false}
        />
      </AppShell>
    </AuthGuard>
  );
}
