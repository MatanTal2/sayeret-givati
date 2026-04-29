import { NextRequest, NextResponse } from 'next/server';
import { SecurityUtils } from '@/lib/adminUtils';
import { getAdminDb } from '@/lib/db/admin';
import { COLLECTIONS } from '@/lib/db/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { UserType } from '@/types/user';
import { UserRole } from '@/types/equipment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const requiredFields = [
      'email',
      'firstName',
      'lastName',
      'gender',
      'birthdate',
      'phoneNumber',
      'militaryPersonalNumber',
      'firebaseAuthUid',
    ];
    const missingFields = requiredFields.filter((f) => !body[f]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const uid: string = String(body.firebaseAuthUid).trim();
    const militaryIdHash = await SecurityUtils.hashMilitaryId(body.militaryPersonalNumber);

    const db = getAdminDb();

    const personnelRef = db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).doc(militaryIdHash);
    const personnelSnap = await personnelRef.get();
    if (!personnelSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Military ID not found in authorized personnel. Registration not allowed.' },
        { status: 400 }
      );
    }
    const personnel = personnelSnap.data() ?? {};

    const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
    const existing = await userRef.get();
    if (existing.exists) {
      // Idempotent: already created. Still ensure personnel marked registered.
      await personnelRef.update({
        registered: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, uid, message: 'User profile already exists' });
    }

    const profile = {
      uid,
      email: String(body.email).trim(),
      firstName: String(body.firstName).trim(),
      lastName: String(body.lastName).trim(),
      gender: body.gender,
      birthday: new Date(body.birthdate),
      phoneNumber: body.phoneNumber,
      rank: personnel.rank ?? '',
      userType: personnel.userType ?? UserType.USER,
      role: UserRole.SOLDIER,
      status: 'active',
      militaryPersonalNumberHash: militaryIdHash,
      permissions: ['equipment:view'],
      emailVerified: Boolean(body.emailVerified),
      communicationPreferences: {
        emailNotifications: true,
        equipmentTransferAlerts: true,
        systemUpdates: false,
        schedulingAlerts: true,
        emergencyNotifications: true,
        lastUpdated: FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      joinDate: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userRef.set(profile);
    await personnelRef.update({
      registered: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, uid, message: 'User profile created successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] /auth/register failed:', message);
    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed. Please try again or contact support.',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'User registration endpoint. Use POST method.' },
    { status: 405 }
  );
}
