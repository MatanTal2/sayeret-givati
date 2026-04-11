import { NextResponse } from 'next/server';
import {
  serverAddPersonnel,
  serverUpdatePersonnel,
  serverSyncPersonnelToUser,
  serverDeletePersonnel,
} from '@/lib/db/server/authorizedPersonnelService';

export async function POST(request: Request) {
  try {
    const { docId, data } = await request.json();
    if (!docId || !data) {
      return NextResponse.json({ success: false, error: 'docId and data are required' }, { status: 400 });
    }
    const id = await serverAddPersonnel(docId, data);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] authorized-personnel POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { personnelId, updates, syncToUser, militaryIdHash } = await request.json();
    if (!personnelId || !updates) {
      return NextResponse.json({ success: false, error: 'personnelId and updates are required' }, { status: 400 });
    }
    await serverUpdatePersonnel(personnelId, updates);

    // Sync to users collection if requested
    if (syncToUser && militaryIdHash) {
      await serverSyncPersonnelToUser(militaryIdHash, updates);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] authorized-personnel PUT failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Personnel id is required' }, { status: 400 });
    }
    await serverDeletePersonnel(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] authorized-personnel DELETE failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
