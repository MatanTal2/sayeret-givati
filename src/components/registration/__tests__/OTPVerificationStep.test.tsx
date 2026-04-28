import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import OTPVerificationStep from '../OTPVerificationStep';

jest.mock('@/utils/validationUtils', () => ({
  validateOTP: jest.fn(),
  maskPhoneNumber: jest.fn(),
}));

jest.mock('@/lib/firebasePhoneAuth', () => ({
  confirmPhoneOtp: jest.fn(),
  mapFirebaseAuthError: jest.fn((err: unknown) =>
    err instanceof Error ? err.message : 'unknown'
  ),
}));

jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    AUTH: {
      OTP_VERIFICATION: 'אימות טלפון',
      OTP_SENT_MESSAGE: 'קוד בן 6 ספרות נשלח למספר הטלפון שלך',
      OTP_INPUT_PLACEHOLDER: 'הזן קוד 6 ספרות',
      VERIFY_OTP_CODE: 'אמת קוד',
      RESEND_CODE: 'שלח קוד מחדש',
      OTP_VERIFYING: 'מאמת קוד...',
      OTP_INTERNAL_ERROR: 'שגיאה',
    },
  },
}));

import { validateOTP, maskPhoneNumber } from '@/utils/validationUtils';
import { confirmPhoneOtp } from '@/lib/firebasePhoneAuth';

const mockValidateOTP = validateOTP as jest.MockedFunction<typeof validateOTP>;
const mockMaskPhoneNumber = maskPhoneNumber as jest.MockedFunction<typeof maskPhoneNumber>;
const mockConfirmPhoneOtp = confirmPhoneOtp as jest.MockedFunction<typeof confirmPhoneOtp>;

describe('OTPVerificationStep', () => {
  const baseProps = {
    phoneNumber: '0521234567',
    confirmationResult: { confirm: jest.fn() } as unknown as Parameters<typeof OTPVerificationStep>[0]['confirmationResult'],
    onVerifySuccess: jest.fn(),
    onResendOtp: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMaskPhoneNumber.mockReturnValue('4567***-052');
    mockValidateOTP.mockReturnValue({ isValid: false, errorMessage: 'הקוד חייב להכיל 6 ספרות בדיוק' });
  });

  it('renders masked phone number', () => {
    render(<OTPVerificationStep {...baseProps} />);
    expect(mockMaskPhoneNumber).toHaveBeenCalledWith('0521234567');
    expect(screen.getByText('4567***-052')).toBeInTheDocument();
  });

  it('focuses input on mount', () => {
    render(<OTPVerificationStep {...baseProps} />);
    expect(screen.getByTestId('otp-input')).toHaveFocus();
  });

  it('limits input to 6 digits and strips non-digits', async () => {
    const user = userEvent.setup();
    render(<OTPVerificationStep {...baseProps} />);
    const input = screen.getByTestId('otp-input');
    await user.type(input, '12a3b4c5d6789');
    expect(input).toHaveValue('123456');
  });

  it('shows validation error from validateOTP for invalid input', async () => {
    const user = userEvent.setup();
    render(<OTPVerificationStep {...baseProps} />);
    await user.type(screen.getByTestId('otp-input'), '123');
    expect(screen.getByTestId('otp-error')).toBeInTheDocument();
  });

  it('disables verify button when OTP invalid', () => {
    render(<OTPVerificationStep {...baseProps} />);
    expect(screen.getByTestId('verify-otp-button')).toBeDisabled();
  });

  it('calls confirmPhoneOtp + onVerifySuccess when valid 6-digit code is entered', async () => {
    const user = userEvent.setup();
    mockValidateOTP.mockReturnValue({ isValid: true, errorMessage: null });
    mockConfirmPhoneOtp.mockResolvedValue({} as Awaited<ReturnType<typeof confirmPhoneOtp>>);

    render(<OTPVerificationStep {...baseProps} />);
    await user.type(screen.getByTestId('otp-input'), '123456');

    await waitFor(() => {
      expect(mockConfirmPhoneOtp).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(baseProps.onVerifySuccess).toHaveBeenCalled();
    });
  });

  it('shows backend error when confirmPhoneOtp throws', async () => {
    const user = userEvent.setup();
    mockValidateOTP.mockReturnValue({ isValid: true, errorMessage: null });
    mockConfirmPhoneOtp.mockRejectedValue(new Error('קוד שגוי'));

    render(<OTPVerificationStep {...baseProps} />);
    await user.type(screen.getByTestId('otp-input'), '123456');

    await waitFor(() => {
      expect(screen.getByTestId('otp-backend-error')).toBeInTheDocument();
    });
  });

  it('calls onResendOtp when resend button clicked', async () => {
    const user = userEvent.setup();
    render(<OTPVerificationStep {...baseProps} />);
    await user.click(screen.getByText('שלח קוד מחדש'));
    expect(baseProps.onResendOtp).toHaveBeenCalled();
  });

  it('clears input on resend', async () => {
    const user = userEvent.setup();
    render(<OTPVerificationStep {...baseProps} />);
    const input = screen.getByTestId('otp-input');
    await user.type(input, '123');
    await user.click(screen.getByText('שלח קוד מחדש'));
    expect(input).toHaveValue('');
  });
});
