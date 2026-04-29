/**
 * Server-side helpers that wrap equipmentPolicy for API-route consumption.
 * The policy module accepts EnhancedAuthUser; ApiActor is the verified
 * server-side identity built by getActorFromRequest in ./auth.ts.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import type { Equipment } from '@/types/equipment';
import type { EnhancedAuthUser } from '@/types/user';
import { UserType } from '@/types/user';
import type { ActiveGrant } from '@/types/permissionGrant';

export interface ApiActor {
  uid: string;
  userType: UserType;
  grants?: ActiveGrant[];
  teamId?: string;
  displayName?: string;
}

export function actorToAuthUser(actor: ApiActor): EnhancedAuthUser {
  return {
    uid: actor.uid,
    userType: actor.userType,
    grants: actor.grants ?? [],
    teamId: actor.teamId,
    displayName: actor.displayName,
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
