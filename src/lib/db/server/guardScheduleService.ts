/**
 * Server-side Guard Schedule Service (firebase-admin).
 *
 * Owns writes to the `guardSchedules` collection. Reads are also exposed here
 * for API routes; client code reads via `src/lib/db/guardScheduleClient.ts`.
 *
 * Visibility model: schedules are private to their `createdBy`. Sharing copies
 * (via `serverShareGuardScheduleCopy`) creates a brand-new schedule owned by
 * the recipient and notifies them — the original is never readable by anyone
 * other than its creator (admins excepted via the existing actor model).
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { generateSchedule } from '@/lib/guardSchedule/algorithm';
import type {
  CreateGuardScheduleInput,
  GuardSchedule,
  ScheduleConfig,
  ScheduleAlgorithm,
  ShareGuardScheduleInput,
  ShareGuardScheduleResult,
  ShiftAssignment,
  UpdateGuardSchedulePatch,
} from '@/types/guardSchedule';
import { serverCreateActionLog } from './actionsLogService';
import { serverCreateNotification } from './notificationService';

export class GuardScheduleValidationError extends Error {
  constructor(message: string, public readonly status: 400 | 403 | 404 = 400) {
    super(message);
    this.name = 'GuardScheduleValidationError';
  }
}

const VALID_ALGORITHMS: ReadonlySet<ScheduleAlgorithm> = new Set([
  'round_robin',
  'random_fair',
  'constraint_aware',
]);

function isISODateTime(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s);
}

function validateConfig(config: ScheduleConfig): void {
  if (!isISODateTime(config.startAt)) throw new GuardScheduleValidationError('Invalid startAt');
  if (!isISODateTime(config.endAt)) throw new GuardScheduleValidationError('Invalid endAt');
  if (config.startAt >= config.endAt) {
    throw new GuardScheduleValidationError('startAt must be before endAt');
  }
  if (
    typeof config.shiftDurationHours !== 'number' ||
    config.shiftDurationHours < 0.5 ||
    config.shiftDurationHours > 12
  ) {
    throw new GuardScheduleValidationError('shiftDurationHours must be 0.5–12');
  }
  if (!VALID_ALGORITHMS.has(config.algorithm)) {
    throw new GuardScheduleValidationError('Invalid algorithm');
  }
}

function validateCreateInput(input: CreateGuardScheduleInput): void {
  if (!input.actorUid || !input.actorName) {
    throw new GuardScheduleValidationError('Missing actor');
  }
  if (!input.title || input.title.trim().length === 0) {
    throw new GuardScheduleValidationError('Title is required');
  }
  if (!Array.isArray(input.posts) || input.posts.length === 0) {
    throw new GuardScheduleValidationError('At least one post is required');
  }
  if (!Array.isArray(input.roster) || input.roster.length === 0) {
    throw new GuardScheduleValidationError('At least one person is required');
  }

  for (const post of input.posts) {
    if (!post.id || !post.name) {
      throw new GuardScheduleValidationError('Post id and name are required');
    }
    if (!Number.isInteger(post.defaultHeadcount) || post.defaultHeadcount < 0) {
      throw new GuardScheduleValidationError(`Post ${post.name}: invalid defaultHeadcount`);
    }
    const windows = post.headcountWindows ?? [];
    for (const w of windows) {
      if (
        !Number.isInteger(w.startHour) || w.startHour < 0 || w.startHour > 23 ||
        !Number.isInteger(w.endHour) || w.endHour < 1 || w.endHour > 24 ||
        !Number.isInteger(w.headcount) || w.headcount < 0
      ) {
        throw new GuardScheduleValidationError(`Post ${post.name}: invalid headcount window`);
      }
    }
  }

  validateConfig(input.config);
}

function nowMs(): number {
  return Date.now();
}

function stripUndefined(obj: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/**
 * Create a new schedule. Runs the algorithm server-side so the persisted
 * shifts/assignments/stats are authoritative; client-side preview is a hint
 * only.
 */
