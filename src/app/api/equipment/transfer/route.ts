import { NextResponse } from 'next/server';
import { serverTransferEquipment } from '@/lib/db/server/equipmentService';
import { getActorOrError } from '@/lib/db/server/auth';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const input = await request.json();
    if (!input.equipmentId || !input.newHolder || !input.newHolderId) {
      return NextResponse.json(
        { success: false, error: 'equipmentId, newHolder, and newHolderId are required' },
        { status: 400 }
      );
    }
    await serverTransferEquipment(input);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment/transfer POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
