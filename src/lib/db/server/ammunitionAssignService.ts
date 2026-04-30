/**
 * Server-side assign-from-central + return-to-central transactions
 * (Phase 9 — see docs/spec/ammunition-central-stock.md).
 *
 * The central stock pool lives at `ammunitionInventory/UNIT_main_${templateId}`
 * for BRUCE/BELT/LOOSE_COUNT, and at `ammunition/${serial}` with
 * currentHolderType='UNIT' currentHolderId='main' for SERIAL items.
 *
 * Assign / return are single Firestore transactions. Action log + recipient
 * notifications fire post-txn (idempotent enough for retries — at-most-once
 * is fine).
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  AmmunitionItem,
  AmmunitionType,
  HolderType,
} from '@/types/ammunition';
import { ActionType } from '@/types/equipment';
import { NotificationType } from '@/types/notifications';
import { UserType } from '@/types/user';
import type { ApiActor } from './policyHelpers';
import { canMutateAmmunitionInventory } from './ammunitionInventoryService';
import { serverCreateActionLog } from './actionsLogService';
import { serverCreateBatchNotifications } from './notificationService';

const UNIT_HOLDER_ID = 'main';

function inventoryDocId(templateId: string, holderType: HolderType, holderId: string): string {
  return `${holderType}_${holderId}_${templateId}`;
}

async function getTemplate(templateId: string): Promise<AmmunitionType | null> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.AMMUNITION_TEMPLATES).doc(templateId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as AmmunitionType;
}

async function actorDisplayName(uid: string): Promise<string> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  if (!snap.exists) return uid;
  const d = snap.data()!;
  const full = (d.fullName as string)?.trim();
  if (full) return full;
  const fl = `${(d.firstName as string) ?? ''} ${(d.lastName as string) ?? ''}`.trim();
  return fl || uid;
}

async function teamLeaderUids(teamId: string): Promise<string[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.USERS)
    .where('teamId', '==', teamId)
    .where('userType', '==', UserType.TEAM_LEADER)
    .get();
  return snap.docs.map((d) => d.id);
}

async function fanoutAssignNotification(
  template: AmmunitionType,
  target: { holderType: 'USER' | 'TEAM'; holderId: string },
  qtyLabel: string,
  actorUid: string
): Promise<void> {
  const recipients =
    target.holderType === 'USER'
      ? [target.holderId]
      : await teamLeaderUids(target.holderId);
  // Don't ping the actor themselves if they happen to be a TL on the team.
  const filtered = Array.from(new Set(recipients)).filter((u) => u !== actorUid);
  if (filtered.length === 0) return;
  await serverCreateBatchNotifications(
    filtered.map((userId) => ({
      userId,
      type: NotificationType.AMMO_ASSIGNED_FROM_CENTRAL,
      title: 'הוקצתה לך תחמושת',
      message: `${template.name} · ${qtyLabel}`,
      relatedEquipmentDocId: template.id,
      equipmentName: template.name,
    }))
  );
}

// ─── ASSIGN FROM CENTRAL ───────────────────────────────────────────────────

export interface AssignFromCentralInput {
  actor: ApiActor;
  templateId: string;
  target: { holderType: 'USER' | 'TEAM'; holderId: string };
  /** BRUCE/BELT */
  bruceCount?: number;
  /** LOOSE_COUNT */
  quantity?: number;
  /** SERIAL — array of serials to flip in one txn. */
  serials?: string[];
  note?: string;
}

