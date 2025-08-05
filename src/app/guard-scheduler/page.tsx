'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import ComingSoon from '@/components/ui/ComingSoon';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * Guard Scheduler Page - מחולל שמירות
 * Shows automatic guard schedule generation with constraints
 * Currently under development
 */
export default function GuardSchedulerPage() {
  return (
    <AuthGuard>
      <ComingSoon 
        title={TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.TITLE}
        description={TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.DESCRIPTION}
        expectedDate="רבעון ראשון 2025"
      />
    </AuthGuard>
  );
}