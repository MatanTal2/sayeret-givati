/**
 * Soldier-status types — replaces the Google-Sheets-backed status feature.
 *
 * `soldierStatus/{militaryPersonalNumberHash}` stores ONLY the status annotation.
 * Roster fields (firstName / lastName / platoon) are joined at read time from
 * `users` ∪ `authorized_personnel`. Doc-id matches `authorized_personnel` doc-id
 * (the hashed personnel number) so the join is a direct doc lookup.
 */
import type { Timestamp } from 'firebase/firestore';

export type SoldierStatus = 'בית' | 'משמר' | 'אחר';

export const SOLDIER_STATUSES: readonly SoldierStatus[] = ['בית', 'משמר', 'אחר'];

/** Stored shape of a soldierStatus/{hash} document. */
export interface SoldierStatusDoc {
  status: SoldierStatus;
  customStatus?: string;
  updatedAt: Timestamp;
}

/** Joined roster row returned by GET /api/soldier-status. */
export interface RosterEntry {
  /** militaryPersonalNumberHash — also the soldierStatus + authorized_personnel doc-id */
  id: string;
  firstName: string;
  lastName: string;
  platoon: string;
  status: SoldierStatus;
  customStatus?: string;
  /** ISO string when present — milliseconds since epoch on the wire. */
  updatedAtMs?: number;
}

export interface UpdateSoldierStatusInput {
  status: SoldierStatus;
  customStatus?: string;
}

export function isSoldierStatus(value: unknown): value is SoldierStatus {
  return value === 'בית' || value === 'משמר' || value === 'אחר';
}

/**
 * Normalize the input pair. Returns the input or throws on invalid combinations:
 * - status='אחר' requires non-empty customStatus
 * - status!=='אחר' must NOT carry customStatus (we strip it)
 */
export function validateStatusInput(input: UpdateSoldierStatusInput): UpdateSoldierStatusInput {
  if (!isSoldierStatus(input.status)) {
    throw new Error(`status must be one of: בית, משמר, אחר`);
  }
  if (input.status === 'אחר') {
    const trimmed = (input.customStatus ?? '').trim();
    if (!trimmed) {
      throw new Error('customStatus is required when status === אחר');
    }
    return { status: 'אחר', customStatus: trimmed };
  }
  return { status: input.status };
}
