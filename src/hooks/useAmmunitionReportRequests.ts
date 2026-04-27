'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  AmmunitionReportRequest,
  AmmunitionReportRequestScope,
} from '@/types/ammunition';
import type { ApiActor } from '@/lib/equipmentService';

export interface CreateRequestPayload {
  scope: AmmunitionReportRequestScope;
  targetUserIds?: string[];
  targetTeamId?: string;
  templateIds?: string[];
  dueAtMs?: number;
  note?: string;
}

export interface UseAmmunitionReportRequestsReturn {
  requests: AmmunitionReportRequest[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (payload: CreateRequestPayload) => Promise<{ ok: boolean; id?: string }>;
  cancel: (requestId: string) => Promise<boolean>;
}

function buildActor(
  user: ReturnType<typeof useAuth>['enhancedUser']
): ApiActor | null {
  if (!user || !user.userType) return null;
  return {
    uid: user.uid,
    userType: user.userType,
    teamId: user.teamId,
    displayName:
      user.displayName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      undefined,
  };
}

export function useAmmunitionReportRequests(): UseAmmunitionReportRequestsReturn {
  const { enhancedUser } = useAuth();
  const [requests, setRequests] = useState<AmmunitionReportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ammunition-report-requests');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'שגיאה בטעינת בקשות');
      setRequests(json.requests || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (payload: CreateRequestPayload) => {
      const actor = buildActor(enhancedUser);
      if (!actor) return { ok: false };
      try {
        const res = await fetch('/api/ammunition-report-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actor,
            actorUserName: actor.displayName || actor.uid,
            payload,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'יצירת בקשה נכשלה');
        await refresh();
        return { ok: true, id: json.id as string };
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return { ok: false };
      }
    },
    [enhancedUser, refresh]
  );

  const cancel = useCallback(
    async (requestId: string) => {
      const actor = buildActor(enhancedUser);
      if (!actor) return false;
      try {
        const res = await fetch('/api/ammunition-report-requests', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, action: 'cancel', requestId }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'ביטול נכשל');
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [enhancedUser, refresh]
  );

  return { requests, isLoading, error, refresh, create, cancel };
}
