/**
 * Server-side System Config Service (firebase-admin).
 * Backs the single doc `systemConfig/main` — system-wide settings.
 * Currently used for `ammoNotificationRecipientUserIds` (array of ammo
 * managers), `teams`, and `roundOpen`; will accumulate additional system-wide
 * flags as features land.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import type { SystemConfig } from '@/types/ammunition';

const MAIN_DOC_ID = 'main';

/**
 * Maximum number of ammo notification recipients we allow callers to store.
 * Keep in sync with `AmmoRecipientsSection` UI cap.
 */
export const AMMO_RECIPIENTS_MAX = 10;

export type SystemConfigUpdatableFields = Pick<
  SystemConfig,
  'ammoNotificationRecipientUserIds' | 'teams' | 'roundOpen'
>;

export interface SystemConfigPayload {
  ammoNotificationRecipientUserIds?: string[];
  teams?: string[];
  roundOpen?: boolean;
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

  if ('ammoNotificationRecipientUserIds' in p) {
    const v = p.ammoNotificationRecipientUserIds;
    if (v === undefined || v === null) {
      out.ammoNotificationRecipientUserIds = [];
    } else if (!Array.isArray(v)) {
      throw new Error('ammoNotificationRecipientUserIds must be an array of strings');
    } else {
      const seen = new Set<string>();
      const normalized: string[] = [];
      for (const item of v) {
        if (typeof item !== 'string') {
          throw new Error('ammoNotificationRecipientUserIds entries must be strings');
        }
        const trimmed = item.trim();
        if (!trimmed) {
          throw new Error('ammoNotificationRecipientUserIds entries must be non-empty');
        }
        if (seen.has(trimmed)) {
          throw new Error('ammoNotificationRecipientUserIds contains duplicate uids');
        }
        seen.add(trimmed);
        normalized.push(trimmed);
      }
      if (normalized.length > AMMO_RECIPIENTS_MAX) {
        throw new Error(
          `ammoNotificationRecipientUserIds exceeds the maximum of ${AMMO_RECIPIENTS_MAX}`
        );
      }
      out.ammoNotificationRecipientUserIds = normalized;
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

  if ('roundOpen' in p) {
    const v = p.roundOpen;
    if (typeof v !== 'boolean') {
      throw new Error('roundOpen must be a boolean');
    }
    out.roundOpen = v;
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
