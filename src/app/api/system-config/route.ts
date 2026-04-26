import { NextResponse } from 'next/server';
import {
  serverGetSystemConfig,
  serverUpdateSystemConfig,
  validateSystemConfigPayload,
} from '@/lib/db/server/systemConfigService';
import { validateActor } from '@/lib/db/server/policyHelpers';
import { UserType } from '@/types/user';

function isSystemAdmin(userType: UserType): boolean {
  return userType === UserType.ADMIN || userType === UserType.SYSTEM_MANAGER;
}

export async function GET() {
  try {
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
    const input = await request.json();
    const actor = validateActor(input.actor);

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
