import { NextRequest, NextResponse } from 'next/server';
import { SecurityUtils } from '@/lib/adminUtils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ADMIN_CONFIG } from '@/constants/admin';

export async function POST(request: NextRequest) {
  try {
    const { militaryId } = await request.json();

    // Validate input
    if (!militaryId || typeof militaryId !== 'string') {
      return NextResponse.json(
        { error: 'Military ID is required and must be a string' },
        { status: 400 }
      );
    }

    // Sanitize military ID (remove any non-numeric characters)
    const cleanMilitaryId = militaryId.replace(/[^0-9]/g, '');
    
    if (cleanMilitaryId.length < 5 || cleanMilitaryId.length > 7) {
      return NextResponse.json(
        { error: 'Military ID must be between 5-7 digits' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying military ID:', cleanMilitaryId);
    console.log('📊 Collection name:', ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION);

    try {
      // Generate hash to use as document ID for O(1) lookup
      const hash = await SecurityUtils.hashMilitaryId(cleanMilitaryId);
      console.log('🔨 Generated hash:', hash);
      
      // Direct document lookup using hash as document ID
      const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION, hash);
      const docSnapshot = await getDoc(docRef);
      
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        console.log('✅ Military ID found in authorized personnel');
        
        // Check if user is already registered
        if (data.registered === true) {
          console.log('❌ User already registered');
          return NextResponse.json({
            success: false,
            error: 'משתמש זה כבר רשום במערכת. אנא השתמש בעמוד ההתחברות.',
            alreadyRegistered: true
          }, { status: 409 });
        }
        
        console.log('✅ User not yet registered, proceeding with registration flow');
        
        // Return the personnel data needed for registration
        return NextResponse.json({
          success: true,
          personnel: {
            phoneNumber: data.phoneNumber,
            firstName: data.firstName,
            lastName: data.lastName,
            rank: data.rank
          }
        });
      }
      
      // Military ID not found in authorized personnel
      console.log('❌ Military ID not found in authorized personnel');
    } catch (error) {
      console.error('Error generating hash or accessing document:', error);
      console.log('❌ Error during military ID verification');
    }
    return NextResponse.json(
      { 
        success: false,
        error: 'Military ID not found in authorized personnel. Please contact your administrator.' 
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error in verify-military-id API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error occurred while verifying military ID',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to verify military ID.' },
    { status: 405 }
  );
}