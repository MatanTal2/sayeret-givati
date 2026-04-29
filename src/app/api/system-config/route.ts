import { NextResponse } from 'next/server';
import {
  serverGetSystemConfig,
  serverUpdateSystemConfig,
  validateSystemConfigPayload,
} from '@/lib/db/server/systemConfigService';
import { getActorOrError } from '@/lib/db/server/auth';
import { UserType } from '@/types/user';

function isSystemAdmin(userType: UserType): boolean {
  return userType === UserType.ADMIN || userType === UserType.SYSTEM_MANAGER;
}

export async function GET(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const config = await serverGetSystemConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] system-config GET failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const input = await request.json();

    if (!isSystemAdmin(actor.userType)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only admin or system manager may update system config' },
        { status: 403 }
      );
    }

    const payload = validateSystemConfigPayload(input.payload);

    await serverUpdateSystemConfig({
      payload,
      actorUserId: actor.uid,
    });

    const config = await serverGetSystemConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] system-config PUT failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
