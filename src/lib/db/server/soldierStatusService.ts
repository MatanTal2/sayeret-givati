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
 *
 * Audit fields and a `history/{autoId}` subcollection (added 2026-05-14):
 *  - The current doc carries `updatedBy` (uid of writer) and optional
 *    `updatedByName` (display name resolved from `users/{uid}` at write time).
 *  - Every status mutation also appends a row to
 *    `soldierStatus/{hash}/history/{autoId}` with the new value, who wrote it,
 *    and the previous value (so the history is self-contained — no need to
 *    cross-reference adjacent rows to know what changed).
 *
 * Race-condition note: writes are sequential (read prior doc → write current
 * → append history) rather than transactional. The roster is small and the
 * mutation cadence is low, so the risk of two concurrent PUTs interleaving is
 * negligible. Revisit if traffic grows.
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

export interface SoldierStatusActor {
  uid: string;
  /** Pre-resolved display name; falls through to a users-collection lookup if absent. */
  displayName?: string;
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
      isRegistered: false,
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
      isRegistered: true,
      ...(existing?.customStatus ? { customStatus: existing.customStatus } : {}),
      ...(existing?.updatedAtMs ? { updatedAtMs: existing.updatedAtMs } : {}),
    });
  }

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

async function resolveActorDisplayName(
  db: ReturnType<typeof getAdminDb>,
  actor: SoldierStatusActor,
): Promise<string | null> {
  if (actor.displayName && actor.displayName.trim()) {
    return actor.displayName.trim();
  }
  try {
    const snap = await db.collection(COLLECTIONS.USERS).doc(actor.uid).get();
    if (!snap.exists) return null;
    const data = snap.data() as UserDocLite | undefined;
    const name = `${data?.firstName ?? ''} ${data?.lastName ?? ''}`.trim();
    return name || null;
  } catch {
    return null;
  }
}

/**
 * Upsert `soldierStatus/{hash}` with the new status. Validates input shape and
 * (best-effort) verifies the soldier exists in the roster sources, so we don't
 * silently create orphan status docs for unknown hashes.
 *
 * Audit + history (added 2026-05-14): the current doc gains `updatedBy` (uid)
 * and optional `updatedByName` (display name). A new entry is appended to
 * `soldierStatus/{hash}/history/{autoId}` with the new state, the writer, and
 * the previous state, so the audit trail is queryable without diffing
 * adjacent rows.
 *
 * `actor` is optional only for backward compatibility with the existing tests
 * that pre-date the audit work. New callers should always pass it.
 */
export async function serverUpdateSoldierStatus(
  hashedId: string,
  input: UpdateSoldierStatusInput,
  actor?: SoldierStatusActor,
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

  // Capture the prior state before we overwrite it — the history row needs
  // both the new and the previous values so it's self-describing.
  const priorSnap = await ref.get();
  const prior = priorSnap.exists ? (priorSnap.data() as StatusDocLite) : null;

  const actorName = actor ? await resolveActorDisplayName(db, actor) : null;

  const data: Record<string, unknown> = {
    status: normalized.status,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (normalized.customStatus !== undefined) {
    data.customStatus = normalized.customStatus;
  } else {
    data.customStatus = FieldValue.delete();
  }
  if (actor) {
    data.updatedBy = actor.uid;
    if (actorName) {
      data.updatedByName = actorName;
    } else {
      // Clear any stale display name resolved from an earlier write.
      data.updatedByName = FieldValue.delete();
    }
  }
  await ref.set(data, { merge: true });

  if (actor) {
    const historyEntry: Record<string, unknown> = {
      status: normalized.status,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid,
    };
    if (normalized.customStatus !== undefined) {
      historyEntry.customStatus = normalized.customStatus;
    }
    if (actorName) historyEntry.updatedByName = actorName;
    if (prior?.status) historyEntry.previousStatus = prior.status;
    if (prior?.customStatus) historyEntry.previousCustomStatus = prior.customStatus;

    await ref.collection('history').doc().set(historyEntry);
  }
}
