import { UserType } from '@/types/user';

export enum GrantStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
}

export type GrantScope = 'all' | 'team';

/**
 * In-memory shape consumed by policy helpers. expiresAt is epoch milliseconds
 * to keep the type usable on both client and server without firebase-admin /
 * firebase Timestamp version mismatch.
 */
export interface ActiveGrant {
  id: string;
  grantedRole: UserType;
  scope: GrantScope;
  scopeTeamId?: string;
  expiresAtMs: number;
}

/**
 * Firestore document shape for permissionGrants/{grantId}.
 * Persisted by the future grants-issuance PR; the loader converts to ActiveGrant.
 */
export interface PermissionGrant {
  id: string;
  userId: string;
  grantedRole: UserType;
  scope: GrantScope;
  scopeTeamId?: string;
  issuedBy: string;
  issuedAtMs: number;
  expiresAtMs: number;
  reason: string;
  status: GrantStatus;
}
