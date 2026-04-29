/**
 * Client-side user profile update helper. Delegates writes to the admin API
 * route so rules stay locked and writes remain transactional/audit-friendly.
 */

import { apiFetch } from '@/lib/apiFetch';

export interface ProfileUpdates {
  teamId?: string;
  profileImage?: string;
  phoneNumber?: string;
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
