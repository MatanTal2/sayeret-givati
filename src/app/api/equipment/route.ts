import { NextResponse } from 'next/server';
import { serverCreateEquipment, serverUpdateEquipment } from '@/lib/db/server/equipmentService';
import { getActorOrError } from '@/lib/db/server/auth';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const input = await request.json();
    if (!input.equipmentData?.id) {
      return NextResponse.json({ success: false, error: 'equipmentData.id is required' }, { status: 400 });
    }
    const result = await serverCreateEquipment(input);
    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const input = await request.json();
    if (!input.equipmentId) {
      return NextResponse.json({ success: false, error: 'equipmentId is required' }, { status: 400 });
    }
    await serverUpdateEquipment(input);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment PUT failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
