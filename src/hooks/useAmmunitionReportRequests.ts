'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/apiFetch';
import type {
  AmmunitionReportRequest,
  AmmunitionReportRequestScope,
} from '@/types/ammunition';

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

export function useAmmunitionReportRequests(): UseAmmunitionReportRequestsReturn {
  const { enhancedUser } = useAuth();
  const [requests, setRequests] = useState<AmmunitionReportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/ammunition-report-requests');
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
      try {
        const displayName =
          enhancedUser?.displayName ||
          [enhancedUser?.firstName, enhancedUser?.lastName].filter(Boolean).join(' ') ||
          enhancedUser?.uid ||
          '';
        const res = await apiFetch('/api/ammunition-report-requests', {
          method: 'POST',
          body: JSON.stringify({
            actorUserName: displayName,
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
      try {
        const res = await apiFetch('/api/ammunition-report-requests', {
          method: 'PATCH',
          body: JSON.stringify({ action: 'cancel', requestId }),
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
    [refresh]
  );

  return { requests, isLoading, error, refresh, create, cancel };
}
