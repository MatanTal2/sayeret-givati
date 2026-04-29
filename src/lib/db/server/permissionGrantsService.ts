import type { ActiveGrant } from '@/types/permissionGrant';

/**
 * Returns the active, non-expired grants for the given user. The full
 * implementation queries `permissionGrants` filtered by status === 'active'
 * AND expiresAtMs > now. Until the grants-issuance PR ships, this returns an
 * empty list, which means policy helpers fall through to base userType.
 *
 * The empty stub keeps the rest of the auth pipeline grant-aware so the
 * issuance PR only needs to fill in the query — no callsite churn.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getActiveGrants(_uid: string): Promise<ActiveGrant[]> {
  return [];
}
