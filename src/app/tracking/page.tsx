'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import ComingSoon from '@/components/ui/ComingSoon';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * Soldier Tracking Page - מעקב לוחם
 * Shows soldier skills and permissions tracking functionality
 * Currently under development
 */
export default function TrackingPage() {
  return (
    <AuthGuard>
      <ComingSoon 
        title={TEXT_CONSTANTS.FEATURES.SOLDIER_TRACKING.TITLE}
        description={TEXT_CONSTANTS.FEATURES.SOLDIER_TRACKING.DESCRIPTION}
        expectedDate="רבעון ראשון 2025"
      />
    </AuthGuard>
  );
}