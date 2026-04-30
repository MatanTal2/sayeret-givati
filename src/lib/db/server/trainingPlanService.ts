/**
 * Server-side Training Plan Service (firebase-admin).
 *
 * Lifecycle:
 *   PENDING_APPROVAL -> APPROVED | REJECTED
 *   APPROVED         -> COMPLETED | CANCELED
 *   PENDING_APPROVAL -> CANCELED
 *
 * Mutations live here. Reads use the client SDK (see
 * `src/lib/training/trainingPlansService.ts`) per the repo's hybrid pattern.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { serverCreateNotification } from './notificationService';
import type { ApiActor } from './policyHelpers';
import { UserType } from '@/types/user';
import { NotificationType } from '@/types/notifications';
import type {
  CreateTrainingPlanInput,
  TrainingAmmoLine,
  TrainingPlanAction,
  TrainingPlanStatus,
} from '@/types/training';

const ALLOWED_ACTIONS: TrainingPlanAction[] = ['approve', 'reject', 'cancel', 'complete'];

interface ValidatedCreateInput {
  actor: ApiActor;
  plannedByName: string;
  payload: CreateTrainingPlanInput;
}

function isAdminOrSystemManager(actor: ApiActor): boolean {
  return actor.userType === UserType.ADMIN || actor.userType === UserType.SYSTEM_MANAGER;
}

function isTeamLeaderOrAbove(actor: ApiActor): boolean {
  return (
    actor.userType === UserType.ADMIN ||
    actor.userType === UserType.SYSTEM_MANAGER ||
    actor.userType === UserType.MANAGER ||
    actor.userType === UserType.TEAM_LEADER
  );
}

async function getAmmoResponsibleUserId(): Promise<string | null> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.SYSTEM_CONFIG).doc('main').get();
  if (!snap.exists) return null;
  const data = snap.data() ?? {};
  const id = data.ammoNotificationRecipientUserId;
  return typeof id === 'string' && id ? id : null;
}

function isAmmoResponsible(actor: ApiActor, ammoResponsibleUid: string | null): boolean {
  return !!ammoResponsibleUid && actor.uid === ammoResponsibleUid;
}

export function validateCreateTrainingPlanInput(input: unknown): CreateTrainingPlanInput {
  if (!input || typeof input !== 'object') throw new Error('input is required');
  const i = input as Record<string, unknown>;

  if (typeof i.teamId !== 'string' || !i.teamId.trim()) {
    throw new Error('teamId is required');
  }
  if (typeof i.startAtMs !== 'number' || !Number.isFinite(i.startAtMs)) {
    throw new Error('startAtMs must be a finite number');
  }
  if (typeof i.endAtMs !== 'number' || !Number.isFinite(i.endAtMs)) {
    throw new Error('endAtMs must be a finite number');
  }
  if (i.endAtMs <= i.startAtMs) {
    throw new Error('endAtMs must be after startAtMs');
  }
  for (const f of ['rangeLocation', 'contactName', 'contactPhone', 'radioFrequency'] as const) {
    if (typeof i[f] !== 'string' || !(i[f] as string).trim()) {
      throw new Error(`${f} is required`);
    }
  }
  if (typeof i.headcount !== 'number' || !Number.isFinite(i.headcount) || i.headcount < 1) {
    throw new Error('headcount must be a positive number');
  }
  if (!Array.isArray(i.ammoLines) || i.ammoLines.length === 0) {
    throw new Error('ammoLines must be a non-empty array');
  }
  const lines: TrainingAmmoLine[] = (i.ammoLines as unknown[]).map((raw) => {
    if (!raw || typeof raw !== 'object') throw new Error('each ammo line must be an object');
    const l = raw as Record<string, unknown>;
    if (typeof l.templateId !== 'string' || !l.templateId.trim()) {
      throw new Error('ammoLines[].templateId is required');
    }
    if (typeof l.templateName !== 'string' || !l.templateName.trim()) {
      throw new Error('ammoLines[].templateName is required');
    }
    if (typeof l.qty !== 'number' || !Number.isFinite(l.qty) || l.qty <= 0) {
      throw new Error('ammoLines[].qty must be a positive number');
    }
    return {
      templateId: l.templateId,
      templateName: l.templateName,
      qty: l.qty,
    };
  });

  return {
    teamId: i.teamId.trim(),
    startAtMs: i.startAtMs,
    endAtMs: i.endAtMs,
    rangeLocation: (i.rangeLocation as string).trim(),
    contactName: (i.contactName as string).trim(),
    contactPhone: (i.contactPhone as string).trim(),
    radioFrequency: (i.radioFrequency as string).trim(),
    headcount: i.headcount,
    ammoLines: lines,
    ...(typeof i.notes === 'string' && i.notes.trim() ? { notes: i.notes.trim() } : {}),
  };
}

export async function serverCreateTrainingPlan(
  input: ValidatedCreateInput
): Promise<{ id: string }> {
  const { actor, plannedByName, payload } = input;
  if (!isTeamLeaderOrAbove(actor)) {
    throw new Error('Forbidden: only team leaders and above may plan trainings');
  }
  if (!isAdminOrSystemManager(actor) && actor.teamId && payload.teamId !== actor.teamId) {
    throw new Error("Forbidden: you may only plan trainings for your own team");
  }

  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.TRAINING_PLANS).doc();

  const data: Record<string, unknown> = {
    id: ref.id,
    teamId: payload.teamId,
    startAt: Timestamp.fromDate(new Date(payload.startAtMs)),
    endAt: Timestamp.fromDate(new Date(payload.endAtMs)),
    rangeLocation: payload.rangeLocation,
    contactName: payload.contactName,
    contactPhone: payload.contactPhone,
    radioFrequency: payload.radioFrequency,
    headcount: payload.headcount,
    ammoLines: payload.ammoLines,
    status: 'PENDING_APPROVAL' as TrainingPlanStatus,
    plannedBy: actor.uid,
    plannedByName,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (payload.notes) data.notes = payload.notes;

  await ref.set(data);

  try {
    const ammoResponsibleUid = await getAmmoResponsibleUserId();
    if (ammoResponsibleUid) {
      await serverCreateNotification({
        userId: ammoResponsibleUid,
        type: NotificationType.TRAINING_PLAN_SUBMITTED,
        title: 'תכנון אימון חדש לאישור',
        message: `${plannedByName} הגיש תכנון אימון לצוות ${payload.teamId} לאישור`,
        relatedEquipmentDocId: ref.id,
      });
    }
  } catch (e) {
    console.error('[Server] training plan submit notification failed:', e);
  }

  return { id: ref.id };
}

interface TransitionInput {
  actor: ApiActor;
  actorName: string;
  planId: string;
  action: TrainingPlanAction;
  reason?: string;
}

export async function serverTransitionTrainingPlan(input: TransitionInput): Promise<void> {
  if (!ALLOWED_ACTIONS.includes(input.action)) {
    throw new Error(`unsupported action: ${input.action}`);
  }
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.TRAINING_PLANS).doc(input.planId);
  const ammoResponsibleUid = await getAmmoResponsibleUserId();

  let newStatus: TrainingPlanStatus = 'PENDING_APPROVAL';
  let plannedBy = '';
  let teamId = '';

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('Training plan not found');
    const data = snap.data()!;
    const status = data.status as TrainingPlanStatus;
    plannedBy = data.plannedBy as string;
    teamId = (data.teamId as string) || '';

    const isPlanner = input.actor.uid === plannedBy;
    const isApprover = isAdminOrSystemManager(input.actor) || isAmmoResponsible(input.actor, ammoResponsibleUid);

    if (input.action === 'approve' || input.action === 'reject') {
      if (!isApprover) throw new Error('Forbidden: only the ammo-responsible user, system manager, or admin may approve or reject');
      if (status !== 'PENDING_APPROVAL') throw new Error(`cannot ${input.action} a plan in status ${status}`);
      newStatus = input.action === 'approve' ? 'APPROVED' : 'REJECTED';
    } else if (input.action === 'cancel') {
      if (!(isPlanner || isApprover)) throw new Error('Forbidden: only the planner or an approver may cancel');
      if (!(status === 'PENDING_APPROVAL' || status === 'APPROVED')) {
        throw new Error(`cannot cancel a plan in status ${status}`);
      }
      newStatus = 'CANCELED';
    } else {
      // complete
      if (!(isPlanner || isApprover)) throw new Error('Forbidden: only the planner or an approver may complete');
      if (status !== 'APPROVED') throw new Error(`cannot complete a plan in status ${status}`);
      newStatus = 'COMPLETED';
    }

    const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (input.action === 'approve' || input.action === 'reject') {
      update.approverUserId = input.actor.uid;
    }
    if (input.action === 'reject' && input.reason) {
      update.rejectionReason = input.reason;
    }
    tx.update(ref, update);
  });

  try {
    if (input.action === 'approve') {
      await serverCreateNotification({
        userId: plannedBy,
        type: NotificationType.TRAINING_PLAN_APPROVED,
        title: 'תכנון אימון אושר',
        message: `התכנון לצוות ${teamId} אושר על ידי ${input.actorName}`,
        relatedEquipmentDocId: input.planId,
      });
    } else if (input.action === 'reject') {
      await serverCreateNotification({
        userId: plannedBy,
        type: NotificationType.TRAINING_PLAN_REJECTED,
        title: 'תכנון אימון נדחה',
        message: input.reason
          ? `התכנון לצוות ${teamId} נדחה: ${input.reason}`
          : `התכנון לצוות ${teamId} נדחה על ידי ${input.actorName}`,
        relatedEquipmentDocId: input.planId,
      });
    }
  } catch (e) {
    console.error('[Server] training plan transition notification failed:', e);
  }
}

interface RestockRequestInput {
  actor: ApiActor;
  actorName: string;
  planId: string;
  templateId: string;
  templateName: string;
  shortfallQty: number;
  note?: string;
}

export async function serverCreateRestockRequest(input: RestockRequestInput): Promise<void> {
  if (!input.templateId.trim()) throw new Error('templateId is required');
  if (!Number.isFinite(input.shortfallQty) || input.shortfallQty <= 0) {
    throw new Error('shortfallQty must be a positive number');
  }
  const db = getAdminDb();
  const planRef = db.collection(COLLECTIONS.TRAINING_PLANS).doc(input.planId);
  const planSnap = await planRef.get();
  if (!planSnap.exists) throw new Error('Training plan not found');

  const ammoResponsibleUid = await getAmmoResponsibleUserId();
  if (!ammoResponsibleUid) {
    throw new Error('No ammo-responsible user is configured in system config');
  }

  await serverCreateNotification({
    userId: ammoResponsibleUid,
    type: NotificationType.AMMO_RESTOCK_REQUEST,
    title: 'בקשה לתוספת תחמושת',
    message: input.note
      ? `${input.actorName} מבקש ${input.shortfallQty} ${input.templateName}: ${input.note}`
      : `${input.actorName} מבקש תוספת של ${input.shortfallQty} ${input.templateName} עבור אימון`,
    relatedEquipmentDocId: input.planId,
  });
}
