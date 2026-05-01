'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { TEXT_CONSTANTS } from '@/constants/text';
import GuardSchedulerWizard from './components/GuardSchedulerWizard';

export default function GuardSchedulerPage() {
  return (
    <AuthGuard>
      <AppShell
        title={TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.TITLE}
        subtitle={TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.SUBTITLE}
      >
        <div className="mx-auto max-w-5xl py-4">
          <GuardSchedulerWizard />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
