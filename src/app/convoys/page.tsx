'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import ComingSoon from '@/components/ui/ComingSoon';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * Convoys Page - שיירות
 * Shows convoy planning and management functionality
 * Currently under development
 */
export default function ConvoysPage() {
  return (
    <AuthGuard>
      <ComingSoon 
        title={TEXT_CONSTANTS.FEATURES.CONVOYS.TITLE}
        description={TEXT_CONSTANTS.FEATURES.CONVOYS.DESCRIPTION}
        expectedDate="רבעון ראשון 2025"
      />
    </AuthGuard>
  );
}