export function validateAssignFromCentralInput(input: unknown): AssignFromCentralInput {
  if (!input || typeof input !== 'object') throw new Error('input is required');
  const i = input as Record<string, unknown>;
  if (typeof i.templateId !== 'string' || !i.templateId) throw new Error('templateId is required');
  const target = i.target as { holderType?: unknown; holderId?: unknown } | undefined;
  if (!target || (target.holderType !== 'USER' && target.holderType !== 'TEAM')) {
    throw new Error('target.holderType must be USER or TEAM');
  }
  if (typeof target.holderId !== 'string' || !target.holderId) {
    throw new Error('target.holderId is required');
  }
  const out: AssignFromCentralInput = {
    actor: i.actor as ApiActor,
    templateId: i.templateId,
    target: { holderType: target.holderType, holderId: target.holderId },
  };
  if (i.bruceCount !== undefined) {
    if (typeof i.bruceCount !== 'number' || i.bruceCount <= 0) {
      throw new Error('bruceCount must be a positive number');
    }
    out.bruceCount = i.bruceCount;
  }
  if (i.quantity !== undefined) {
    if (typeof i.quantity !== 'number' || i.quantity <= 0) {
      throw new Error('quantity must be a positive number');
    }
    out.quantity = i.quantity;
  }
  if (i.serials !== undefined) {
    if (!Array.isArray(i.serials) || i.serials.some((s) => typeof s !== 'string' || !s)) {
      throw new Error('serials must be an array of non-empty strings');
    }
    out.serials = i.serials as string[];
  }
  if (typeof i.note === 'string' && i.note.trim()) out.note = i.note.trim();
  return out;
}

