import { NextRequest, NextResponse } from 'next/server';
import { OTPManager } from '@/lib/otpUtils';
import { PhoneUtils } from '@/utils/validationUtils';
import { TwilioService } from '@/lib/twilioService';
import { TEXT_CONSTANTS } from '@/constants/text';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    // Validate input
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: TEXT_CONSTANTS.AUTH.OTP_PHONE_REQUIRED 
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
          error: phoneValidation.error || TEXT_CONSTANTS.AUTH.OTP_INVALID_PHONE_FORMAT 
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

      const errorMessage = resetTimeFormatted 
        ? TEXT_CONSTANTS.AUTH.OTP_RATE_LIMITED.replace('{resetTime}', resetTimeFormatted)
        : TEXT_CONSTANTS.AUTH.OTP_RATE_LIMITED_FALLBACK;

      return NextResponse.json(
        { 
          success: false,
          error: errorMessage,
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
          error: TEXT_CONSTANTS.AUTH.OTP_SMS_SEND_ERROR,
          details: process.env.NODE_ENV === 'development' ? smsResult.error : undefined
        },
        { status: 500 }
      );
    }

    // Success response (without exposing OTP code)
    return NextResponse.json({
      success: true,
      message: TEXT_CONSTANTS.AUTH.OTP_SENT_SUCCESS,
      phoneNumber: formattedPhoneNumber,
      attemptsRemaining: rateLimitCheck.attemptsRemaining,
      expiresInMinutes: 5
    });

  } catch (error) {
    console.error('Error in send-otp API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: TEXT_CONSTANTS.AUTH.OTP_INTERNAL_ERROR,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: TEXT_CONSTANTS.AUTH.OTP_METHOD_NOT_ALLOWED },
    { status: 405 }
  );
}