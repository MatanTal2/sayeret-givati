/**
 * Server-side Ammunition Templates Service (firebase-admin).
 *
 * Handles writes + privileged reads on `ammunitionTemplates`. Public list
 * reads happen through the client SDK in `src/lib/ammunition/templatesService.ts`.
 *
 * Permission model is enforced by the API route (admin / system_manager only
 * for create/update/delete, plus team_leader can propose). This service
 * trusts its caller.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  AmmunitionAllocation,
  AmmunitionSubcategory,
  AmmunitionTemplateStatus,
  AmmunitionType,
  SecurityLevel,
  TrackingMode,
} from '@/types/ammunition';
import { isAmmunitionSubcategory } from '@/lib/ammunition/subcategories';
import { CANONICAL_AMMUNITION_TEMPLATES } from '@/data/ammunitionTemplates';

const ALLOCATIONS: AmmunitionAllocation[] = ['USER', 'TEAM', 'BOTH'];
const TRACKING_MODES: TrackingMode[] = ['BRUCE', 'SERIAL', 'LOOSE_COUNT'];
const SECURITY_LEVELS: SecurityLevel[] = ['EXPLOSIVE', 'GRABBABLE'];
const STATUSES: AmmunitionTemplateStatus[] = ['CANONICAL', 'PROPOSED', 'PENDING_REQUEST'];

export interface AmmunitionTemplateInput {
  name: string;
  description?: string;
  subcategory: AmmunitionSubcategory;
  allocation: AmmunitionAllocation;
  trackingMode: TrackingMode;
  securityLevel: SecurityLevel;
  bulletsPerCardboard?: number;
  cardboardsPerBruce?: number;
  status: AmmunitionTemplateStatus;
  createdBy: string;
}

export function validateAmmunitionTemplateInput(
  input: unknown
): AmmunitionTemplateInput {
  if (!input || typeof input !== 'object') {
    throw new Error('input is required');
  }
  const i = input as Record<string, unknown>;

  if (typeof i.name !== 'string' || i.name.trim().length < 2) {
    throw new Error('name must be at least 2 characters');
  }
  if (!isAmmunitionSubcategory(i.subcategory)) {
    throw new Error('subcategory is invalid');
  }
  if (typeof i.allocation !== 'string' || !ALLOCATIONS.includes(i.allocation as AmmunitionAllocation)) {
    throw new Error('allocation must be one of: USER, TEAM, BOTH');
  }
  if (typeof i.trackingMode !== 'string' || !TRACKING_MODES.includes(i.trackingMode as TrackingMode)) {
    throw new Error('trackingMode must be one of: BRUCE, SERIAL, LOOSE_COUNT');
  }
  if (typeof i.securityLevel !== 'string' || !SECURITY_LEVELS.includes(i.securityLevel as SecurityLevel)) {
    throw new Error('securityLevel must be one of: EXPLOSIVE, GRABBABLE');
  }
  if (typeof i.status !== 'string' || !STATUSES.includes(i.status as AmmunitionTemplateStatus)) {
    throw new Error('status must be one of: CANONICAL, PROPOSED, PENDING_REQUEST');
  }
  if (typeof i.createdBy !== 'string' || !i.createdBy) {
    throw new Error('createdBy is required');
  }

  if (i.trackingMode === 'BRUCE') {
    if (typeof i.bulletsPerCardboard !== 'number' || i.bulletsPerCardboard <= 0) {
      throw new Error('bulletsPerCardboard must be a positive number for BRUCE templates');
    }
    if (typeof i.cardboardsPerBruce !== 'number' || i.cardboardsPerBruce <= 0) {
      throw new Error('cardboardsPerBruce must be a positive number for BRUCE templates');
    }
  }

  return {
    name: i.name.trim(),
    ...(typeof i.description === 'string' && i.description.trim()
      ? { description: i.description.trim() }
      : {}),
    subcategory: i.subcategory as AmmunitionSubcategory,
    allocation: i.allocation as AmmunitionAllocation,
    trackingMode: i.trackingMode as TrackingMode,
    securityLevel: i.securityLevel as SecurityLevel,
    ...(i.trackingMode === 'BRUCE'
      ? {
          bulletsPerCardboard: i.bulletsPerCardboard as number,
          cardboardsPerBruce: i.cardboardsPerBruce as number,
        }
      : {}),
    status: i.status as AmmunitionTemplateStatus,
    createdBy: i.createdBy,
  };
}

function totalBulletsFor(input: AmmunitionTemplateInput): number | undefined {
  if (input.trackingMode !== 'BRUCE') return undefined;
  if (!input.bulletsPerCardboard || !input.cardboardsPerBruce) return undefined;
  return input.bulletsPerCardboard * input.cardboardsPerBruce;
}

export async function serverCreateAmmunitionTemplate(
  input: AmmunitionTemplateInput
): Promise<{ id: string }> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.AMMUNITION_TEMPLATES).doc();

  const total = totalBulletsFor(input);

  const data: Record<string, unknown> = {
    id: ref.id,
    name: input.name,
    subcategory: input.subcategory,
    allocation: input.allocation,
    trackingMode: input.trackingMode,
    securityLevel: input.securityLevel,
    status: input.status,
    createdBy: input.createdBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (input.description) data.description = input.description;
  if (input.trackingMode === 'BRUCE') {
    data.bulletsPerCardboard = input.bulletsPerCardboard;
    data.cardboardsPerBruce = input.cardboardsPerBruce;
    if (total) data.totalBulletsPerBruce = total;
  }

  await ref.set(data);
  return { id: ref.id };
}

export async function serverUpdateAmmunitionTemplate(
  templateId: string,
  updates: Partial<AmmunitionTemplateInput>
): Promise<void> {
  const db = getAdminDb();
  const update: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (updates.name !== undefined) update.name = updates.name;
  if (updates.description !== undefined) update.description = updates.description;
  if (updates.subcategory !== undefined) update.subcategory = updates.subcategory;
  if (updates.allocation !== undefined) update.allocation = updates.allocation;
  if (updates.trackingMode !== undefined) update.trackingMode = updates.trackingMode;
  if (updates.securityLevel !== undefined) update.securityLevel = updates.securityLevel;
  if (updates.status !== undefined) update.status = updates.status;

  if (
    updates.bulletsPerCardboard !== undefined ||
    updates.cardboardsPerBruce !== undefined ||
    updates.trackingMode === 'BRUCE'
  ) {
    if (updates.bulletsPerCardboard !== undefined) {
      update.bulletsPerCardboard = updates.bulletsPerCardboard;
    }
    if (updates.cardboardsPerBruce !== undefined) {
      update.cardboardsPerBruce = updates.cardboardsPerBruce;
    }
    if (
      typeof updates.bulletsPerCardboard === 'number' &&
      typeof updates.cardboardsPerBruce === 'number'
    ) {
      update.totalBulletsPerBruce =
        updates.bulletsPerCardboard * updates.cardboardsPerBruce;
    }
  }

  await db.collection(COLLECTIONS.AMMUNITION_TEMPLATES).doc(templateId).update(update);
}

export async function serverDeleteAmmunitionTemplate(templateId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.AMMUNITION_TEMPLATES).doc(templateId).delete();
}

export async function serverListAmmunitionTemplates(): Promise<AmmunitionType[]> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.AMMUNITION_TEMPLATES).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionType);
}

export async function serverSeedCanonicalAmmunitionTemplates(
  createdBy: string
): Promise<{ created: number; skipped: number }> {
  const db = getAdminDb();
  const col = db.collection(COLLECTIONS.AMMUNITION_TEMPLATES);

  const existingSnap = await col.where('status', '==', 'CANONICAL').get();
  const existingNames = new Set(existingSnap.docs.map((d) => d.data().name as string));

  let created = 0;
  let skipped = 0;
  const batch = db.batch();
  for (const seed of CANONICAL_AMMUNITION_TEMPLATES) {
    if (existingNames.has(seed.name)) {
      skipped += 1;
      continue;
    }
    const ref = col.doc();
    const total =
      seed.trackingMode === 'BRUCE' &&
      seed.bulletsPerCardboard &&
      seed.cardboardsPerBruce
        ? seed.bulletsPerCardboard * seed.cardboardsPerBruce
        : undefined;
    const data: Record<string, unknown> = {
      id: ref.id,
      name: seed.name,
      subcategory: seed.subcategory,
      allocation: seed.allocation,
      trackingMode: seed.trackingMode,
      securityLevel: seed.securityLevel,
      status: 'CANONICAL',
      createdBy,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (seed.description) data.description = seed.description;
    if (seed.trackingMode === 'BRUCE') {
      data.bulletsPerCardboard = seed.bulletsPerCardboard;
      data.cardboardsPerBruce = seed.cardboardsPerBruce;
      if (total) data.totalBulletsPerBruce = total;
    }
    batch.set(ref, data);
    created += 1;
  }

  if (created > 0) await batch.commit();
  return { created, skipped };
}
