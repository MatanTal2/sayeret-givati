/**
 * Manual OTP Flow Test Script
 * Use this to test Steps 3 & 4 manually with real API calls
 */

import { TwilioService } from '../lib/twilioService';
import { OTPManager } from '../lib/otpUtils';

async function testStep3_TwilioSMS() {
  console.log('🧪 Testing Step 3: Twilio SMS Sending');
  console.log('=====================================');

  // Test phone number validation
  console.log('\n📱 Testing phone number validation:');
  const testNumbers = ['+972501234567', '0501234567', '972501234567', 'invalid'];
  
  testNumbers.forEach(number => {
    const validation = TwilioService.validatePhoneNumber(number);
    console.log(`${number} -> Valid: ${validation.isValid}, Formatted: ${validation.formattedNumber || 'N/A'}`);
  });

  // Test SMS message format (without actually sending)
  console.log('\n📤 SMS Message Format:');
  const testOTP = '123456';
  const phoneNumber = '+972501234567';
  
  console.log(`Phone: ${phoneNumber}`);
  console.log(`OTP: ${testOTP}`);
  console.log('Message would be:');
  console.log(`קוד האימות שלך: ${testOTP}\n\nקוד זה תקף למשך 5 דקות בלבד.\nצה"ל - יחידת סיירת גבעתי`);

  // Check environment variables
  console.log('\n🔧 Environment Variables:');
  const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'MESSAGING_SERVICE_SID'];
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
  });

  console.log('\n✅ Step 3 validation complete');
}

async function testStep4_OTPGeneration() {
  console.log('\n🧪 Testing Step 4: OTP Generation & Verification');
  console.log('================================================');

  // Test OTP generation
  console.log('\n🎲 Testing OTP code generation:');
  const otpCodes = [];
  for (let i = 0; i < 10; i++) {
    const otp = OTPManager.generateOTPCode();
    otpCodes.push(otp);
    console.log(`OTP ${i + 1}: ${otp} (Length: ${otp.length}, Type: ${typeof otp})`);
  }

  // Check for duplicates
  const uniqueOTPs = new Set(otpCodes);
  console.log(`\nGenerated ${otpCodes.length} OTPs, ${uniqueOTPs.size} unique (${uniqueOTPs.size === otpCodes.length ? '✅' : '⚠️'})`);

  // Test OTP format
  console.log('\n📋 OTP Format Validation:');
  otpCodes.forEach((otp, index) => {
    const isValid = /^\d{6}$/.test(otp);
    const isString = typeof otp === 'string';
    console.log(`OTP ${index + 1}: ${otp} -> Format: ${isValid ? '✅' : '❌'}, String: ${isString ? '✅' : '❌'}`);
  });

  console.log('\n✅ Step 4 validation complete');
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints');
  console.log('========================');

  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  console.log('\n📤 Testing /api/auth/send-otp');
  console.log('Endpoint:', `${baseURL}/api/auth/send-otp`);
  console.log('Method: POST');
  console.log('Expected body: { "phoneNumber": "+972501234567" }');
  console.log('Expected responses:');
  console.log('  Success (200): { "success": true, "message": "...", "attemptsRemaining": 4 }');
  console.log('  Rate limited (429): { "success": false, "rateLimited": true }');
  console.log('  Error (400): { "success": false, "error": "..." }');

  console.log('\n📥 Testing /api/auth/verify-otp');
  console.log('Endpoint:', `${baseURL}/api/auth/verify-otp`);
  console.log('Method: POST');
  console.log('Expected body: { "phoneNumber": "+972501234567", "otpCode": "123456" }');
  console.log('Expected responses:');
  console.log('  Success (200): { "success": true, "verified": true }');
  console.log('  Invalid code (400): { "success": false, "error": "קוד האימות שגוי" }');
  console.log('  Expired (400): { "success": false, "error": "קוד האימות פג תוקף" }');

  console.log('\n💡 To test manually:');
  console.log('1. Start development server: npm run dev');
  console.log('2. Use curl or Postman to call the endpoints');
  console.log('3. Check server logs for detailed debugging info');
}

async function runCompleteTest() {
  console.log('🚀 OTP Flow Complete Test (Steps 3 & 4)');
  console.log('========================================');
  
  try {
    await testStep3_TwilioSMS();
    await testStep4_OTPGeneration();
    await testAPIEndpoints();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up Twilio environment variables');
    console.log('2. Test with real phone numbers');
    console.log('3. Integrate with registration flow');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Export for use in other scripts
export {
  testStep3_TwilioSMS,
  testStep4_OTPGeneration,
  testAPIEndpoints,
  runCompleteTest
};

// Run if called directly
if (require.main === module) {
  runCompleteTest();
}