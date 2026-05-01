'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import { generateSchedule } from '@/lib/guardSchedule/algorithm';
import { formatScheduleAsText, formatScheduleAsCsv } from '@/lib/guardSchedule/formatters';
import { getGuardSchedule } from '@/lib/db/guardScheduleClient';
import type {
  GenerationInput,
  GenerationResult,
  GuardSchedule,
  ShiftAssignment,
} from '@/types/guardSchedule';

/**
 * Owns the working state of a guard schedule:
 *   - in-memory generation result (preview before save)
 *   - server-persisted schedule (after save / when loading by id)
 *   - manual edits (swap + lock) layered on top of the result
 *
 * Server reads via Firestore client SDK; writes via authenticated API routes.
 */
export function useGuardSchedule(initialId?: string) {
  const [schedule, setSchedule] = useState<GuardSchedule | null>(null);
  const [working, setWorking] = useState<GenerationResult | null>(null);
  const [lastInput, setLastInput] = useState<GenerationInput | null>(null);
  const [loading, setLoading] = useState<boolean>(!!initialId);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(initialId ?? null);

  useEffect(() => {
    if (!initialId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const got = await getGuardSchedule(initialId);
        if (!got) throw new Error('Schedule not found');
        if (cancelled) return;
        setSchedule(got);
        setWorking({
          shifts: got.shifts,
          assignments: got.assignments,
          stats: got.stats,
          fairnessScore: 0,
          warnings: got.warnings,
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initialId]);

  const generate = useCallback((input: GenerationInput): GenerationResult => {
    const result = generateSchedule(input);
    setWorking(result);
    setLastInput(input);
    return result;
  }, []);

  const regenerate = useCallback((opts: { preserveLocks: boolean }): GenerationResult | null => {
    if (!lastInput) return null;
    const next: GenerationInput = {
      ...lastInput,
      existingAssignments: opts.preserveLocks ? working?.assignments : undefined,
    };
    const result = generateSchedule(next);
    setWorking(result);
    setLastInput(next);
    return result;
  }, [lastInput, working]);

  const manualSwap = useCallback((shiftId: string, fromPersonId: string, toPersonId: string) => {
    setWorking((prev) => {
      if (!prev) return prev;
      const assignments = prev.assignments.map<ShiftAssignment>((a) => {
        if (a.shiftId !== shiftId) return a;
        const idx = a.personIds.indexOf(fromPersonId);
        if (idx === -1) return a;
        const next = a.personIds.slice();
        next[idx] = toPersonId;
        return { ...a, personIds: next, locked: true, manuallyEditedAt: Date.now() };
      });
      return { ...prev, assignments };
    });
  }, []);

  const lockAssignment = useCallback((shiftId: string, locked: boolean) => {
    setWorking((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        assignments: prev.assignments.map((a) =>
          a.shiftId === shiftId ? { ...a, locked } : a,
        ),
      };
    });
  }, []);

  const save = useCallback(async (title: string): Promise<string> => {
    if (!lastInput || !working) throw new Error('Nothing to save — generate first');
    const response = await apiFetch('/api/guard-schedules', {
      method: 'POST',
      body: JSON.stringify({
        title,
        config: lastInput.config,
        posts: lastInput.posts,
        roster: lastInput.roster,
        initialAssignments: working.assignments,
      }),
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body.error || 'Failed to save');
    }
    setSavedId(body.id);
    return body.id;
  }, [lastInput, working]);

  const persistEdits = useCallback(async (): Promise<void> => {
    if (!savedId || !working) throw new Error('Nothing to persist');
    const response = await apiFetch(`/api/guard-schedules/${savedId}`, {
      method: 'PATCH',
      body: JSON.stringify({ assignments: working.assignments }),
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body.error || 'Failed to persist edits');
    }
  }, [savedId, working]);

  const shareCopy = useCallback(async (recipientUid: string): Promise<{ newId: string }> => {
    if (!savedId) throw new Error('Save the schedule before sharing');
    const response = await apiFetch(`/api/guard-schedules/${savedId}/share`, {
      method: 'POST',
      body: JSON.stringify({ recipientUid }),
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body.error || 'Failed to share');
    }
    return { newId: body.newId };
  }, [savedId]);

  const buildScheduleSnapshot = useCallback((title: string): GuardSchedule | null => {
    if (!lastInput || !working) return null;
    return {
      id: savedId ?? 'preview',
      title,
      createdBy: '',
      createdByName: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: lastInput.config,
      posts: lastInput.posts,
      roster: lastInput.roster,
      shifts: working.shifts,
      assignments: working.assignments,
      stats: working.stats,
      warnings: working.warnings,
    };
  }, [lastInput, working, savedId]);

  const exportText = useCallback((title: string): string => {
    const snap = schedule ?? buildScheduleSnapshot(title);
    return snap ? formatScheduleAsText(snap) : '';
  }, [schedule, buildScheduleSnapshot]);

  const exportCsv = useCallback((title: string): string => {
    const snap = schedule ?? buildScheduleSnapshot(title);
    return snap ? formatScheduleAsCsv(snap) : '';
  }, [schedule, buildScheduleSnapshot]);

  return {
    schedule,
    working,
    loading,
    error,
    savedId,
    generate,
    regenerate,
    manualSwap,
    lockAssignment,
    save,
    persistEdits,
    shareCopy,
    exportText,
    exportCsv,
  };
}
