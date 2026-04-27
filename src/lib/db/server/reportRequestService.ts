/**
 * Server-side Report Request Service (firebase-admin).
 * Manager-triggered "report now" demands. Target scope can be user/items/team/all.
 * Per-user fulfillment is tracked on the request doc and updated when each
 * target user reports an item in scope.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { serverCreateActionLog } from './actionsLogService';
import { serverCreateBatchNotifications } from './notificationService';
import {
  ActionType,
  ReportRequestScope,
  ReportRequestStatus,
} from '@/types/equipment';

const DEFAULT_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

interface CreateReportRequestInput {
  scope: ReportRequestScope;
  targetUserIds: string[];
  targetEquipmentDocIds?: string[];
  targetTeamId?: string;
  requestedByUserId: string;
  requestedByUserName: string;
  note?: string;
  expiresAtMs?: number; // Override default 48h (test / special cases)
}

export async function serverCreateReportRequest(
  input: CreateReportRequestInput
): Promise<{ id: string }> {
  const db = getAdminDb();

  // Materialize targetUserIds for team/all scopes when caller didn't pre-resolve.
  let resolvedTargetIds = input.targetUserIds ?? [];
  if (resolvedTargetIds.length === 0) {
    if (input.scope === ReportRequestScope.TEAM) {
      if (!input.targetTeamId) {
        throw new Error('targetTeamId is required when scope=team and targetUserIds is empty');
      }
      const snap = await db
        .collection(COLLECTIONS.USERS)
        .where('teamId', '==', input.targetTeamId)
        .where('status', '==', 'active')
        .get();
      resolvedTargetIds = snap.docs.map((d) => d.id);
    } else if (input.scope === ReportRequestScope.ALL) {
      const snap = await db
        .collection(COLLECTIONS.USERS)
        .where('status', '==', 'active')
        .get();
      resolvedTargetIds = snap.docs.map((d) => d.id);
    }
  }
  if (resolvedTargetIds.length === 0) {
    throw new Error('Could not resolve any target users for this report request');
  }
  const ref = db.collection(COLLECTIONS.REPORT_REQUESTS).doc();
  const now = new Date();
  const expiresAt = Timestamp.fromDate(
    new Date(now.getTime() + (input.expiresAtMs ?? DEFAULT_EXPIRY_MS))
  );

  const fulfillmentByUser: Record<string, { fulfilled: boolean }> = {};
  resolvedTargetIds.forEach((uid) => {
    fulfillmentByUser[uid] = { fulfilled: false };
  });

  const data: Record<string, unknown> = {
    scope: input.scope,
    targetUserIds: resolvedTargetIds,
    requestedByUserId: input.requestedByUserId,
    requestedByUserName: input.requestedByUserName,
    status: ReportRequestStatus.PENDING,
    fulfillmentByUser,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
  };
  if (input.targetEquipmentDocIds?.length) {
    data.targetEquipmentDocIds = input.targetEquipmentDocIds;
  }
  if (input.targetTeamId) data.targetTeamId = input.targetTeamId;
  if (input.note) data.note = input.note;

  await ref.set(data);

  // Post-create side effects (non-critical)
  try {
    await serverCreateActionLog({
      actionType: ActionType.REPORT_REQUESTED,
      equipmentId: '',
      equipmentDocId: '',
      equipmentName: `report-request:${input.scope}`,
      actorId: input.requestedByUserId,
      actorName: input.requestedByUserName,
      ...(input.note ? { note: input.note } : {}),
    });

    await serverCreateBatchNotifications(
      resolvedTargetIds.map((uid) => ({
        userId: uid,
        type: 'report_requested',
        title: 'בקשת דיווח ציוד',
        message:
          input.note ||
          `${input.requestedByUserName} מבקש דיווח על הציוד שלך`,
      }))
    );
  } catch (e) {
    console.error('[Server] report request side effects failed:', e);
  }

  return { id: ref.id };
}

interface FulfillReportRequestInput {
  requestId: string;
  userId: string; // user who fulfilled
}

export async function serverFulfillReportRequest(
  input: FulfillReportRequestInput
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.REPORT_REQUESTS).doc(input.requestId);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);
    if (!doc.exists) throw new Error('Report request not found');
    const req = doc.data()!;

    const fulfillment: Record<string, { fulfilled: boolean; fulfilledAt?: Timestamp }> = {
      ...(req.fulfillmentByUser || {}),
    };
    if (!(input.userId in fulfillment)) {
      throw new Error('User is not a target of this report request');
    }

    fulfillment[input.userId] = {
      fulfilled: true,
      fulfilledAt: Timestamp.now(),
    };

    const allFulfilled = Object.values(fulfillment).every((f) => f.fulfilled);
    const anyFulfilled = Object.values(fulfillment).some((f) => f.fulfilled);

    const newStatus = allFulfilled
      ? ReportRequestStatus.FULFILLED
      : anyFulfilled
      ? ReportRequestStatus.PARTIALLY_FULFILLED
      : ReportRequestStatus.PENDING;

    transaction.update(ref, {
      fulfillmentByUser: fulfillment,
      status: newStatus,
    });
  });
}
