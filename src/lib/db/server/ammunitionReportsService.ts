/**
 * Server-side Ammunition Reports Service (firebase-admin).
 *
 * Phase 4 — see docs/spec/ammunition-feature.md.
 *
 * Submitting a report runs in a single Firestore transaction:
 *   1. Write the `ammunitionReports` doc.
 *   2. Decrement `ammunitionInventory` (BRUCE / LOOSE_COUNT) or flip
 *      `ammunition` items to CONSUMED (SERIAL).
 *   3. Read TLs for the reporter's team and the responsible-manager id from
 *      `systemConfig/main`.
 *   4. Build the recipient list = TL UIDs ∪ {responsibleManagerId} minus the
 *      reporter; dedupe.
 *
 * After the transaction commits, side-effects (action log, notification fan
 * out) are written. They are not transactional with the report itself but are
 * idempotent enough that a retry would only duplicate notifications.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { serverCreateActionLog } from './actionsLogService';
import { serverCreateBatchNotifications } from './notificationService';
import { serverPatchFulfillment } from './ammunitionReportRequestService';
import type { ApiActor } from './policyHelpers';
import { UserType } from '@/types/user';
import type {
  AmmunitionReport,
  AmmunitionType,
  BruceState,
  TrackingMode,
} from '@/types/ammunition';

const BRUCE_STATES: BruceState[] = ['FULL', 'MORE_THAN_HALF', 'LESS_THAN_HALF', 'EMPTY'];

export interface SubmitReportInput {
  actor: ApiActor;
  templateId: string;
  reason: string;
  usedAtMs: number;
  brucesConsumed?: number;
  cardboardsConsumed?: number;
  bulletsConsumed?: number;
  finalOpenBruceState?: BruceState;
  itemSerials?: string[];
  quantityConsumed?: number;
  reportRequestId?: string;
}

export function validateSubmitReportInput(input: unknown): SubmitReportInput {
  if (!input || typeof input !== 'object') throw new Error('input is required');
  const i = input as Record<string, unknown>;
  if (typeof i.templateId !== 'string' || !i.templateId) throw new Error('templateId is required');
  if (typeof i.reason !== 'string' || !i.reason.trim()) throw new Error('reason is required');
  if (typeof i.usedAtMs !== 'number' || !Number.isFinite(i.usedAtMs)) {
    throw new Error('usedAtMs must be a number (epoch ms)');
  }

  const out: SubmitReportInput = {
    actor: i.actor as ApiActor,
    templateId: i.templateId,
    reason: i.reason.trim(),
    usedAtMs: i.usedAtMs,
  };

  if (i.brucesConsumed !== undefined) {
    if (typeof i.brucesConsumed !== 'number' || i.brucesConsumed < 0) {
      throw new Error('brucesConsumed must be a non-negative number');
    }
    out.brucesConsumed = i.brucesConsumed;
  }
  if (i.cardboardsConsumed !== undefined) {
    if (typeof i.cardboardsConsumed !== 'number' || i.cardboardsConsumed < 0) {
      throw new Error('cardboardsConsumed must be a non-negative number');
    }
    out.cardboardsConsumed = i.cardboardsConsumed;
  }
  if (i.bulletsConsumed !== undefined) {
    if (typeof i.bulletsConsumed !== 'number' || i.bulletsConsumed < 0) {
      throw new Error('bulletsConsumed must be a non-negative number');
    }
    out.bulletsConsumed = i.bulletsConsumed;
  }
  if (i.finalOpenBruceState !== undefined) {
    if (
      typeof i.finalOpenBruceState !== 'string' ||
      !BRUCE_STATES.includes(i.finalOpenBruceState as BruceState)
    ) {
      throw new Error('finalOpenBruceState must be FULL, MORE_THAN_HALF, LESS_THAN_HALF, or EMPTY');
    }
    out.finalOpenBruceState = i.finalOpenBruceState as BruceState;
  }
  if (i.itemSerials !== undefined) {
    if (!Array.isArray(i.itemSerials) || i.itemSerials.some((s) => typeof s !== 'string')) {
      throw new Error('itemSerials must be an array of strings');
    }
    out.itemSerials = i.itemSerials as string[];
  }
  if (i.quantityConsumed !== undefined) {
    if (typeof i.quantityConsumed !== 'number' || i.quantityConsumed < 0) {
      throw new Error('quantityConsumed must be a non-negative number');
    }
    out.quantityConsumed = i.quantityConsumed;
  }
  if (i.reportRequestId !== undefined) {
    if (typeof i.reportRequestId !== 'string') {
      throw new Error('reportRequestId must be a string');
    }
    out.reportRequestId = i.reportRequestId;
  }

  return out;
}

interface ResolvedRecipients {
  teamLeaderIds: string[];
  responsibleManagerId: string | null;
}

async function resolveRecipients(reporterUid: string): Promise<ResolvedRecipients> {
  const db = getAdminDb();

  const reporterSnap = await db.collection(COLLECTIONS.USERS).doc(reporterUid).get();
  const reporterTeamId = reporterSnap.exists
    ? ((reporterSnap.data()?.teamId as string) || null)
    : null;

  let teamLeaderIds: string[] = [];
  if (reporterTeamId) {
    const tlSnap = await db
      .collection(COLLECTIONS.USERS)
      .where('teamId', '==', reporterTeamId)
      .where('userType', '==', UserType.TEAM_LEADER)
      .get();
    teamLeaderIds = tlSnap.docs.map((d) => d.id).filter((uid) => uid !== reporterUid);
  }

  const cfgSnap = await db.collection(COLLECTIONS.SYSTEM_CONFIG).doc('main').get();
  const responsibleManagerId = cfgSnap.exists
    ? ((cfgSnap.data()?.ammoNotificationRecipientUserId as string) || null)
    : null;

  return { teamLeaderIds, responsibleManagerId };
}

export interface SubmitReportResult {
  reportId: string;
  notificationRecipientIds: string[];
}

export async function serverSubmitAmmunitionReport(
  input: SubmitReportInput
): Promise<SubmitReportResult> {
  const db = getAdminDb();

  const reporterUid = input.actor.uid;

  const reporterSnap = await db.collection(COLLECTIONS.USERS).doc(reporterUid).get();
  if (!reporterSnap.exists) throw new Error('Reporter user not found');
  const reporterData = reporterSnap.data()!;
  const reporterName =
    [reporterData.firstName, reporterData.lastName].filter(Boolean).join(' ').trim() ||
    input.actor.displayName ||
    reporterUid;
  const reporterTeamId = (reporterData.teamId as string) || '';

  const templateSnap = await db
    .collection(COLLECTIONS.AMMUNITION_TEMPLATES)
    .doc(input.templateId)
    .get();
  if (!templateSnap.exists) throw new Error('Template not found');
  const template = { id: templateSnap.id, ...templateSnap.data() } as AmmunitionType;
  const trackingMode: TrackingMode = template.trackingMode;

  const reportRef = db.collection(COLLECTIONS.AMMUNITION_REPORTS).doc();

  // Stock decrement target — for BRUCE/LOOSE_COUNT we use the reporter's USER doc.
  // (Phase 4 ships self-report only; team/holder picker for reporting comes later.)
  const stockDocId = `USER_${reporterUid}_${input.templateId}`;
  const stockRef = db.collection(COLLECTIONS.AMMUNITION_INVENTORY).doc(stockDocId);

  await db.runTransaction(async (tx) => {
    if (trackingMode === 'BRUCE' || trackingMode === 'LOOSE_COUNT') {
      const stockSnap = await tx.get(stockRef);
      if (!stockSnap.exists) {
        throw new Error('No inventory entry found for the reporter on this template');
      }
      const stock = stockSnap.data()!;
      if (trackingMode === 'BRUCE') {
        const cur = (stock.bruceCount as number | undefined) ?? 0;
        const consumed = input.brucesConsumed ?? 0;
        if (consumed > cur) throw new Error('brucesConsumed exceeds current bruceCount');
        const updates: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (consumed > 0) updates.bruceCount = cur - consumed;
        if (input.finalOpenBruceState) updates.openBruceState = input.finalOpenBruceState;
        tx.update(stockRef, updates);
      } else {
        const cur = (stock.quantity as number | undefined) ?? 0;
        const consumed = input.quantityConsumed ?? 0;
        if (consumed <= 0) throw new Error('quantityConsumed must be positive for LOOSE_COUNT');
        if (consumed > cur) throw new Error('quantityConsumed exceeds current quantity');
        const looseUpdates: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
          quantity: cur - consumed,
          updatedAt: FieldValue.serverTimestamp(),
        };
        tx.update(stockRef, looseUpdates);
      }
    } else {
      const serials = input.itemSerials || [];
      if (serials.length === 0) {
        throw new Error('itemSerials required for SERIAL templates');
      }
      const itemRefs = serials.map((s) => db.collection(COLLECTIONS.AMMUNITION).doc(s));
      const itemSnaps = await Promise.all(itemRefs.map((r) => tx.get(r)));
      itemSnaps.forEach((snap, idx) => {
        if (!snap.exists) throw new Error(`Serial ${serials[idx]} not found`);
        const item = snap.data()!;
        if (item.templateId !== input.templateId) {
          throw new Error(`Serial ${serials[idx]} does not match template`);
        }
        if (item.currentHolderId !== reporterUid) {
          throw new Error(`Serial ${serials[idx]} is not held by the reporter`);
        }
      });
      itemSnaps.forEach((snap) => {
        tx.update(snap.ref, { status: 'CONSUMED', updatedAt: FieldValue.serverTimestamp() });
      });
    }

    const reportData: Record<string, unknown> = {
      id: reportRef.id,
      reporterId: reporterUid,
      reporterName,
      teamId: reporterTeamId,
      templateId: template.id,
      templateName: template.name,
      trackingMode,
      reason: input.reason,
      usedAt: Timestamp.fromDate(new Date(input.usedAtMs)),
      createdAt: FieldValue.serverTimestamp(),
    };
    if (trackingMode === 'BRUCE') {
      if (input.brucesConsumed !== undefined) reportData.brucesConsumed = input.brucesConsumed;
      if (input.cardboardsConsumed !== undefined)
        reportData.cardboardsConsumed = input.cardboardsConsumed;
      if (input.bulletsConsumed !== undefined)
        reportData.bulletsConsumed = input.bulletsConsumed;
      if (input.finalOpenBruceState)
        reportData.finalOpenBruceState = input.finalOpenBruceState;
    } else if (trackingMode === 'LOOSE_COUNT') {
      if (input.quantityConsumed !== undefined)
        reportData.quantityConsumed = input.quantityConsumed;
    } else {
      reportData.itemSerials = input.itemSerials || [];
    }
    if (input.reportRequestId) reportData.reportRequestId = input.reportRequestId;

    tx.set(reportRef, reportData);
  });

  const recipients = await resolveRecipients(reporterUid);
  const recipientIds = Array.from(
    new Set([...recipients.teamLeaderIds, ...(recipients.responsibleManagerId ? [recipients.responsibleManagerId] : [])])
  ).filter((uid) => uid !== reporterUid);

  // Side effects — failures here do not roll back the report.
  try {
    await serverCreateActionLog({
      actionType: 'AMMO_REPORT_SUBMITTED',
      equipmentId: '',
      equipmentDocId: reportRef.id,
      equipmentName: `ammo-report:${template.name}`,
      actorId: reporterUid,
      actorName: reporterName,
      ...(input.reason ? { note: input.reason } : {}),
    });
  } catch (e) {
    console.error('[Server] action log for ammo report failed:', e);
  }

  if (input.reportRequestId) {
    try {
      await serverPatchFulfillment(input.reportRequestId, reporterUid, reportRef.id);
    } catch (e) {
      console.error('[Server] patching ammo report-request fulfillment failed:', e);
    }
  }

  if (recipientIds.length > 0) {
    try {
      await serverCreateBatchNotifications(
        recipientIds.map((uid) => ({
          userId: uid,
          type: 'ammo_report_submitted',
          title: 'דיווח תחמושת חדש',
          message: `${reporterName} דיווח על שימוש ב${template.name}`,
          relatedEquipmentDocId: reportRef.id,
          equipmentName: template.name,
        }))
      );
    } catch (e) {
      console.error('[Server] notification fan-out for ammo report failed:', e);
    }
  }

  return {
    reportId: reportRef.id,
    notificationRecipientIds: recipientIds,
  };
}

export interface ListReportsFilters {
  fromMs?: number;
  toMs?: number;
  teamId?: string;
  reporterId?: string;
  templateId?: string;
  limit?: number;
}

export async function serverListAmmunitionReports(
  filters: ListReportsFilters = {}
): Promise<AmmunitionReport[]> {
  const db = getAdminDb();
  let q: FirebaseFirestore.Query = db.collection(COLLECTIONS.AMMUNITION_REPORTS);
  if (filters.teamId) q = q.where('teamId', '==', filters.teamId);
  if (filters.reporterId) q = q.where('reporterId', '==', filters.reporterId);
  if (filters.templateId) q = q.where('templateId', '==', filters.templateId);
  if (filters.fromMs !== undefined) {
    q = q.where('usedAt', '>=', Timestamp.fromDate(new Date(filters.fromMs)));
  }
  if (filters.toMs !== undefined) {
    q = q.where('usedAt', '<=', Timestamp.fromDate(new Date(filters.toMs)));
  }
  q = q.orderBy('usedAt', 'desc');
  if (filters.limit) q = q.limit(filters.limit);
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionReport);
}
