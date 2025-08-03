import { NextRequest, NextResponse } from 'next/server';
import { SecurityUtils } from '@/lib/adminUtils';
import { collection, query, getDocs } from 'firebase/firestore';
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

    // Query the authorized_personnel collection
    const personnelQuery = query(collection(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION));
    const querySnapshot = await getDocs(personnelQuery);

    // Check each document to find matching hashed military ID
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      try {
        // Verify if the provided military ID matches this document's hashed ID
        const isMatch = await SecurityUtils.verifyMilitaryId(
          cleanMilitaryId, 
          data.militaryPersonalNumberHash, 
          data.salt
        );

        if (isMatch) {
          console.log('✅ Military ID found in authorized personnel');
          
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
      } catch (error) {
        console.error('Error verifying military ID hash:', error);
        // Continue to next document if hash verification fails
        continue;
      }
    }

    // Military ID not found in authorized personnel
    console.log('❌ Military ID not found in authorized personnel');
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