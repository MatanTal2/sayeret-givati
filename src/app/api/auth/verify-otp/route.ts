import { NextRequest, NextResponse } from 'next/server';
import { OTPManager } from '@/lib/otpUtils';
import { TwilioService } from '@/lib/twilioService';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otpCode } = await request.json();

    // Validate input
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Phone number is required and must be a string' 
        },
        { status: 400 }
      );
    }

    if (!otpCode || typeof otpCode !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'OTP code is required and must be a string' 
        },
        { status: 400 }
      );
    }

    // Validate OTP code format
    if (!/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'קוד האימות חייב להכיל 6 ספרות' 
        },
        { status: 400 }
      );
    }

    // Validate and format phone number
    const phoneValidation = TwilioService.validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: phoneValidation.error || 'Invalid phone number format' 
        },
        { status: 400 }
      );
    }

    const formattedPhoneNumber = phoneValidation.formattedNumber!;

    // Verify OTP code
    const verificationResult = await OTPManager.verifyOTPCode(formattedPhoneNumber, otpCode);

    if (!verificationResult.success) {
      let errorMessage = 'קוד האימות שגוי';
      
      // Provide specific error messages in Hebrew
      switch (verificationResult.error) {
        case 'No OTP session found for this phone number':
          errorMessage = 'לא נמצא קוד אימות פעיל למספר זה';
          break;
        case 'OTP code has already been used':
          errorMessage = 'קוד האימות כבר נוצל';
          break;
        case 'OTP code has expired':
          errorMessage = 'קוד האימות פג תוקף';
          break;
        case 'Invalid OTP code':
          errorMessage = 'קוד האימות שגוי';
          break;
        default:
          errorMessage = 'שגיאה באימות הקוד';
      }

      return NextResponse.json(
        { 
          success: false,
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? verificationResult.error : undefined
        },
        { status: 400 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: 'קוד האימות אומת בהצלחה',
      phoneNumber: formattedPhoneNumber,
      verified: true
    });

  } catch (error) {
    console.error('Error in verify-otp API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'שגיאה פנימית במערכת. אנא נסה שוב מאוחר יותר.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to verify OTP.' },
    { status: 405 }
  );
}