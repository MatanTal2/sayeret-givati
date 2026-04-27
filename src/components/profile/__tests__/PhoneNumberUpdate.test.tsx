import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PhoneNumberUpdate from '../PhoneNumberUpdate';

jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    PROFILE_COMPONENTS: {
      INVALID_PHONE_ERROR: 'invalid phone',
      INVALID_OTP_LENGTH: 'invalid otp length',
      INVALID_OTP_ERROR: 'invalid otp',
      INVALID_OTP_SERVER_ERROR: 'invalid otp server',
      OTP_SEND_ERROR: 'otp send error',
      SMS_SEND_ERROR: 'sms send error',
      PHONE_PLACEHOLDER: '050-1234567',
      OTP_PLACEHOLDER: '------',
      SEND_CODE: 'send',
      SEND_CODE_AGAIN: 'send again',
    },
  },
}));

describe('PhoneNumberUpdate — phone display formatting', () => {
  it('preserves the leading 0 when displaying an international number', () => {
    render(
      <PhoneNumberUpdate
        currentPhoneNumber="+972505123456"
        onPhoneUpdate={jest.fn()}
      />
    );

    expect(screen.getByText('050-512-3456')).toBeInTheDocument();
  });

  it('formats a stored local-format number with the existing leading 0', () => {
    render(
      <PhoneNumberUpdate
        currentPhoneNumber="0521234567"
        onPhoneUpdate={jest.fn()}
      />
    );

    expect(screen.getByText('052-123-4567')).toBeInTheDocument();
  });
});
