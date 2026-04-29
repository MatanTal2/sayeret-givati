/**
 * Server-side System Config Service (firebase-admin).
 * Backs the single doc `systemConfig/main` — system-wide settings.
 * Currently used for `ammoNotificationRecipientUserId`; will accumulate
 * additional system-wide flags as features land.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import type { SystemConfig } from '@/types/ammunition';

const MAIN_DOC_ID = 'main';

export type SystemConfigUpdatableFields = Pick<
  SystemConfig,
  'ammoNotificationRecipientUserId' | 'teams'
>;

export interface SystemConfigPayload {
  ammoNotificationRecipientUserId?: string;
  teams?: string[];
}

export async function serverGetSystemConfig(): Promise<SystemConfig | null> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.SYSTEM_CONFIG).doc(MAIN_DOC_ID).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as SystemConfig;
}

export interface UpdateSystemConfigInput {
  payload: SystemConfigPayload;
  actorUserId: string;
}

export function validateSystemConfigPayload(payload: unknown): SystemConfigPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload is required');
  }
  const p = payload as Record<string, unknown>;
  const out: SystemConfigPayload = {};

  if ('ammoNotificationRecipientUserId' in p) {
    const v = p.ammoNotificationRecipientUserId;
    if (v === null || v === '' || v === undefined) {
      out.ammoNotificationRecipientUserId = '';
    } else if (typeof v === 'string') {
      out.ammoNotificationRecipientUserId = v;
    } else {
      throw new Error('ammoNotificationRecipientUserId must be a string');
    }
  }

  if ('teams' in p) {
    const v = p.teams;
    if (!Array.isArray(v)) {
      throw new Error('teams must be an array of strings');
    }
    const normalized: string[] = [];
    for (const item of v) {
      if (typeof item !== 'string') {
        throw new Error('teams entries must be strings');
      }
      const trimmed = item.trim();
      if (!trimmed) continue;
      if (!normalized.includes(trimmed)) normalized.push(trimmed);
    }
    out.teams = normalized;
  }

  return out;
}

export async function serverUpdateSystemConfig(
  input: UpdateSystemConfigInput
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.SYSTEM_CONFIG).doc(MAIN_DOC_ID);

  const data: Record<string, unknown> = {
    ...input.payload,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: input.actorUserId,
  };

  await ref.set(data, { merge: true });
}