export async function serverAssignFromCentral(
  input: AssignFromCentralInput
): Promise<{ ok: true }> {
  const template = await getTemplate(input.templateId);
  if (!template) throw new Error('Template not found');

  // Permission: actor must be allowed to mutate UNIT (admin/sys-mgr/manager
  // or the responsible-mgr). Target side is implicitly granted because the
  // assign is initiated by the warehouse keeper, not the recipient.
  const allowed = await canMutateAmmunitionInventory({
    actor: input.actor,
    template,
    holderType: 'UNIT',
    holderId: UNIT_HOLDER_ID,
  });
  if (!allowed) throw new Error('Forbidden');

  const db = getAdminDb();
  const targetHolderType = input.target.holderType as HolderType;
  let qtyLabel = '';

  if (template.trackingMode === 'SERIAL') {
    const serials = input.serials || [];
    if (serials.length === 0) throw new Error('serials required for SERIAL templates');
    await db.runTransaction(async (tx) => {
      const refs = serials.map((s) => db.collection(COLLECTIONS.AMMUNITION).doc(s));
      const snaps = await Promise.all(refs.map((r) => tx.get(r)));
      snaps.forEach((snap, i) => {
        if (!snap.exists) throw new Error(`Serial ${serials[i]} not found`);
        const item = snap.data() as AmmunitionItem;
        if (item.templateId !== template.id) {
          throw new Error(`Serial ${serials[i]} does not match template`);
        }
        if (item.currentHolderType !== 'UNIT' || item.currentHolderId !== UNIT_HOLDER_ID) {
          throw new Error(`Serial ${serials[i]} is not in central pool`);
        }
        if (item.status !== 'AVAILABLE') {
          throw new Error(`Serial ${serials[i]} status is ${item.status}, expected AVAILABLE`);
        }
      });
      snaps.forEach((snap) => {
        tx.update(snap.ref, {
          currentHolderType: targetHolderType,
          currentHolderId: input.target.holderId,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    });
    qtyLabel = `${serials.length} פריטים סריאליים`;
  } else if (template.trackingMode === 'BRUCE' || template.trackingMode === 'BELT') {
    const n = input.bruceCount ?? 0;
    if (n <= 0) throw new Error('bruceCount required for BRUCE/BELT templates');
    await db.runTransaction(async (tx) => {
      const unitRef = db
        .collection(COLLECTIONS.AMMUNITION_INVENTORY)
        .doc(inventoryDocId(template.id, 'UNIT', UNIT_HOLDER_ID));
      const targetRef = db
        .collection(COLLECTIONS.AMMUNITION_INVENTORY)
        .doc(inventoryDocId(template.id, targetHolderType, input.target.holderId));
      const [unitSnap, targetSnap] = await Promise.all([tx.get(unitRef), tx.get(targetRef)]);
      if (!unitSnap.exists) throw new Error('Central pool has no entry for this template');
      const unitData = unitSnap.data()!;
      const have = (unitData.bruceCount as number | undefined) ?? 0;
      if (have < n) throw new Error(`Insufficient central stock (have ${have}, need ${n})`);
      tx.update(unitRef, {
        bruceCount: have - n,
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (targetSnap.exists) {
        const cur = (targetSnap.data()!.bruceCount as number | undefined) ?? 0;
        tx.update(targetRef, {
          bruceCount: cur + n,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        tx.set(targetRef, {
          templateId: template.id,
          trackingMode: template.trackingMode,
          holderType: targetHolderType,
          holderId: input.target.holderId,
          bruceCount: n,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: input.actor.uid,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    qtyLabel = `${n} ברוסים`;
  } else if (template.trackingMode === 'LOOSE_COUNT') {
    const n = input.quantity ?? 0;
    if (n <= 0) throw new Error('quantity required for LOOSE_COUNT templates');
    await db.runTransaction(async (tx) => {
      const unitRef = db
        .collection(COLLECTIONS.AMMUNITION_INVENTORY)
        .doc(inventoryDocId(template.id, 'UNIT', UNIT_HOLDER_ID));
      const targetRef = db
        .collection(COLLECTIONS.AMMUNITION_INVENTORY)
        .doc(inventoryDocId(template.id, targetHolderType, input.target.holderId));
      const [unitSnap, targetSnap] = await Promise.all([tx.get(unitRef), tx.get(targetRef)]);
      if (!unitSnap.exists) throw new Error('Central pool has no entry for this template');
      const have = (unitSnap.data()!.quantity as number | undefined) ?? 0;
      if (have < n) throw new Error(`Insufficient central stock (have ${have}, need ${n})`);
      tx.update(unitRef, {
        quantity: have - n,
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (targetSnap.exists) {
        const cur = (targetSnap.data()!.quantity as number | undefined) ?? 0;
        tx.update(targetRef, {
          quantity: cur + n,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        tx.set(targetRef, {
          templateId: template.id,
          trackingMode: template.trackingMode,
          holderType: targetHolderType,
          holderId: input.target.holderId,
          quantity: n,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: input.actor.uid,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    qtyLabel = `${n} יח׳`;
  } else {
    throw new Error(`Unsupported tracking mode: ${template.trackingMode}`);
  }

  const actorName = await actorDisplayName(input.actor.uid);
  await serverCreateActionLog({
    actionType: ActionType.AMMO_ASSIGNED_FROM_CENTRAL,
    equipmentId: template.id,
    equipmentDocId: template.id,
    equipmentName: template.name,
    actorId: input.actor.uid,
    actorName,
    targetId: input.target.holderId,
    targetName: input.target.holderId,
    ...(input.note ? { note: `${qtyLabel} · ${input.note}` } : { note: qtyLabel }),
  });

  await fanoutAssignNotification(template, input.target, qtyLabel, input.actor.uid);

  return { ok: true };
}

// ─── RETURN TO CENTRAL ─────────────────────────────────────────────────────

export interface ReturnToCentralInput {
  actor: ApiActor;
  templateId: string;
  source: { holderType: 'USER' | 'TEAM'; holderId: string };
  bruceCount?: number;
  quantity?: number;
  serials?: string[];
  note?: string;
}

export function validateReturnToCentralInput(input: unknown): ReturnToCentralInput {
  if (!input || typeof input !== 'object') throw new Error('input is required');
  const i = input as Record<string, unknown>;
  if (typeof i.templateId !== 'string' || !i.templateId) throw new Error('templateId is required');
  const source = i.source as { holderType?: unknown; holderId?: unknown } | undefined;
  if (!source || (source.holderType !== 'USER' && source.holderType !== 'TEAM')) {
    throw new Error('source.holderType must be USER or TEAM');
  }
  if (typeof source.holderId !== 'string' || !source.holderId) {
    throw new Error('source.holderId is required');
  }
  const out: ReturnToCentralInput = {
    actor: i.actor as ApiActor,
    templateId: i.templateId,
    source: { holderType: source.holderType, holderId: source.holderId },
  };
  if (i.bruceCount !== undefined) {
    if (typeof i.bruceCount !== 'number' || i.bruceCount <= 0) {
      throw new Error('bruceCount must be a positive number');
    }
    out.bruceCount = i.bruceCount;
  }
  if (i.quantity !== undefined) {
    if (typeof i.quantity !== 'number' || i.quantity <= 0) {
      throw new Error('quantity must be a positive number');
    }
    out.quantity = i.quantity;
  }
  if (i.serials !== undefined) {
    if (!Array.isArray(i.serials) || i.serials.some((s) => typeof s !== 'string' || !s)) {
      throw new Error('serials must be an array of non-empty strings');
    }
    out.serials = i.serials as string[];
  }
  if (typeof i.note === 'string' && i.note.trim()) out.note = i.note.trim();
  return out;
}

export async function serverReturnToCentral(
  input: ReturnToCentralInput
): Promise<{ ok: true }> {
  const template = await getTemplate(input.templateId);
  if (!template) throw new Error('Template not found');

  // Same permission gate as assign — UNIT mutation requires admin/manager.
  // The source holder isn't asked; the warehouse keeper reclaims the stock.
  const allowed = await canMutateAmmunitionInventory({
    actor: input.actor,
    template,
    holderType: 'UNIT',
    holderId: UNIT_HOLDER_ID,
  });
  if (!allowed) throw new Error('Forbidden');

  const db = getAdminDb();
  const sourceHolderType = input.source.holderType as HolderType;
  let qtyLabel = '';

  if (template.trackingMode === 'SERIAL') {
    const serials = input.serials || [];
    if (serials.length === 0) throw new Error('serials required for SERIAL templates');
    await db.runTransaction(async (tx) => {
      const refs = serials.map((s) => db.collection(COLLECTIONS.AMMUNITION).doc(s));
      const snaps = await Promise.all(refs.map((r) => tx.get(r)));
      snaps.forEach((snap, i) => {
        if (!snap.exists) throw new Error(`Serial ${serials[i]} not found`);
        const item = snap.data() as AmmunitionItem;
        if (item.templateId !== template.id) {
          throw new Error(`Serial ${serials[i]} does not match template`);
        }
        if (
          item.currentHolderType !== sourceHolderType ||
          item.currentHolderId !== input.source.holderId
        ) {
          throw new Error(`Serial ${serials[i]} is not held by the declared source`);
        }
        if (item.status !== 'AVAILABLE') {
          throw new Error(`Serial ${serials[i]} status is ${item.status}, expected AVAILABLE`);
        }
      });
      snaps.forEach((snap) => {
        tx.update(snap.ref, {
          currentHolderType: 'UNIT',
          currentHolderId: UNIT_HOLDER_ID,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    });
    qtyLabel = `${serials.length} פריטים סריאליים`;
  } else if (template.trackingMode === 'BRUCE' || template.trackingMode === 'BELT') {
    const n = input.bruceCount ?? 0;
    if (n <= 0) throw new Error('bruceCount required for BRUCE/BELT templates');
    await db.runTransaction(async (tx) => {
      const sourceRef = db
        .collection(COLLECTIONS.AMMUNITION_INVENTORY)
        .doc(inventoryDocId(template.id, sourceHolderType, input.source.holderId));
      const unitRef = db
        .collection(COLLECTIONS.AMMUNITION_INVENTORY)
        .doc(inventoryDocId(template.id, 'UNIT', UNIT_HOLDER_ID));
      const [sourceSnap, unitSnap] = await Promise.all([tx.get(sourceRef), tx.get(unitRef)]);
      if (!sourceSnap.exists) throw new Error('Source holder has no stock for this template');
      const have = (sourceSnap.data()!.bruceCount as number | undefined) ?? 0;
      if (have < n) throw new Error(`Source has only ${have} ברוסים, cannot return ${n}`);
      tx.update(sourceRef, {
        bruceCount: have - n,
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (unitSnap.exists) {
        const cur = (unitSnap.data()!.bruceCount as number | undefined) ?? 0;
        tx.update(unitRef, {
          bruceCount: cur + n,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        tx.set(unitRef, {
          templateId: template.id,
          trackingMode: template.trackingMode,
          holderType: 'UNIT',
          holderId: UNIT_HOLDER_ID,
          bruceCount: n,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: input.actor.uid,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    qtyLabel = `${n} ברוסים`;
  } else if (template.trackingMode === 'LOOSE_COUNT') {
    const n = input.quantity ?? 0;
    if (n <= 0) throw new Error('quantity required for LOOSE_COUNT templates');
    await db.runTransaction(async (tx) => {
      const sourceRef = db
        .collection(COLLECTIONS.AMMUNITION_INVENTORY)
        .doc(inventoryDocId(template.id, sourceHolderType, input.source.holderId));
      const unitRef = db
        .collection(COLLECTIONS.AMMUNITION_INVENTORY)
        .doc(inventoryDocId(template.id, 'UNIT', UNIT_HOLDER_ID));
      const [sourceSnap, unitSnap] = await Promise.all([tx.get(sourceRef), tx.get(unitRef)]);
      if (!sourceSnap.exists) throw new Error('Source holder has no stock for this template');
      const have = (sourceSnap.data()!.quantity as number | undefined) ?? 0;
      if (have < n) throw new Error(`Source has only ${have} יח׳, cannot return ${n}`);
      tx.update(sourceRef, {
        quantity: have - n,
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (unitSnap.exists) {
        const cur = (unitSnap.data()!.quantity as number | undefined) ?? 0;
        tx.update(unitRef, {
          quantity: cur + n,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        tx.set(unitRef, {
          templateId: template.id,
          trackingMode: template.trackingMode,
          holderType: 'UNIT',
          holderId: UNIT_HOLDER_ID,
          quantity: n,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: input.actor.uid,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    qtyLabel = `${n} יח׳`;
  } else {
    throw new Error(`Unsupported tracking mode: ${template.trackingMode}`);
  }

  const actorName = await actorDisplayName(input.actor.uid);
  await serverCreateActionLog({
    actionType: ActionType.AMMO_RETURNED_TO_CENTRAL,
    equipmentId: template.id,
    equipmentDocId: template.id,
    equipmentName: template.name,
    actorId: input.actor.uid,
    actorName,
    targetId: input.source.holderId,
    targetName: input.source.holderId,
    ...(input.note ? { note: `${qtyLabel} · ${input.note}` } : { note: qtyLabel }),
  });

  return { ok: true };
}

// ─── BULK CSV LOAD INTO CENTRAL ────────────────────────────────────────────

export interface BulkLoadCentralRow {
  templateName?: unknown;
  bruceCount?: unknown;
  quantity?: unknown;
}

export interface BulkLoadCentralResult {
  loaded: number;
  errors: Array<{ index: number; error: string }>;
}

/**
 * Bulk-load central pool from CSV rows. One row per template; the column
 * used (`bruceCount` for BRUCE/BELT, `quantity` for LOOSE_COUNT) is decided
 * by the resolved template's tracking mode. SERIAL items are intentionally
 * out of scope — they're per-serial and don't fit a "fill the warehouse"
 * spreadsheet.
 *
 * Atomic per-row: each successful row is upserted (added on top of existing
 * UNIT balance). Errors block the whole batch, mirroring the template
 * bulk-import contract.
 */
export async function serverBulkLoadCentralStock(
  rows: BulkLoadCentralRow[],
  actor: ApiActor
): Promise<BulkLoadCentralResult> {
  const errors: Array<{ index: number; error: string }> = [];

  // Resolve template names → templates up front.
  const db = getAdminDb();
  const templatesSnap = await db.collection(COLLECTIONS.AMMUNITION_TEMPLATES).get();
  const byName = new Map<string, AmmunitionType>();
  templatesSnap.docs.forEach((d) => {
    const data = { id: d.id, ...d.data() } as AmmunitionType;
    byName.set(data.name, data);
  });

  type ValidRow = {
    template: AmmunitionType;
    bruceCount?: number;
    quantity?: number;
  };
  const validated: ValidRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      const name = typeof r.templateName === 'string' ? r.templateName.trim() : '';
      if (!name) throw new Error('templateName is required');
      const template = byName.get(name);
      if (!template) throw new Error(`Template "${name}" not found`);
      if (template.trackingMode === 'SERIAL') {
        throw new Error(`Template "${name}" is SERIAL — bulk load not supported for serials`);
      }
      if (template.trackingMode === 'BRUCE' || template.trackingMode === 'BELT') {
        const n =
          typeof r.bruceCount === 'string' ? Number(r.bruceCount) : (r.bruceCount as number);
        if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) {
          throw new Error(`bruceCount must be a positive number for "${name}"`);
        }
        validated.push({ template, bruceCount: n });
      } else if (template.trackingMode === 'LOOSE_COUNT') {
        const n =
          typeof r.quantity === 'string' ? Number(r.quantity) : (r.quantity as number);
        if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) {
          throw new Error(`quantity must be a positive number for "${name}"`);
        }
        validated.push({ template, quantity: n });
      }
    } catch (e) {
      errors.push({ index: i, error: e instanceof Error ? e.message : String(e) });
    }
  }
  if (errors.length > 0) return { loaded: 0, errors };

  const batch = db.batch();
  const col = db.collection(COLLECTIONS.AMMUNITION_INVENTORY);
  // Note: not transactional across rows — each UNIT doc is independent. We use
  // a batch write for atomicity. To support "add to existing balance" we read
  // the current docs first.
  const existingSnaps = await Promise.all(
    validated.map((v) => col.doc(inventoryDocId(v.template.id, 'UNIT', UNIT_HOLDER_ID)).get())
  );
  for (let i = 0; i < validated.length; i++) {
    const v = validated[i];
    const ref = col.doc(inventoryDocId(v.template.id, 'UNIT', UNIT_HOLDER_ID));
    const existing = existingSnaps[i];
    if (existing.exists) {
      const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (v.bruceCount !== undefined) {
        const cur = (existing.data()!.bruceCount as number | undefined) ?? 0;
        update.bruceCount = cur + v.bruceCount;
      }
      if (v.quantity !== undefined) {
        const cur = (existing.data()!.quantity as number | undefined) ?? 0;
        update.quantity = cur + v.quantity;
      }
      batch.update(ref, update);
    } else {
      const data: Record<string, unknown> = {
        templateId: v.template.id,
        trackingMode: v.template.trackingMode,
        holderType: 'UNIT',
        holderId: UNIT_HOLDER_ID,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: actor.uid,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (v.bruceCount !== undefined) data.bruceCount = v.bruceCount;
      if (v.quantity !== undefined) data.quantity = v.quantity;
      batch.set(ref, data);
    }
  }
  await batch.commit();

  const actorName = await actorDisplayName(actor.uid);
  await serverCreateActionLog({
    actionType: ActionType.AMMO_CENTRAL_BULK_LOAD,
    equipmentId: '',
    equipmentDocId: '',
    equipmentName: '',
    actorId: actor.uid,
    actorName,
    note: `bulk loaded ${validated.length} templates into central pool`,
  });

  return { loaded: validated.length, errors: [] };
}
