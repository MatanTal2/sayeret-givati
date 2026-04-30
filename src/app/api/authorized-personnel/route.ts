import { NextResponse } from 'next/server';
import {
  serverAddPersonnel,
  serverUpdatePersonnel,
  serverSyncPersonnelToUser,
  serverDeletePersonnel,
} from '@/lib/db/server/authorizedPersonnelService';
import {
  serverDeletePhoneBookEntryByHash,
  serverUpsertPhoneBookFromPersonnel,
} from '@/lib/db/server/phoneBookService';
import { getActorOrError } from '@/lib/db/server/auth';
import { UserType } from '@/types/user';

function isPersonnelAdmin(userType: UserType): boolean {
  return userType === UserType.ADMIN || userType === UserType.SYSTEM_MANAGER;
}

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    if (!isPersonnelAdmin(actor.userType)) {
      return NextResponse.json({ success: false, error: 'Forbidden: admin/system_manager only' }, { status: 403 });
    }
    const { docId, data } = await request.json();
    if (!docId || !data) {
      return NextResponse.json({ success: false, error: 'docId and data are required' }, { status: 400 });
    }
    const id = await serverAddPersonnel(docId, data);
    await serverUpsertPhoneBookFromPersonnel({
      militaryPersonalNumberHash: docId,
      firstName: data?.firstName,
      lastName: data?.lastName,
      phoneNumber: data?.phoneNumber,
      userType: data?.userType,
      registered: data?.registered ?? false,
    });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] authorized-personnel POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    if (!isPersonnelAdmin(actor.userType)) {
      return NextResponse.json({ success: false, error: 'Forbidden: admin/system_manager only' }, { status: 403 });
    }
    const { personnelId, updates, syncToUser, militaryIdHash } = await request.json();
    if (!personnelId || !updates) {
      return NextResponse.json({ success: false, error: 'personnelId and updates are required' }, { status: 400 });
    }
    await serverUpdatePersonnel(personnelId, updates);

    // Sync to users collection if requested
    if (syncToUser && militaryIdHash) {
      await serverSyncPersonnelToUser(militaryIdHash, updates);
    }

    await serverUpsertPhoneBookFromPersonnel({
      militaryPersonalNumberHash: personnelId,
      firstName: updates?.firstName,
      lastName: updates?.lastName,
      phoneNumber: updates?.phoneNumber,
      userType: updates?.userType,
      registered: updates?.registered,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] authorized-personnel PUT failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    if (!isPersonnelAdmin(actor.userType)) {
      return NextResponse.json({ success: false, error: 'Forbidden: admin/system_manager only' }, { status: 403 });
    }
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Personnel id is required' }, { status: 400 });
    }
    await serverDeletePersonnel(id);
    await serverDeletePhoneBookEntryByHash(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] authorized-personnel DELETE failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
