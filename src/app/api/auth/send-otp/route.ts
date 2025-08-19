import { NextRequest, NextResponse } from 'next/server';
import { OTPManager } from '@/lib/otpUtils';
import { PhoneUtils } from '@/utils/validationUtils';
import { TwilioService } from '@/lib/twilioService';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

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

    // Validate and format phone number
    const phoneValidation = PhoneUtils.validatePhoneNumber(phoneNumber);
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

    // Check rate limiting
    const rateLimitCheck = await OTPManager.checkRateLimit(formattedPhoneNumber);
    if (!rateLimitCheck.allowed) {
      const resetTimeFormatted = rateLimitCheck.resetTime?.toLocaleTimeString('he-IL', {
        timeZone: 'Asia/Jerusalem',
        hour: '2-digit',
        minute: '2-digit'
      });

      return NextResponse.json(
        { 
          success: false,
          error: `יותר מדי ניסיונות. נסה שוב ב-${resetTimeFormatted || 'מספר דקות'}`,
          rateLimited: true,
          resetTime: rateLimitCheck.resetTime
        },
        { status: 429 }
      );
    }

    // Generate OTP code
    const otpCode = OTPManager.generateOTPCode();

    // Create OTP session in database
    await OTPManager.createOTPSession(formattedPhoneNumber, otpCode);

    // Send SMS via Twilio
    const smsResult = await TwilioService.sendOTPSMS(formattedPhoneNumber, otpCode);
    
    if (!smsResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'שגיאה בשליחת הודעה. אנא נסה שוב מאוחר יותר.',
          details: process.env.NODE_ENV === 'development' ? smsResult.error : undefined
        },
        { status: 500 }
      );
    }

    // Success response (without exposing OTP code)
    return NextResponse.json({
      success: true,
      message: 'קוד אימות נשלח בהצלחה',
      phoneNumber: formattedPhoneNumber,
      attemptsRemaining: rateLimitCheck.attemptsRemaining,
      expiresInMinutes: 5
    });

  } catch (error) {
    console.error('Error in send-otp API:', error);
    
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
    { error: 'Method not allowed. Use POST to send OTP.' },
    { status: 405 }
  );
}