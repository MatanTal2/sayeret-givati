/**
 * Server-side Ammunition Report Request Service (firebase-admin).
 *
 * Phase 6 — manager-triggered "please report" demands. Mirrors the equipment
 * `reportRequestService.ts` shape (see docs/spec/ammunition-feature.md).
 *
 * Scope ∈ INDIVIDUAL | TEAM | ALL. For TEAM and ALL the service materializes
 * `targetUserIds` from the active `users` collection if the caller didn't
 * pre-resolve them.
 *
 * Fulfillment is patched by `serverSubmitAmmunitionReport` when the submitted
 * report carries a `reportRequestId`.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { serverCreateActionLog } from './actionsLogService';
import { serverCreateBatchNotifications } from './notificationService';
import type { ApiActor } from './policyHelpers';
import type {
  AmmunitionReportRequest,
  AmmunitionReportRequestScope,
  AmmunitionReportRequestStatus,
} from '@/types/ammunition';

const SCOPES: AmmunitionReportRequestScope[] = ['INDIVIDUAL', 'TEAM', 'ALL'];

export interface CreateReportRequestInput {
  actor: ApiActor;
  actorUserName: string;
  scope: AmmunitionReportRequestScope;
  targetUserIds?: string[];
  targetTeamId?: string;
  templateIds?: string[];
  dueAtMs?: number;
  note?: string;
}

export function validateCreateReportRequestInput(input: unknown): CreateReportRequestInput {
  if (!input || typeof input !== 'object') throw new Error('input is required');
  const i = input as Record<string, unknown>;
  if (typeof i.scope !== 'string' || !SCOPES.includes(i.scope as AmmunitionReportRequestScope)) {
    throw new Error('scope must be INDIVIDUAL, TEAM, or ALL');
  }
  if (i.targetUserIds !== undefined) {
    if (!Array.isArray(i.targetUserIds) || i.targetUserIds.some((s) => typeof s !== 'string')) {
      throw new Error('targetUserIds must be an array of strings');
    }
  }
  if (i.templateIds !== undefined) {
    if (!Array.isArray(i.templateIds) || i.templateIds.some((s) => typeof s !== 'string')) {
      throw new Error('templateIds must be an array of strings');
    }
  }
  if (i.dueAtMs !== undefined && (typeof i.dueAtMs !== 'number' || !Number.isFinite(i.dueAtMs))) {
    throw new Error('dueAtMs must be a number (epoch ms)');
  }
  if (i.scope === 'INDIVIDUAL') {
    if (!Array.isArray(i.targetUserIds) || i.targetUserIds.length === 0) {
      throw new Error('targetUserIds is required when scope=INDIVIDUAL');
    }
  }
  if (i.scope === 'TEAM' && !i.targetTeamId && (!Array.isArray(i.targetUserIds) || i.targetUserIds.length === 0)) {
    throw new Error('targetTeamId or pre-resolved targetUserIds required when scope=TEAM');
  }

  return {
    actor: i.actor as ApiActor,
    actorUserName: typeof i.actorUserName === 'string' ? i.actorUserName : '',
    scope: i.scope as AmmunitionReportRequestScope,
    ...(Array.isArray(i.targetUserIds) ? { targetUserIds: i.targetUserIds as string[] } : {}),
    ...(typeof i.targetTeamId === 'string' && i.targetTeamId ? { targetTeamId: i.targetTeamId } : {}),
    ...(Array.isArray(i.templateIds) ? { templateIds: i.templateIds as string[] } : {}),
    ...(typeof i.dueAtMs === 'number' ? { dueAtMs: i.dueAtMs } : {}),
    ...(typeof i.note === 'string' && i.note ? { note: i.note } : {}),
  };
}

async function materializeTargets(
  scope: AmmunitionReportRequestScope,
  targetUserIds: string[] | undefined,
  targetTeamId: string | undefined
): Promise<string[]> {
  if (Array.isArray(targetUserIds) && targetUserIds.length > 0) return targetUserIds;
  const db = getAdminDb();
  if (scope === 'TEAM') {
    if (!targetTeamId) throw new Error('targetTeamId required when scope=TEAM and no pre-resolved list');
    const snap = await db
      .collection(COLLECTIONS.USERS)
      .where('teamId', '==', targetTeamId)
      .where('status', '==', 'active')
      .get();
    return snap.docs.map((d) => d.id);
  }
  if (scope === 'ALL') {
    const snap = await db.collection(COLLECTIONS.USERS).where('status', '==', 'active').get();
    return snap.docs.map((d) => d.id);
  }
  return [];
}

export async function serverCreateAmmunitionReportRequest(
  input: CreateReportRequestInput
): Promise<{ id: string; targetUserIds: string[] }> {
  const db = getAdminDb();
  const targets = await materializeTargets(input.scope, input.targetUserIds, input.targetTeamId);
  if (targets.length === 0) throw new Error('Could not resolve any target users for this request');

  const ref = db.collection(COLLECTIONS.AMMUNITION_REPORT_REQUESTS).doc();

  const fulfillmentByUser: Record<string, { fulfilled: boolean }> = {};
  targets.forEach((uid) => {
    fulfillmentByUser[uid] = { fulfilled: false };
  });

  const data: Record<string, unknown> = {
    id: ref.id,
    requestedBy: input.actor.uid,
    requestedByName: input.actorUserName || input.actor.displayName || input.actor.uid,
    scope: input.scope,
    targetUserIds: targets,
    fulfillmentByUser,
    status: 'OPEN' as AmmunitionReportRequestStatus,
    createdAt: FieldValue.serverTimestamp(),
  };
  if (input.targetTeamId) data.targetTeamId = input.targetTeamId;
  if (input.templateIds && input.templateIds.length > 0) data.templateIds = input.templateIds;
  if (typeof input.dueAtMs === 'number') {
    data.dueAt = Timestamp.fromDate(new Date(input.dueAtMs));
  }
  if (input.note) data.note = input.note;

  await ref.set(data);

  // Side effects — non-transactional but idempotent enough for retries.
  try {
    await serverCreateActionLog({
      actionType: 'AMMO_REPORT_REQUESTED',
      equipmentId: '',
      equipmentDocId: ref.id,
      equipmentName: `ammo-report-request:${input.scope}`,
      actorId: input.actor.uid,
      actorName: input.actorUserName || input.actor.displayName || input.actor.uid,
      ...(input.note ? { note: input.note } : {}),
    });
    await serverCreateBatchNotifications(
      targets.map((uid) => ({
        userId: uid,
        type: 'ammo_report_requested',
        title: 'בקשה לדיווח תחמושת',
        message:
          input.note ||
          `${input.actorUserName || input.actor.displayName || 'מנהל'} מבקש דיווח על תחמושת`,
        relatedEquipmentDocId: ref.id,
      }))
    );
  } catch (e) {
    console.error('[Server] ammo report-request side effects failed:', e);
  }

  return { id: ref.id, targetUserIds: targets };
}

export interface CancelReportRequestInput {
  actor: ApiActor;
  requestId: string;
}

export async function serverCancelAmmunitionReportRequest(
  input: CancelReportRequestInput
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.AMMUNITION_REPORT_REQUESTS).doc(input.requestId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Report request not found');
  await ref.update({
    status: 'CANCELED' as AmmunitionReportRequestStatus,
  });
}

export async function serverPatchFulfillment(
  requestId: string,
  reporterId: string,
  reportId: string
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.AMMUNITION_REPORT_REQUESTS).doc(requestId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const req = snap.data()!;
    const fulfillment: Record<string, { fulfilled: boolean; fulfilledAt?: Timestamp; reportId?: string }> = {
      ...(req.fulfillmentByUser || {}),
    };
    if (!(reporterId in fulfillment)) return;
    fulfillment[reporterId] = {
      fulfilled: true,
      fulfilledAt: Timestamp.now(),
      reportId,
    };
    const allFulfilled = Object.values(fulfillment).every((f) => f.fulfilled);
    const newStatus: AmmunitionReportRequestStatus = allFulfilled ? 'CLOSED' : 'OPEN';
    tx.update(ref, {
      fulfillmentByUser: fulfillment,
      status: newStatus,
    });
  });
}

export async function serverListAmmunitionReportRequests(): Promise<AmmunitionReportRequest[]> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.AMMUNITION_REPORT_REQUESTS).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionReportRequest);
}
