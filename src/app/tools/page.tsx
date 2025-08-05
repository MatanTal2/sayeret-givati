'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import ComingSoon from '@/components/ui/ComingSoon';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * Additional Tools Page - כלים נוספים
 * Shows additional tools under development
 * Currently under development
 */
export default function ToolsPage() {
  return (
    <AuthGuard>
      <ComingSoon 
        title={TEXT_CONSTANTS.FEATURES.ADDITIONAL_TOOLS.TITLE}
        description={TEXT_CONSTANTS.FEATURES.ADDITIONAL_TOOLS.DESCRIPTION}
        expectedDate="מועד יפורסם בהמשך"
      />
    </AuthGuard>
  );
}