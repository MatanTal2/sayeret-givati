import { NextResponse } from 'next/server';
import {
  serverDeleteAmmunitionTemplate,
  serverUpdateAmmunitionTemplate,
  validateAmmunitionTemplateInput,
} from '@/lib/db/server/ammunitionTemplatesService';
import { getActorOrError } from '@/lib/db/server/auth';
import { UserType } from '@/types/user';

function isAdminOrManager(userType: UserType): boolean {
  return (
    userType === UserType.ADMIN ||
    userType === UserType.SYSTEM_MANAGER ||
    userType === UserType.MANAGER
  );
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const input = await request.json();

    if (!isAdminOrManager(actor.userType)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only admin/manager may update templates' },
        { status: 403 }
      );
    }

    const payload = validateAmmunitionTemplateInput({
      ...(input.payload || {}),
      createdBy: actor.uid,
    });

    await serverUpdateAmmunitionTemplate(id, payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] ammunition-templates PUT failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    if (!isAdminOrManager(actor.userType)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only admin/manager may delete templates' },
        { status: 403 }
      );
    }

    await serverDeleteAmmunitionTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] ammunition-templates DELETE failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
