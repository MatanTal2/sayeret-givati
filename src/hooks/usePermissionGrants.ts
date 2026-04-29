'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import type { GrantScope, GrantStatus } from '@/types/permissionGrant';
import type { UserType } from '@/types/user';

export interface PermissionGrantListItem {
  id: string;
  userId: string;
  userDisplayName?: string;
  grantedRole: UserType;
  scope: GrantScope;
  scopeTeamId?: string;
  issuedBy: string;
  issuedByDisplayName?: string;
  issuedAtMs: number;
  expiresAtMs: number;
  reason: string;
  status: GrantStatus;
  revokedBy?: string;
  revokedByDisplayName?: string;
  revokedAtMs?: number;
  revokeReason?: string;
  isExpired: boolean;
}

export interface IssueGrantPayload {
  userId: string;
  userDisplayName?: string;
  grantedRole: UserType;
  scope: GrantScope;
  scopeTeamId?: string;
  durationMs: number;
  reason: string;
}

export interface UsePermissionGrantsReturn {
  grants: PermissionGrantListItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  issue: (payload: IssueGrantPayload) => Promise<{ ok: boolean; error?: string }>;
  revoke: (grantId: string, reason?: string) => Promise<{ ok: boolean; error?: string }>;
}

export function usePermissionGrants(): UsePermissionGrantsReturn {
  const [grants, setGrants] = useState<PermissionGrantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/permission-grants?includeExpired=true');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'שגיאה בטעינת הענקות');
      }
      setGrants(json.grants ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const issue = useCallback<UsePermissionGrantsReturn['issue']>(
    async (payload) => {
      try {
        const res = await apiFetch('/api/permission-grants', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          return { ok: false, error: json.error || 'יצירת הענקה נכשלה' };
        }
        await refresh();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'שגיאה לא צפויה' };
      }
    },
    [refresh]
  );

  const revoke = useCallback<UsePermissionGrantsReturn['revoke']>(
    async (grantId, reason) => {
      try {
        const res = await apiFetch(
          `/api/permission-grants/${encodeURIComponent(grantId)}/revoke`,
          {
            method: 'POST',
            body: JSON.stringify(reason ? { reason } : {}),
          }
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          return { ok: false, error: json.error || 'ביטול נכשל' };
        }
        await refresh();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'שגיאה לא צפויה' };
      }
    },
    [refresh]
  );

  return { grants, isLoading, error, refresh, issue, revoke };
}
