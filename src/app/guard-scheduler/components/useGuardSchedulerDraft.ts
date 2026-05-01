'use client';

import { useEffect, useState } from 'react';
import type { GuardPost, RosterPerson, ScheduleConfig } from '@/types/guardSchedule';

const STORAGE_KEY = 'guard_scheduler_draft_v1';

export interface GuardSchedulerDraft {
  version: 1;
  title: string;
  posts: GuardPost[];
  roster: RosterPerson[];
  config: ScheduleConfig;
}

function canAccessStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function loadDraft(): GuardSchedulerDraft | null {
  if (!canAccessStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return null;
    if (!Array.isArray(parsed.posts) || !Array.isArray(parsed.roster)) return null;
    if (!parsed.config || typeof parsed.config !== 'object') return null;
    return parsed as GuardSchedulerDraft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: GuardSchedulerDraft): void {
  if (!canAccessStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota */
  }
}

export function clearDraft(): void {
  if (!canAccessStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Auto-persist a draft on every change. Loaded once on mount; thereafter the
 * caller drives updates via the returned setters and the hook flushes to
 * localStorage on a debounce-free effect (small payload, low write volume).
 */
export function useGuardSchedulerDraft(initial: GuardSchedulerDraft) {
  const [draft, setDraft] = useState<GuardSchedulerDraft>(() => loadDraft() ?? initial);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  return [draft, setDraft, clearDraft] as const;
}
