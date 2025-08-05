'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import ComingSoon from '@/components/ui/ComingSoon';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * Equipment Page - צלם
 * Shows military equipment management with serial numbers
 * Currently under development
 */
export default function EquipmentPage() {
  return (
    <AuthGuard>
      <ComingSoon 
        title={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TITLE}
        description={TEXT_CONSTANTS.FEATURES.EQUIPMENT.DESCRIPTION}
        expectedDate="רבעון שני 2025"
      />
    </AuthGuard>
  );
}