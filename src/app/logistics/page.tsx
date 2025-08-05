'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import ComingSoon from '@/components/ui/ComingSoon';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * Logistics Page - לוגיסטיקה
 * Shows equipment and supply management functionality
 * Currently under development
 */
export default function LogisticsPage() {
  return (
    <AuthGuard>
      <ComingSoon 
        title={TEXT_CONSTANTS.FEATURES.LOGISTICS.TITLE}
        description={TEXT_CONSTANTS.FEATURES.LOGISTICS.DESCRIPTION}
        expectedDate="רבעון שני 2025"
      />
    </AuthGuard>
  );
}