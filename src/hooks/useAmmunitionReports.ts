'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import {
  listAmmunitionReports,
  subscribeAmmunitionReports,
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

export function useAmmunitionReports(): UseAmmunitionReportsReturn {
  const [reports, setReports] = useState<AmmunitionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterRef = useRef<ListReportsFilter>({});

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const unsub = subscribeAmmunitionReports(
      filterRef.current,
      (rows) => {
        setReports(rows);
        setIsLoading(false);
      },
      (e) => {
        setError(e.message || 'שגיאה בטעינת דיווחים');
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const refresh = useCallback(async (filter: ListReportsFilter = {}) => {
    setError(null);
    try {
      const list = await listAmmunitionReports(filter);
      setReports(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינת דיווחים');
    }
  }, []);

  const submit = useCallback(async (payload: SubmitReportPayload) => {
    try {
      const res = await apiFetch('/api/ammunition-reports', {
        method: 'POST',
        body: JSON.stringify({ payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'שליחת דיווח נכשלה');
      }
      return { ok: true, reportId: json.reportId as string };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return { ok: false };
    }
  }, []);

  return { reports, isLoading, error, refresh, submit };
}
