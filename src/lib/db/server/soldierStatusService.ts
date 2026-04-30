/**
 * Server-side Soldier Status Service (firebase-admin).
 *
 * Replaces the Google-Sheets-backed `/api/sheets` flow. The doc id of every
 * `soldierStatus/{id}` is the militaryPersonalNumberHash — the same hash used
 * as the doc id of `authorized_personnel/{hash}` and stored on
 * `users.militaryPersonalNumberHash`. That makes the roster join a direct
 * doc-id lookup, no extra index needed.
 *
 * Roster source: union of `users` (registered profiles, preferred for display)
 * and `authorized_personnel` (admin-managed, fills in non-registered soldiers).
 * Status doc fields are limited to `{ status, customStatus?, updatedAt }`;
 * audit fields and per-soldier history are intentionally deferred.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  validateStatusInput,
  type RosterEntry,
  type SoldierStatus,
  type UpdateSoldierStatusInput,
} from '@/types/soldierStatus';

export class SoldierStatusValidationError extends Error {
  constructor(message: string, public readonly status: 400 | 404 = 400) {
    super(message);
    this.name = 'SoldierStatusValidationError';
  }
}

interface UserDocLite {
  militaryPersonalNumberHash?: string;
  firstName?: string;
  lastName?: string;
  teamId?: string;
}

interface PersonnelDocLite {
  firstName?: string;
  lastName?: string;
  approvedRole?: string;
  status?: string;
}

interface StatusDocLite {
  status?: SoldierStatus;
  customStatus?: string;
  updatedAt?: Timestamp;
}

/**
 * Build the joined roster: users ∪ authorized_personnel, deduped by hash,
 * preferring `users` for display fields when both exist. Each entry is
 * left-joined with its `soldierStatus` doc; missing status defaults to 'בית'.
 *
 * NOTE: this is intentionally an in-memory join over three full reads. The
 * roster is small (single sayeret) so this stays well under any pricing or
 * latency concern; revisit if it ever grows past a few hundred entries.
 */
export async function serverListRoster(): Promise<RosterEntry[]> {
  const db = getAdminDb();
  const [usersSnap, personnelSnap, statusSnap] = await Promise.all([
    db.collection(COLLECTIONS.USERS).get(),
    db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).get(),
    db.collection(COLLECTIONS.SOLDIER_STATUS).get(),
  ]);

  const statusByHash = new Map<string, StatusDocLite>();
  for (const doc of statusSnap.docs) {
    statusByHash.set(doc.id, doc.data() as StatusDocLite);
  }

  // Hash → roster row. Personnel collection seeds the row first so users can
  // override display fields below.
  const rowByHash = new Map<string, RosterEntry>();

  for (const doc of personnelSnap.docs) {
    const data = doc.data() as PersonnelDocLite;
    const hash = doc.id;
    rowByHash.set(hash, {
      id: hash,
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      platoon: 'מסייעת',
      status: 'בית',
    });
  }

  for (const doc of usersSnap.docs) {
    const data = doc.data() as UserDocLite;
    const hash = data.militaryPersonalNumberHash;
    if (!hash) continue;
    const platoon = data.teamId && data.teamId.trim() ? data.teamId : 'מסייעת';
    const existing = rowByHash.get(hash);
    rowByHash.set(hash, {
      id: hash,
      firstName: data.firstName ?? existing?.firstName ?? '',
      lastName: data.lastName ?? existing?.lastName ?? '',
      platoon,
      status: existing?.status ?? 'בית',
      ...(existing?.customStatus ? { customStatus: existing.customStatus } : {}),
      ...(existing?.updatedAtMs ? { updatedAtMs: existing.updatedAtMs } : {}),
    });
  }

  // Apply status overlay last so it survives the user→personnel merge above.
  for (const [hash, row] of rowByHash.entries()) {
    const status = statusByHash.get(hash);
    if (!status) continue;
    rowByHash.set(hash, {
      ...row,
      status: status.status ?? row.status,
      ...(status.customStatus ? { customStatus: status.customStatus } : {}),
      ...(status.updatedAt ? { updatedAtMs: status.updatedAt.toMillis() } : {}),
    });
  }

  return [...rowByHash.values()].sort((a, b) => {
    const an = `${a.firstName} ${a.lastName}`.trim();
    const bn = `${b.firstName} ${b.lastName}`.trim();
    return an.localeCompare(bn, 'he');
  });
}

/**
 * Upsert `soldierStatus/{hash}` with the new status. Validates input shape and
 * (best-effort) verifies the soldier exists in the roster sources, so we don't
 * silently create orphan status docs for unknown hashes.
 */
export async function serverUpdateSoldierStatus(
  hashedId: string,
  input: UpdateSoldierStatusInput
): Promise<void> {
  if (!hashedId || typeof hashedId !== 'string') {
    throw new SoldierStatusValidationError('id is required');
  }
  const normalized = validateStatusInput(input);

  const db = getAdminDb();
  const personnelSnap = await db
    .collection(COLLECTIONS.AUTHORIZED_PERSONNEL)
    .doc(hashedId)
    .get();
  if (!personnelSnap.exists) {
    const userQuery = await db
      .collection(COLLECTIONS.USERS)
      .where('militaryPersonalNumberHash', '==', hashedId)
      .limit(1)
      .get();
    if (userQuery.empty) {
      throw new SoldierStatusValidationError(
        'No matching soldier in users or authorized_personnel',
        404
      );
    }
  }

  const ref = db.collection(COLLECTIONS.SOLDIER_STATUS).doc(hashedId);
  const data: Record<string, unknown> = {
    status: normalized.status,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (normalized.customStatus !== undefined) {
    data.customStatus = normalized.customStatus;
  } else {
    // Clear any stale customStatus from a previous 'אחר' entry.
    data.customStatus = FieldValue.delete();
  }
  await ref.set(data, { merge: true });
}
