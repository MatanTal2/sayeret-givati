/**
 * Client-side user profile update helper. Delegates writes to the admin API
 * route so rules stay locked and writes remain transactional/audit-friendly.
 */

import { apiFetch } from '@/lib/apiFetch';
import type { CommunicationPreferences } from '@/types/user';

export type CommunicationPreferencesPatch = Partial<
  Pick<
    CommunicationPreferences,
    'emailNotifications' | 'equipmentTransferAlerts' | 'systemUpdates' | 'schedulingAlerts' | 'emergencyNotifications'
  >
>;

export interface ProfileUpdates {
  teamId?: string;
  profileImage?: string;
  phoneNumber?: string;
  enlistmentCycle?: string;
  address?: string;
  communicationPreferences?: CommunicationPreferencesPatch;
}

export async function updateUserProfile(uid: string, updates: ProfileUpdates): Promise<void> {
  const response = await apiFetch('/api/users/profile', {
    method: 'PATCH',
    body: JSON.stringify({ uid, updates }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to update profile');
  }
}
