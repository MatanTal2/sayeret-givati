import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { UserType } from '@/types/user';
import type { ApiActor } from './policyHelpers';
import { getActiveGrants } from './permissionGrantsService';

export class AuthError extends Error {
  constructor(message: string, public readonly status: 401 | 403) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Verifies the request's bearer token and returns a server-trusted ApiActor.
 * userType, teamId, displayName come from the Firestore users doc — never
 * from the request body — so the actor cannot be forged.
 */
export async function getActorFromRequest(request: Request): Promise<ApiActor> {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw new AuthError('Missing or malformed Authorization header', 401);
  }
  const idToken = header.slice('Bearer '.length).trim();
  if (!idToken) {
    throw new AuthError('Empty bearer token', 401);
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken, true);
    uid = decoded.uid;
  } catch {
    throw new AuthError('Invalid or expired token', 401);
  }

  const snap = await getAdminDb().collection(COLLECTIONS.USERS).doc(uid).get();
  if (!snap.exists) {
    throw new AuthError('User profile not found', 403);
  }
  const data = snap.data() ?? {};
  if (!data.userType) {
    throw new AuthError('User profile missing userType', 403);
  }

  const grants = await getActiveGrants(uid);

  return {
    uid,
    userType: data.userType as UserType,
    grants,
    ...(data.teamId ? { teamId: data.teamId as string } : {}),
    ...(data.displayName ? { displayName: data.displayName as string } : {}),
  };
}

/**
 * Convenience wrapper for API routes. Returns either the verified actor or
 * a NextResponse that the route can return immediately. Use:
 *
 *   const actorOrError = await getActorOrError(request);
 *   if (actorOrError instanceof NextResponse) return actorOrError;
 *   const actor = actorOrError;
 */
export async function getActorOrError(request: Request): Promise<ApiActor | NextResponse> {
  try {
    return await getActorFromRequest(request);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    }
    throw e;
  }
}
