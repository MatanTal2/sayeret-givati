import { NextResponse } from 'next/server';
import { serverBulkAddPersonnel } from '@/lib/db/server/authorizedPersonnelService';
import { serverUpsertPhoneBookFromPersonnel } from '@/lib/db/server/phoneBookService';
import { getActorOrError } from '@/lib/db/server/auth';
import { UserType } from '@/types/user';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    if (actor.userType !== UserType.ADMIN && actor.userType !== UserType.SYSTEM_MANAGER) {
      return NextResponse.json({ success: false, error: 'Forbidden: admin/system_manager only' }, { status: 403 });
    }
    const { entries } = await request.json();
    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ success: false, error: 'entries array is required' }, { status: 400 });
    }
    const result = await serverBulkAddPersonnel(entries);

    // Write-through to phone book for each successfully added entry.
    const failed = new Set(result.failedIndices);
    await Promise.all(
      entries.map((entry, idx) => {
        if (failed.has(idx)) return Promise.resolve();
        const data = entry?.data;
        if (!data) return Promise.resolve();
        return serverUpsertPhoneBookFromPersonnel({
          militaryPersonalNumberHash: entry.docId,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          userType: data.userType as UserType | undefined,
          registered: data.registered ?? false,
        });
      })
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] authorized-personnel/bulk POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
