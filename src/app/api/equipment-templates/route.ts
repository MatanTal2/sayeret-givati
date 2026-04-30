import { NextResponse } from 'next/server';
import {
  serverCreateEquipmentType,
  serverUpdateEquipmentType,
} from '@/lib/db/server/equipmentTemplatesService';
import { getActorOrError } from '@/lib/db/server/auth';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const data = await request.json();
    if (!data.name || !data.category || !data.subcategory || !data.status) {
      return NextResponse.json(
        { success: false, error: 'name, category, subcategory, and status are required' },
        { status: 400 }
      );
    }
    if (typeof data.requiresSerialNumber !== 'boolean' || typeof data.requiresDailyStatusCheck !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'requiresSerialNumber and requiresDailyStatusCheck must be booleans' },
        { status: 400 }
      );
    }
    const result = await serverCreateEquipmentType(data);
    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment-templates POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Template id is required' }, { status: 400 });
    }
    await serverUpdateEquipmentType(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment-templates PUT failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
