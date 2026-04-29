import {
  signInWithPhoneNumber,
  linkWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  sendPhoneOtp,
  confirmPhoneOtp,
  linkEmailPassword,
  sendVerificationEmail,
  sendPasswordReset,
  mapFirebaseAuthError,
} from '../firebasePhoneAuth';

const mockSignIn = signInWithPhoneNumber as jest.MockedFunction<typeof signInWithPhoneNumber>;
const mockLink = linkWithCredential as jest.MockedFunction<typeof linkWithCredential>;
const mockCredential = EmailAuthProvider.credential as jest.MockedFunction<typeof EmailAuthProvider.credential>;
const mockSendEmailVerification = sendEmailVerification as jest.MockedFunction<typeof sendEmailVerification>;
const mockSendPasswordReset = sendPasswordResetEmail as jest.MockedFunction<typeof sendPasswordResetEmail>;

describe('firebasePhoneAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendPhoneOtp delegates to signInWithPhoneNumber', async () => {
    const verifier = {} as Parameters<typeof sendPhoneOtp>[1];
    mockSignIn.mockResolvedValue({} as Awaited<ReturnType<typeof signInWithPhoneNumber>>);
    await sendPhoneOtp('+972501234567', verifier);
    expect(mockSignIn).toHaveBeenCalledWith(expect.anything(), '+972501234567', verifier);
  });

  it('confirmPhoneOtp calls confirmation.confirm with code', async () => {
    const confirm = jest.fn().mockResolvedValue({});
    await confirmPhoneOtp({ confirm } as unknown as Parameters<typeof confirmPhoneOtp>[0], '123456');
    expect(confirm).toHaveBeenCalledWith('123456');
  });

  it('linkEmailPassword builds EmailAuthProvider credential and links', async () => {
    const user = {} as Parameters<typeof linkEmailPassword>[0];
    mockCredential.mockReturnValue({ email: 'a@b.c', password: 'pw' } as ReturnType<typeof EmailAuthProvider.credential>);
    mockLink.mockResolvedValue({} as Awaited<ReturnType<typeof linkWithCredential>>);

    await linkEmailPassword(user, 'a@b.c', 'pw');

    expect(mockCredential).toHaveBeenCalledWith('a@b.c', 'pw');
    expect(mockLink).toHaveBeenCalled();
  });

  it('sendVerificationEmail delegates to sendEmailVerification', async () => {
    const user = {} as Parameters<typeof sendVerificationEmail>[0];
    await sendVerificationEmail(user);
    expect(mockSendEmailVerification).toHaveBeenCalledWith(user);
  });

  it('sendPasswordReset delegates to sendPasswordResetEmail', async () => {
    await sendPasswordReset('a@b.c');
    expect(mockSendPasswordReset).toHaveBeenCalledWith(expect.anything(), 'a@b.c');
  });

  describe('mapFirebaseAuthError', () => {
    it.each([
      ['auth/invalid-phone-number', 'מספר טלפון'],
      ['auth/invalid-verification-code', 'אימות'],
      ['auth/code-expired', 'אימות'],
      ['auth/captcha-check-failed', 'reCAPTCHA'],
      ['auth/too-many-requests', 'יותר מדי'],
      ['auth/email-already-in-use', 'משויכת'],
      ['auth/weak-password', 'חלשה'],
      ['auth/invalid-email', 'תקינה'],
    ])('maps %s to a Hebrew message containing %s', (code, snippet) => {
      const message = mapFirebaseAuthError({ code });
      expect(message).toContain(snippet);
    });

    it('returns a default message for unknown codes', () => {
      const message = mapFirebaseAuthError({ code: 'auth/something-new' });
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
  });
});
