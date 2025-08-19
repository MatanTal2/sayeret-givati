import { PhoneUtils } from '@/utils/validationUtils';

/**
 * Twilio SMS Service for OTP delivery
 */
export class TwilioService {
  private static readonly ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  private static readonly AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  private static readonly MESSAGING_SERVICE_SID = process.env.MESSAGING_SERVICE_SID;

  /**
   * Validate environment variables
   */
  private static validateConfig(): void {
    if (!this.ACCOUNT_SID) {
      throw new Error('TWILIO_ACCOUNT_SID environment variable is required');
    }
    if (!this.AUTH_TOKEN) {
      throw new Error('TWILIO_AUTH_TOKEN environment variable is required');
    }
    if (!this.MESSAGING_SERVICE_SID) {
      throw new Error('MESSAGING_SERVICE_SID environment variable is required');
    }
  }

  /**
   * Send OTP SMS via Twilio Messaging Service
   */
  static async sendOTPSMS(phoneNumber: string, otpCode: string): Promise<{
    success: boolean;
    error?: string;
    messageId?: string;
  }> {
    try {
      // Validate configuration
      this.validateConfig();

      // Prepare the message
      const message = `קוד האימות שלך: ${otpCode}\n\nקוד זה תקף למשך 5 דקות בלבד.\nמסייעת סיירת גבעתי\n\nלכל שאלה שלחו מייל: mesayaat.sayeret.givati@gmail.com`;

      // Create Twilio client (using basic auth)
      const auth = Buffer.from(`${this.ACCOUNT_SID}:${this.AUTH_TOKEN}`).toString('base64');

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'MessagingServiceSid': this.MESSAGING_SERVICE_SID!,
          'To': phoneNumber,
          'Body': message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Twilio API error:', errorData);
        return {
          success: false,
          error: `Failed to send SMS: ${errorData.message || 'Unknown error'}`
        };
      }

      const responseData = await response.json();

      return {
        success: true,
        messageId: responseData.sid
      };

    } catch (error) {
      console.error('Error sending SMS via Twilio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Format phone number for international delivery
   * @deprecated Use PhoneUtils.formatPhoneNumber instead
   */
  static formatPhoneNumber(phoneNumber: string): string {
    return PhoneUtils.formatPhoneNumber(phoneNumber);
  }

  /**
   * Validate phone number format
   * @deprecated Use PhoneUtils.validatePhoneNumber instead
   */
  static validatePhoneNumber(phoneNumber: string): {
    isValid: boolean;
    error?: string;
    formattedNumber?: string;
  } {
    return PhoneUtils.validatePhoneNumber(phoneNumber);
  }
}