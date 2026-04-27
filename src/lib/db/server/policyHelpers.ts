/**
 * Server-side helpers that wrap equipmentPolicy for API-route consumption.
 * The policy module accepts EnhancedAuthUser; API routes receive an "actor"
 * payload from the client which we lift into that shape. Token verification
 * is not yet wired up (tracked in docs/spec/firestore-refactor.md as a gap).
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import type { Equipment } from '@/types/equipment';
import type { EnhancedAuthUser } from '@/types/user';
import { UserType } from '@/types/user';

export interface ApiActor {
  uid: string;
  userType: UserType;
  teamId?: string;
  displayName?: string;
}

export function actorToAuthUser(actor: ApiActor): EnhancedAuthUser {
  return {
    uid: actor.uid,
    userType: actor.userType,
    teamId: actor.teamId,
    displayName: actor.displayName,
  };
}

export function validateActor(actor: unknown): ApiActor {
  if (!actor || typeof actor !== 'object') {
    throw new Error('actor is required');
  }
  const a = actor as Partial<ApiActor>;
  if (!a.uid) throw new Error('actor.uid is required');
  if (!a.userType) throw new Error('actor.userType is required');
  return {
    uid: a.uid,
    userType: a.userType as UserType,
    ...(a.teamId ? { teamId: a.teamId } : {}),
    ...(a.displayName ? { displayName: a.displayName } : {}),
  };
}

export async function fetchEquipmentForPolicy(
  equipmentDocId: string
): Promise<Equipment> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.EQUIPMENT).doc(equipmentDocId).get();
  if (!snap.exists) throw new Error('Equipment not found');
  return { id: snap.id, ...snap.data() } as Equipment;
}
