import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/db/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ status: 'invalid' }, { status: 400 });
    }

    try {
      const userRecord = await getAdminAuth().getUserByEmail(email.trim());
      return NextResponse.json({
        status: userRecord.emailVerified ? 'verified' : 'unverified',
      });
    } catch (lookupError) {
      const code =
        lookupError && typeof lookupError === 'object' && 'code' in lookupError
          ? (lookupError as { code: string }).code
          : '';
      if (code === 'auth/user-not-found') {
        return NextResponse.json({ status: 'not-found' });
      }
      throw lookupError;
    }
  } catch (error) {
    console.error('check-email-verified error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
