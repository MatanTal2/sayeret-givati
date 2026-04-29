import { NextRequest, NextResponse } from 'next/server';
import { UserService, RegistrationData } from '@/lib/userService';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Processing user registration request');
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'email',
      'firstName',
      'lastName',
      'gender',
      'birthdate',
      'phoneNumber',
      'militaryPersonalNumber',
      'firebaseAuthUid'
    ];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Prepare registration data
    const registrationData: RegistrationData = {
      email: body.email.trim(),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      gender: body.gender,
      birthdate: body.birthdate,
      phoneNumber: body.phoneNumber,
      militaryPersonalNumber: body.militaryPersonalNumber,
      firebaseAuthUid: body.firebaseAuthUid.trim(),
      emailVerified: Boolean(body.emailVerified),
    };

    console.log('📊 Registration data prepared for:', registrationData.email);

    // Register the user
    const result = await UserService.registerUser(registrationData);

    if (result.success) {
      console.log('✅ User registration successful');
      return NextResponse.json({
        success: true,
        uid: result.uid,
        message: result.message
      });
    } else {
      console.log('❌ User registration failed:', result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Error in registration API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error occurred during registration',
        details: process.env.NODE_ENV === 'development' ? error : undefined
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