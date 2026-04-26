import { NextResponse } from 'next/server';
import {
  serverCreateAmmunitionReportRequest,
  serverCancelAmmunitionReportRequest,
  serverListAmmunitionReportRequests,
  validateCreateReportRequestInput,
} from '@/lib/db/server/ammunitionReportRequestService';
import { validateActor } from '@/lib/db/server/policyHelpers';
import { UserType } from '@/types/user';

function isManagerOrTL(userType: UserType): boolean {
  return (
    userType === UserType.ADMIN ||
    userType === UserType.SYSTEM_MANAGER ||
    userType === UserType.MANAGER ||
    userType === UserType.TEAM_LEADER
  );
}

export async function GET() {
  try {
    const requests = await serverListAmmunitionReportRequests();
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] ammunition-report-requests GET failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const actor = validateActor(input.actor);
    if (!isManagerOrTL(actor.userType)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only manager+ or team_leader may create requests' },
        { status: 403 }
      );
    }
    const payload = validateCreateReportRequestInput({
      ...(input.payload || {}),
      actor,
      actorUserName: input.actorUserName || actor.displayName || actor.uid,
    });
    const result = await serverCreateAmmunitionReportRequest(payload);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /forbidden/i.test(message) ? 403 : 500;
    console.error('[API] ammunition-report-requests POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const input = await request.json();
    const actor = validateActor(input.actor);
    if (!isManagerOrTL(actor.userType)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only manager+ or team_leader may cancel requests' },
        { status: 403 }
      );
    }
    if (typeof input.requestId !== 'string' || !input.requestId) {
      return NextResponse.json(
        { success: false, error: 'requestId is required' },
        { status: 400 }
      );
    }
    if (input.action !== 'cancel') {
      return NextResponse.json(
        { success: false, error: 'unsupported action' },
        { status: 400 }
      );
    }
    await serverCancelAmmunitionReportRequest({ actor, requestId: input.requestId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /forbidden/i.test(message) ? 403 : 500;
    console.error('[API] ammunition-report-requests PATCH failed:', message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
