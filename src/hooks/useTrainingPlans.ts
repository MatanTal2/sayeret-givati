'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/apiFetch';
import {
  listTrainingPlans,
  type ListTrainingPlansFilter,
} from '@/lib/training/trainingPlansService';
import type {
  CreateTrainingPlanInput,
  TrainingPlan,
} from '@/types/training';

export interface RequestRestockPayload {
  templateId: string;
  templateName: string;
  shortfallQty: number;
  note?: string;
}

export interface UseTrainingPlansReturn {
  plans: TrainingPlan[];
  isLoading: boolean;
  error: string | null;
  refresh: (filter?: ListTrainingPlansFilter) => Promise<void>;
  create: (payload: CreateTrainingPlanInput) => Promise<{ ok: boolean; id?: string }>;
  approve: (planId: string) => Promise<boolean>;
  reject: (planId: string, reason: string) => Promise<boolean>;
  cancel: (planId: string) => Promise<boolean>;
  complete: (planId: string) => Promise<boolean>;
  requestRestock: (planId: string, payload: RequestRestockPayload) => Promise<boolean>;
}

function actorDisplayName(user: ReturnType<typeof useAuth>['enhancedUser']): string {
  if (!user) return '';
  return (
    user.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.uid ||
    ''
  );
}

export function useTrainingPlans(): UseTrainingPlansReturn {
  const { enhancedUser } = useAuth();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (filter: ListTrainingPlansFilter = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await listTrainingPlans(filter);
      setPlans(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינת תכנוני אימונים');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (payload: CreateTrainingPlanInput) => {
      try {
        const res = await apiFetch('/api/training-plans', {
          method: 'POST',
          body: JSON.stringify({
            payload,
            plannedByName: actorDisplayName(enhancedUser),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'יצירת תכנון נכשלה');
        await refresh();
        return { ok: true, id: json.id as string };
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return { ok: false };
      }
    },
    [enhancedUser, refresh]
  );

  const transition = useCallback(
    async (planId: string, action: 'approve' | 'reject' | 'cancel' | 'complete', reason?: string) => {
      try {
        const res = await apiFetch(`/api/training-plans/${encodeURIComponent(planId)}`, {
          method: 'PATCH',
          body: JSON.stringify({
            action,
            actorName: actorDisplayName(enhancedUser),
            ...(reason ? { reason } : {}),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'הפעולה נכשלה');
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [enhancedUser, refresh]
  );

  const approve = useCallback((planId: string) => transition(planId, 'approve'), [transition]);
  const reject = useCallback(
    (planId: string, reason: string) => transition(planId, 'reject', reason),
    [transition]
  );
  const cancel = useCallback((planId: string) => transition(planId, 'cancel'), [transition]);
  const complete = useCallback((planId: string) => transition(planId, 'complete'), [transition]);

  const requestRestock = useCallback(
    async (planId: string, payload: RequestRestockPayload) => {
      try {
        const res = await apiFetch(
          `/api/training-plans/${encodeURIComponent(planId)}/restock-request`,
          {
            method: 'POST',
            body: JSON.stringify({
              ...payload,
              actorName: actorDisplayName(enhancedUser),
            }),
          }
        );
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'שליחת בקשה נכשלה');
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [enhancedUser]
  );

  return { plans, isLoading, error, refresh, create, approve, reject, cancel, complete, requestRestock };
}