export async function serverCreateGuardSchedule(
  input: CreateGuardScheduleInput,
): Promise<{ id: string }> {
  validateCreateInput(input);

  const result = generateSchedule({
    posts: input.posts,
    roster: input.roster,
    config: input.config,
    existingAssignments: input.initialAssignments,
  });

  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.GUARD_SCHEDULES).doc();
  const now = nowMs();

  const doc: GuardSchedule = {
    id: ref.id,
    title: input.title.trim(),
    createdBy: input.actorUid,
    createdByName: input.actorName,
    createdAt: now,
    updatedAt: now,
    config: input.config,
    posts: input.posts,
    roster: input.roster,
    shifts: result.shifts,
    assignments: result.assignments,
    stats: result.stats,
    warnings: result.warnings,
  };

  await ref.set(stripUndefined(doc));

  await serverCreateActionLog({
    actionType: 'GUARD_SCHEDULE_CREATED',
    equipmentId: '',
    equipmentDocId: ref.id,
    equipmentName: doc.title,
    actorId: input.actorUid,
    actorName: input.actorName,
    note: `algorithm=${input.config.algorithm} shifts=${result.shifts.length} fairness=${result.fairnessScore}`,
  });

  return { id: ref.id };
}

export async function serverGetGuardSchedule(id: string): Promise<GuardSchedule | null> {
  if (!id) throw new GuardScheduleValidationError('id is required');
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.GUARD_SCHEDULES).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as GuardSchedule;
  if (data.deletedAt) return null;
  return data;
}

export async function serverListMyGuardSchedules(
  ownerUid: string,
  options: { limit?: number } = {},
): Promise<GuardSchedule[]> {
  if (!ownerUid) throw new GuardScheduleValidationError('ownerUid is required');
  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.GUARD_SCHEDULES)
    .where('createdBy', '==', ownerUid)
    .orderBy('createdAt', 'desc')
    .limit(options.limit ?? 50)
    .get();
  return snap.docs
    .map((d) => d.data() as GuardSchedule)
    .filter((s) => !s.deletedAt);
}

/**
 * Apply a manual edit (assignments and/or title) to an existing schedule.
 * Recomputes stats from the new assignments. Audits the prior assignment
 * snapshot so a regenerate-with-locks can be reasoned about after the fact.
 */
export async function serverUpdateGuardSchedule(
  id: string,
  patch: UpdateGuardSchedulePatch,
): Promise<void> {
  if (!id) throw new GuardScheduleValidationError('id is required');
  if (!patch.actorUid) throw new GuardScheduleValidationError('Missing actor');

  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.GUARD_SCHEDULES).doc(id);

  const oldSnapshot = await ref.get();
  if (!oldSnapshot.exists) throw new GuardScheduleValidationError('Schedule not found', 404);
  const old = oldSnapshot.data() as GuardSchedule;
  if (old.deletedAt) throw new GuardScheduleValidationError('Schedule not found', 404);
  if (old.createdBy !== patch.actorUid) {
    throw new GuardScheduleValidationError('Not the owner', 403);
  }

  const next: Partial<GuardSchedule> = { updatedAt: nowMs() };
  if (patch.title !== undefined) {
    if (patch.title.trim().length === 0) {
      throw new GuardScheduleValidationError('Title cannot be empty');
    }
    next.title = patch.title.trim();
  }
  if (patch.assignments !== undefined) {
    next.assignments = patch.assignments;
    next.stats = recomputeStats(old, patch.assignments);
  }

  await ref.update(stripUndefined(next));

  await serverCreateActionLog({
    actionType: 'GUARD_SCHEDULE_UPDATED',
    equipmentId: '',
    equipmentDocId: id,
    equipmentName: next.title ?? old.title,
    actorId: patch.actorUid,
    actorName: patch.actorName,
    note: patch.assignments
      ? `prevAssignments=${JSON.stringify(old.assignments).slice(0, 500)}`
      : 'title-only',
  });
}

function recomputeStats(schedule: GuardSchedule, assignments: ShiftAssignment[]) {
  const counts = new Map<string, number>();
  for (const p of schedule.roster) counts.set(p.id, 0);
  for (const a of assignments) {
    for (const pid of a.personIds) counts.set(pid, (counts.get(pid) ?? 0) + 1);
  }
  return schedule.roster.map((p) => ({
    personId: p.id,
    shiftsAssigned: counts.get(p.id) ?? 0,
    totalHours: (counts.get(p.id) ?? 0) * schedule.config.shiftDurationHours,
  }));
}

