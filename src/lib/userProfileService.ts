/**
 * Client-side user profile update helper. Delegates writes to the admin API
 * route so rules stay locked and writes remain transactional/audit-friendly.
 */

export interface ProfileUpdates {
  teamId?: string;
  profileImage?: string;
  phoneNumber?: string;
}

export async function updateUserProfile(uid: string, updates: ProfileUpdates): Promise<void> {
  const response = await fetch('/api/users/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, updates }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to update profile');
  }
}
