'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listAmmunitionReports,
  type ListReportsFilter,
} from '@/lib/ammunition/reportsService';
import type { AmmunitionReport, BruceState } from '@/types/ammunition';
import type { ApiActor } from '@/lib/equipmentService';

export interface SubmitReportPayload {
  templateId: string;
  reason: string;
  usedAtMs: number;
  brucesConsumed?: number;
  cardboardsConsumed?: number;
  bulletsConsumed?: number;
  finalOpenBruceState?: BruceState;
  itemSerials?: string[];
  quantityConsumed?: number;
  reportRequestId?: string;
}

export interface UseAmmunitionReportsReturn {
  reports: AmmunitionReport[];
  isLoading: boolean;
  error: string | null;
  refresh: (filter?: ListReportsFilter) => Promise<void>;
  submit: (payload: SubmitReportPayload) => Promise<{ ok: boolean; reportId?: string }>;
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

export function useAmmunitionReports(initialFilter: ListReportsFilter = {}): UseAmmunitionReportsReturn {
  const { enhancedUser } = useAuth();
  const [reports, setReports] = useState<AmmunitionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (filter: ListReportsFilter = initialFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await listAmmunitionReports(filter);
      setReports(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינת דיווחים');
    } finally {
      setIsLoading(false);
    }
  }, [initialFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = useCallback(
    async (payload: SubmitReportPayload) => {
      const actor = buildActor(enhancedUser);
      if (!actor) return { ok: false };
      try {
        const res = await fetch('/api/ammunition-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, payload }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'שליחת דיווח נכשלה');
        }
        await refresh();
        return { ok: true, reportId: json.reportId as string };
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return { ok: false };
      }
    },
    [enhancedUser, refresh]
  );

  return { reports, isLoading, error, refresh, submit };
}
