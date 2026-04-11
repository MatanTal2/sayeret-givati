import { NextResponse } from 'next/server';
import { serverCreateUserProfile, serverMarkAsRegistered } from '@/lib/db/server/userService';

export async function POST(request: Request) {
  try {
    const { userProfile, militaryIdHash } = await request.json();

    if (!userProfile?.uid || !militaryIdHash) {
      return NextResponse.json(
        { success: false, error: 'userProfile.uid and militaryIdHash are required' },
        { status: 400 }
      );
    }

    // Create user profile
    await serverCreateUserProfile({
      ...userProfile,
      birthday: new Date(userProfile.birthday),
    });

    // Mark as registered in authorized_personnel
    await serverMarkAsRegistered(militaryIdHash);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] create-profile POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
