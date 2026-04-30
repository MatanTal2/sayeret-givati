/**
 * Server-side Ammunition Inventory Service (firebase-admin).
 *
 * Backs two collections:
 *   - `ammunitionInventory` — BRUCE + LOOSE_COUNT stock per (template, holder).
 *     Doc id is deterministic: `${holderType}_${holderId}_${templateId}`.
 *   - `ammunition` — SERIAL items. Doc id is the serial number (צ).
 *
 * Permission model (enforced here, not by callers):
 *   - ADMIN / SYSTEM_MANAGER / MANAGER → any holder.
 *   - admin-configured `ammoNotificationRecipientUserId` → any holder.
 *   - TEAM_LEADER → own team + members of own team.
 *   - USER → self only, USER-allocated templates only.
 *   - Update / delete: actor's own writes only, manager+ overrides.
 *
 * Phase 3 — see docs/spec/ammunition-feature.md.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  AmmunitionItem,
  AmmunitionItemStatus,
  AmmunitionStock,
  AmmunitionType,
  BruceState,
  HolderType,
} from '@/types/ammunition';
import type { ApiActor } from './policyHelpers';
import { UserType } from '@/types/user';

const BRUCE_STATES: BruceState[] = ['FULL', 'MORE_THAN_HALF', 'LESS_THAN_HALF', 'EMPTY'];
const ITEM_STATUSES: AmmunitionItemStatus[] = ['AVAILABLE', 'CONSUMED', 'LOST', 'DAMAGED', 'RETURNED'];

function isManagerOrAbove(userType: UserType): boolean {
  return (
    userType === UserType.ADMIN ||
    userType === UserType.SYSTEM_MANAGER ||
    userType === UserType.MANAGER
  );
}

async function getResponsibleManagerId(): Promise<string | null> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.SYSTEM_CONFIG).doc('main').get();
  if (!snap.exists) return null;
  return (snap.data()?.ammoNotificationRecipientUserId as string) || null;
}

async function userTeamId(uid: string): Promise<string | undefined> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  if (!snap.exists) return undefined;
  return (snap.data()?.teamId as string) || undefined;
}

async function getTemplate(templateId: string): Promise<AmmunitionType | null> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.AMMUNITION_TEMPLATES).doc(templateId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as AmmunitionType;
}

export interface MutationContext {
  actor: ApiActor;
  template: AmmunitionType;
  holderType: HolderType;
  holderId: string;
}

export async function canMutateAmmunitionInventory(ctx: MutationContext): Promise<boolean> {
  const { actor, template, holderType, holderId } = ctx;

  // UNIT (central pool) is admin/manager + responsible-mgr only. TL and USER
  // never write to the warehouse — they receive via assignFromCentral.
  if (holderType === 'UNIT') {
    if (isManagerOrAbove(actor.userType)) return true;
    const responsibleId = await getResponsibleManagerId();
    return !!responsibleId && responsibleId === actor.uid;
  }

  if (isManagerOrAbove(actor.userType)) return true;

  const responsibleId = await getResponsibleManagerId();
  if (responsibleId && responsibleId === actor.uid) return true;

  if (actor.userType === UserType.TEAM_LEADER) {
    if (!actor.teamId) return false;
    if (holderType === 'TEAM') return holderId === actor.teamId;
    const holderTeam = await userTeamId(holderId);
    return !!holderTeam && holderTeam === actor.teamId;
  }

  if (actor.userType === UserType.USER) {
    if (holderType !== 'USER') return false;
    if (holderId !== actor.uid) return false;
    return template.allocation === 'USER' || template.allocation === 'BOTH';
  }

  return false;
}

function inventoryDocId(templateId: string, holderType: HolderType, holderId: string): string {
  return `${holderType}_${holderId}_${templateId}`;
}

// ─── BRUCE / LOOSE_COUNT inventory ─────────────────────────────────────────

export interface UpsertStockInput {
  actor: ApiActor;
  templateId: string;
  holderType: HolderType;
  holderId: string;
  bruceCount?: number;
  openBruceState?: BruceState;
  quantity?: number;
}

export function validateUpsertStockInput(input: unknown): UpsertStockInput {
  if (!input || typeof input !== 'object') throw new Error('input is required');
  const i = input as Record<string, unknown>;
  if (typeof i.templateId !== 'string' || !i.templateId) throw new Error('templateId is required');
  if (i.holderType !== 'USER' && i.holderType !== 'TEAM' && i.holderType !== 'UNIT') {
    throw new Error('holderType must be USER, TEAM, or UNIT');
  }
  if (typeof i.holderId !== 'string' || !i.holderId) throw new Error('holderId is required');
  if (i.holderType === 'UNIT' && i.holderId !== 'main') {
    throw new Error('UNIT holderId must be "main"');
  }

  const out: UpsertStockInput = {
    actor: i.actor as ApiActor,
    templateId: i.templateId,
    holderType: i.holderType as HolderType,
    holderId: i.holderId,
  };
  if (i.bruceCount !== undefined) {
    if (typeof i.bruceCount !== 'number' || i.bruceCount < 0) {
      throw new Error('bruceCount must be a non-negative number');
    }
    out.bruceCount = i.bruceCount;
  }
  if (i.openBruceState !== undefined) {
    if (typeof i.openBruceState !== 'string' || !BRUCE_STATES.includes(i.openBruceState as BruceState)) {
      throw new Error('openBruceState must be FULL, MORE_THAN_HALF, LESS_THAN_HALF, or EMPTY');
    }
    out.openBruceState = i.openBruceState as BruceState;
  }
  if (i.quantity !== undefined) {
    if (typeof i.quantity !== 'number' || i.quantity < 0) {
      throw new Error('quantity must be a non-negative number');
    }
    out.quantity = i.quantity;
  }
  return out;
}

export async function serverUpsertAmmunitionStock(
  input: UpsertStockInput
): Promise<{ id: string; created: boolean }> {
  const template = await getTemplate(input.templateId);
  if (!template) throw new Error('Template not found');
  if (template.trackingMode === 'SERIAL') {
    throw new Error('SERIAL templates are tracked per-item, not as stock');
  }

  const allowed = await canMutateAmmunitionInventory({
    actor: input.actor,
    template,
    holderType: input.holderType,
    holderId: input.holderId,
  });
  if (!allowed) throw new Error('Forbidden');

  const db = getAdminDb();
  const docId = inventoryDocId(input.templateId, input.holderType, input.holderId);
  const ref = db.collection(COLLECTIONS.AMMUNITION_INVENTORY).doc(docId);
  const existing = await ref.get();

  const data: Record<string, unknown> = {
    templateId: input.templateId,
    trackingMode: template.trackingMode,
    holderType: input.holderType,
    holderId: input.holderId,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (template.trackingMode === 'BRUCE' || template.trackingMode === 'BELT') {
    if (input.bruceCount !== undefined) data.bruceCount = input.bruceCount;
    if (input.openBruceState !== undefined) data.openBruceState = input.openBruceState;
  } else {
    if (input.quantity !== undefined) data.quantity = input.quantity;
  }

  if (!existing.exists) {
    data.createdAt = FieldValue.serverTimestamp();
    data.createdBy = input.actor.uid;
    await ref.set(data);
    return { id: docId, created: true };
  }

  const existingCreatedBy = existing.data()?.createdBy as string | undefined;
  if (
    !isManagerOrAbove(input.actor.userType) &&
    existingCreatedBy &&
    existingCreatedBy !== input.actor.uid
  ) {
    const responsibleId = await getResponsibleManagerId();
    if (responsibleId !== input.actor.uid) {
      throw new Error('Forbidden: cannot modify another user\'s inventory entry');
    }
  }

  await ref.set(data, { merge: true });
  return { id: docId, created: false };
}

export interface DeleteStockInput {
  actor: ApiActor;
  inventoryDocId: string;
}

export async function serverDeleteAmmunitionStock(input: DeleteStockInput): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.AMMUNITION_INVENTORY).doc(input.inventoryDocId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const data = snap.data() as AmmunitionStock;

  const template = await getTemplate(data.templateId);
  if (!template) throw new Error('Template not found');

  const allowed = await canMutateAmmunitionInventory({
    actor: input.actor,
    template,
    holderType: data.holderType,
    holderId: data.holderId,
  });
  if (!allowed) throw new Error('Forbidden');

  const createdBy = (snap.data()?.createdBy as string | undefined) || undefined;
  if (
    !isManagerOrAbove(input.actor.userType) &&
    createdBy &&
    createdBy !== input.actor.uid
  ) {
    const responsibleId = await getResponsibleManagerId();
    if (responsibleId !== input.actor.uid) {
      throw new Error('Forbidden: cannot delete another user\'s inventory entry');
    }
  }

  await ref.delete();
}

export async function serverListAmmunitionStock(): Promise<AmmunitionStock[]> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.AMMUNITION_INVENTORY).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionStock);
}

// ─── SERIAL items ──────────────────────────────────────────────────────────

export interface CreateSerialItemInput {
  actor: ApiActor;
  serial: string;
  templateId: string;
  holderType: HolderType;
  holderId: string;
}

export function validateCreateSerialItemInput(input: unknown): CreateSerialItemInput {
  if (!input || typeof input !== 'object') throw new Error('input is required');
  const i = input as Record<string, unknown>;
  if (typeof i.serial !== 'string' || !i.serial.trim()) throw new Error('serial is required');
  if (typeof i.templateId !== 'string' || !i.templateId) throw new Error('templateId is required');
  if (i.holderType !== 'USER' && i.holderType !== 'TEAM') {
    throw new Error('holderType must be USER or TEAM');
  }
  if (typeof i.holderId !== 'string' || !i.holderId) throw new Error('holderId is required');
  return {
    actor: i.actor as ApiActor,
    serial: i.serial.trim(),
    templateId: i.templateId,
    holderType: i.holderType as HolderType,
    holderId: i.holderId,
  };
}

export async function serverCreateSerialItem(
  input: CreateSerialItemInput
): Promise<{ id: string }> {
  const template = await getTemplate(input.templateId);
  if (!template) throw new Error('Template not found');
  if (template.trackingMode !== 'SERIAL') {
    throw new Error('Template is not SERIAL-tracked');
  }

  const allowed = await canMutateAmmunitionInventory({
    actor: input.actor,
    template,
    holderType: input.holderType,
    holderId: input.holderId,
  });
  if (!allowed) throw new Error('Forbidden');

  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.AMMUNITION).doc(input.serial);
  const existing = await ref.get();
  if (existing.exists) throw new Error('Serial number already exists');

  const data: Record<string, unknown> = {
    id: input.serial,
    templateId: input.templateId,
    currentHolderType: input.holderType,
    currentHolderId: input.holderId,
    status: 'AVAILABLE',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: input.actor.uid,
  };
  await ref.set(data);
  return { id: input.serial };
}

export interface UpdateSerialItemInput {
  actor: ApiActor;
  serial: string;
  newHolderType?: HolderType;
  newHolderId?: string;
  newStatus?: AmmunitionItemStatus;
}

export async function serverUpdateSerialItem(input: UpdateSerialItemInput): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.AMMUNITION).doc(input.serial);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Serial item not found');
  const item = snap.data() as AmmunitionItem;

  const template = await getTemplate(item.templateId);
  if (!template) throw new Error('Template not found');

  const allowed = await canMutateAmmunitionInventory({
    actor: input.actor,
    template,
    holderType: item.currentHolderType,
    holderId: item.currentHolderId,
  });
  if (!allowed) throw new Error('Forbidden');

  if (input.newStatus && !ITEM_STATUSES.includes(input.newStatus)) {
    throw new Error('newStatus is invalid');
  }

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (input.newHolderType) updates.currentHolderType = input.newHolderType;
  if (input.newHolderId) updates.currentHolderId = input.newHolderId;
  if (input.newStatus) updates.status = input.newStatus;

  if (input.newHolderType || input.newHolderId) {
    const allowedNew = await canMutateAmmunitionInventory({
      actor: input.actor,
      template,
      holderType: input.newHolderType || item.currentHolderType,
      holderId: input.newHolderId || item.currentHolderId,
    });
    if (!allowedNew) throw new Error('Forbidden: cannot transfer to that holder');
  }

  await ref.update(updates);
}

export async function serverReturnSerialItemToMgr(
  actor: ApiActor,
  serial: string
): Promise<{ ammoMgrId: string }> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.AMMUNITION).doc(serial);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Serial item not found');
  const item = snap.data() as AmmunitionItem;

  if (item.status !== 'CONSUMED') {
    throw new Error('Only CONSUMED items can be returned to the ammo manager');
  }

  const ammoMgrId = await getResponsibleManagerId();
  if (!ammoMgrId) {
    throw new Error('No ammo-responsible user is configured in system config');
  }

  // Permission: admin / system_manager / manager, OR ammo-responsible user, OR TL of holding team.
  let allowed = isManagerOrAbove(actor.userType) || actor.uid === ammoMgrId;
  if (!allowed && actor.userType === UserType.TEAM_LEADER && actor.teamId) {
    if (item.currentHolderType === 'TEAM') {
      allowed = item.currentHolderId === actor.teamId;
    } else {
      const holderTeam = await userTeamId(item.currentHolderId);
      allowed = !!holderTeam && holderTeam === actor.teamId;
    }
  }
  if (!allowed) throw new Error('Forbidden: only TL, ammo-responsible, or manager+ may return items');

  await ref.update({
    currentHolderType: 'USER',
    currentHolderId: ammoMgrId,
    status: 'RETURNED',
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { ammoMgrId };
}

export async function serverDeleteSerialItem(actor: ApiActor, serial: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.AMMUNITION).doc(serial);
  const snap = await ref.get();
  if (!snap.exists) return;
  const item = snap.data() as AmmunitionItem;

  const template = await getTemplate(item.templateId);
  if (!template) throw new Error('Template not found');

  const allowed = await canMutateAmmunitionInventory({
    actor,
    template,
    holderType: item.currentHolderType,
    holderId: item.currentHolderId,
  });
  if (!allowed) throw new Error('Forbidden');

  await ref.delete();
}

export async function serverListSerialItems(): Promise<AmmunitionItem[]> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.AMMUNITION).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionItem);
}
