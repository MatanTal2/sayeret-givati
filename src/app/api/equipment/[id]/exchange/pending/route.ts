import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/db/admin';
import { COLLECTIONS } from '@/lib/db/collections';
import { ExchangeRequestStatus } from '@/types/equipment';
import { getActorOrError } from '@/lib/db/server/auth';

/**
 * GET /api/equipment/[id]/exchange/pending
 *
 * Returns the ID of the pending ExchangeRequest doc for this equipment, or null
 * if none exists. Used by the UI to resolve a request ID before opening
 * approve / reject modals without exposing the full request shape.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;

    const { id } = await params;
    const db = getAdminDb();
    const snap = await db
      .collection(COLLECTIONS.EXCHANGE_REQUESTS)
      .where('equipmentDocId', '==', id)
      .where('status', '==', ExchangeRequestStatus.PENDING)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ success: true, requestId: null });
    }
    return NextResponse.json({ success: true, requestId: snap.docs[0].id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment/[id]/exchange/pending GET failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
