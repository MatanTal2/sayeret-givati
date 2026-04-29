'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import {
  listAmmunitionReports,
  type ListReportsFilter,
} from '@/lib/ammunition/reportsService';
import type { AmmunitionReport, BruceState } from '@/types/ammunition';

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

export function useAmmunitionReports(initialFilter: ListReportsFilter = {}): UseAmmunitionReportsReturn {
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
      try {
        const res = await apiFetch('/api/ammunition-reports', {
          method: 'POST',
          body: JSON.stringify({ payload }),
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
    [refresh]
  );

  return { reports, isLoading, error, refresh, submit };
}