export async function serverDeleteGuardSchedule(
  id: string,
  actorUid: string,
  actorName: string,
): Promise<void> {
  if (!id) throw new GuardScheduleValidationError('id is required');
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.GUARD_SCHEDULES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new GuardScheduleValidationError('Schedule not found', 404);
  const data = snap.data() as GuardSchedule;
  if (data.deletedAt) return; // idempotent
  if (data.createdBy !== actorUid) {
    throw new GuardScheduleValidationError('Not the owner', 403);
  }

  await ref.update({ deletedAt: nowMs() });

  await serverCreateActionLog({
    actionType: 'GUARD_SCHEDULE_DELETED',
    equipmentId: '',
    equipmentDocId: id,
    equipmentName: data.title,
    actorId: actorUid,
    actorName,
    note: '',
  });
}

/**
 * Clone-on-share: creates a fresh schedule owned by the recipient. The recipient
 * gets a notification linking to the new doc. The original is untouched.
 *
 * Audit log entries are written on both sides so either party can trace where
 * a copy came from / went to.
 */
export async function serverShareGuardScheduleCopy(
  input: ShareGuardScheduleInput,
): Promise<ShareGuardScheduleResult> {
  if (!input.sourceId) throw new GuardScheduleValidationError('sourceId is required');
  if (!input.recipientUid) throw new GuardScheduleValidationError('recipientUid is required');
  if (input.recipientUid === input.actorUid) {
    throw new GuardScheduleValidationError('Cannot share a copy with yourself');
  }

  const db = getAdminDb();
  const sourceRef = db.collection(COLLECTIONS.GUARD_SCHEDULES).doc(input.sourceId);
  const sourceSnap = await sourceRef.get();
  if (!sourceSnap.exists) throw new GuardScheduleValidationError('Schedule not found', 404);
  const source = sourceSnap.data() as GuardSchedule;
  if (source.deletedAt) throw new GuardScheduleValidationError('Schedule not found', 404);
  if (source.createdBy !== input.actorUid) {
    throw new GuardScheduleValidationError('Not the owner', 403);
  }

  const recipientSnap = await db.collection(COLLECTIONS.USERS).doc(input.recipientUid).get();
  if (!recipientSnap.exists) {
    throw new GuardScheduleValidationError('Recipient user not found', 404);
  }
  const recipient = recipientSnap.data() as { firstName?: string; lastName?: string };
  const recipientName = `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim() || 'משתמש';

  const newRef = db.collection(COLLECTIONS.GUARD_SCHEDULES).doc();
  const now = nowMs();

  const cloned: GuardSchedule = {
    id: newRef.id,
    title: `${source.title} (משותף ע"י ${input.actorName})`,
    createdBy: input.recipientUid,
    createdByName: recipientName,
    createdAt: now,
    updatedAt: now,
    config: source.config,
    posts: source.posts,
    roster: source.roster,
    shifts: source.shifts,
    assignments: source.assignments.map((a) => ({ ...a, locked: false })),
    stats: source.stats,
    warnings: source.warnings,
    sourceScheduleId: source.id,
  };

  await newRef.set(stripUndefined(cloned));

  await Promise.allSettled([
    serverCreateActionLog({
      actionType: 'GUARD_SCHEDULE_SHARED_FROM',
      equipmentId: '',
      equipmentDocId: source.id,
      equipmentName: source.title,
      actorId: input.actorUid,
      actorName: input.actorName,
      targetId: input.recipientUid,
      targetName: recipientName,
      note: `newId=${newRef.id}`,
    }),
    serverCreateActionLog({
      actionType: 'GUARD_SCHEDULE_SHARED_TO',
      equipmentId: '',
      equipmentDocId: newRef.id,
      equipmentName: cloned.title,
      actorId: input.actorUid,
      actorName: input.actorName,
      targetId: input.recipientUid,
      targetName: recipientName,
      note: `sourceId=${source.id}`,
    }),
    serverCreateNotification({
      userId: input.recipientUid,
      type: 'guard_schedule_shared',
      title: 'שותפה לוח שמירות',
      message: `${input.actorName} שיתף איתך עותק של "${source.title}"`,
      relatedGuardScheduleId: newRef.id,
    }),
  ]);

  return { newId: newRef.id };
}
