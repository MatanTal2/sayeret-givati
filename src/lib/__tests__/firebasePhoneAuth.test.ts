import {
  signInWithPhoneNumber,
  linkWithCredential,
  EmailAuthProvider,
  PhoneAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  updatePassword,
  updatePhoneNumber,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  sendPhoneOtp,
  confirmPhoneOtp,
  linkEmailPassword,
  sendVerificationEmail,
  sendPasswordReset,
  mapFirebaseAuthError,
  changePassword,
  reauthEmailPassword,
  applyVerifiedPhoneCredential,
  RequiresRecentLoginError,
} from '../firebasePhoneAuth';

const mockSignIn = signInWithPhoneNumber as jest.MockedFunction<typeof signInWithPhoneNumber>;
const mockLink = linkWithCredential as jest.MockedFunction<typeof linkWithCredential>;
const mockCredential = EmailAuthProvider.credential as jest.MockedFunction<typeof EmailAuthProvider.credential>;
const mockSendEmailVerification = sendEmailVerification as jest.MockedFunction<typeof sendEmailVerification>;
const mockSendPasswordReset = sendPasswordResetEmail as jest.MockedFunction<typeof sendPasswordResetEmail>;
const mockReauthenticate = reauthenticateWithCredential as jest.MockedFunction<typeof reauthenticateWithCredential>;
const mockUpdatePassword = updatePassword as jest.MockedFunction<typeof updatePassword>;
const mockUpdatePhoneNumber = updatePhoneNumber as jest.MockedFunction<typeof updatePhoneNumber>;
const mockPhoneCredential = PhoneAuthProvider.credential as jest.MockedFunction<typeof PhoneAuthProvider.credential>;
const mockAuth = auth as unknown as { currentUser: unknown };

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

  describe('changePassword', () => {
    afterEach(() => {
      mockAuth.currentUser = null;
    });

    it('re-authenticates and updates the password', async () => {
      mockAuth.currentUser = { email: 'a@b.c' };
      mockCredential.mockReturnValue({ email: 'a@b.c', password: 'old' } as ReturnType<typeof EmailAuthProvider.credential>);
      mockReauthenticate.mockResolvedValue({} as Awaited<ReturnType<typeof reauthenticateWithCredential>>);
      mockUpdatePassword.mockResolvedValue();

      await changePassword('old', 'new');

      expect(mockCredential).toHaveBeenCalledWith('a@b.c', 'old');
      expect(mockReauthenticate).toHaveBeenCalled();
      expect(mockUpdatePassword).toHaveBeenCalledWith({ email: 'a@b.c' }, 'new');
    });

    it('throws when there is no signed-in user', async () => {
      mockAuth.currentUser = null;
      await expect(changePassword('a', 'b')).rejects.toThrow(/authenticated/);
    });

    it('translates auth/requires-recent-login into RequiresRecentLoginError', async () => {
      mockAuth.currentUser = { email: 'a@b.c' };
      mockCredential.mockReturnValue({ email: 'a@b.c', password: 'old' } as ReturnType<typeof EmailAuthProvider.credential>);
      mockReauthenticate.mockRejectedValue({ code: 'auth/requires-recent-login' });

      await expect(changePassword('old', 'new')).rejects.toBeInstanceOf(RequiresRecentLoginError);
      expect(mockUpdatePassword).not.toHaveBeenCalled();
    });

    it('propagates auth/wrong-password from re-auth', async () => {
      mockAuth.currentUser = { email: 'a@b.c' };
      mockCredential.mockReturnValue({ email: 'a@b.c', password: 'old' } as ReturnType<typeof EmailAuthProvider.credential>);
      mockReauthenticate.mockRejectedValue({ code: 'auth/wrong-password' });

      await expect(changePassword('old', 'new')).rejects.toMatchObject({ code: 'auth/wrong-password' });
      expect(mockUpdatePassword).not.toHaveBeenCalled();
    });
  });

  describe('reauthEmailPassword', () => {
    afterEach(() => {
      mockAuth.currentUser = null;
    });

    it('re-authenticates with email + current password', async () => {
      mockAuth.currentUser = { email: 'a@b.c' };
      mockCredential.mockReturnValue({ email: 'a@b.c', password: 'pw' } as ReturnType<typeof EmailAuthProvider.credential>);
      mockReauthenticate.mockResolvedValue({} as Awaited<ReturnType<typeof reauthenticateWithCredential>>);

      await reauthEmailPassword('pw');

      expect(mockCredential).toHaveBeenCalledWith('a@b.c', 'pw');
      expect(mockReauthenticate).toHaveBeenCalled();
    });

    it('throws RequiresRecentLoginError when re-auth is stale', async () => {
      mockAuth.currentUser = { email: 'a@b.c' };
      mockCredential.mockReturnValue({ email: 'a@b.c', password: 'pw' } as ReturnType<typeof EmailAuthProvider.credential>);
      mockReauthenticate.mockRejectedValue({ code: 'auth/requires-recent-login' });

      await expect(reauthEmailPassword('pw')).rejects.toBeInstanceOf(RequiresRecentLoginError);
    });

    it('throws when there is no signed-in user', async () => {
      mockAuth.currentUser = null;
      await expect(reauthEmailPassword('pw')).rejects.toThrow(/authenticated/);
    });
  });

  describe('applyVerifiedPhoneCredential', () => {
    afterEach(() => {
      mockAuth.currentUser = null;
    });

    it('updates phone, reloads, and returns a fresh idToken', async () => {
      const getIdToken = jest.fn().mockResolvedValue('fresh-id-token');
      const reload = jest.fn().mockResolvedValue(undefined);
      mockAuth.currentUser = { reload, getIdToken };
      mockPhoneCredential.mockReturnValue({ verificationId: 'v1', code: '123456' } as ReturnType<typeof PhoneAuthProvider.credential>);
      mockUpdatePhoneNumber.mockResolvedValue(undefined);

      const token = await applyVerifiedPhoneCredential('v1', '123456');

      expect(mockPhoneCredential).toHaveBeenCalledWith('v1', '123456');
      expect(mockUpdatePhoneNumber).toHaveBeenCalled();
      expect(reload).toHaveBeenCalled();
      expect(getIdToken).toHaveBeenCalledWith(true);
      expect(token).toBe('fresh-id-token');
    });

    it('throws when there is no signed-in user', async () => {
      mockAuth.currentUser = null;
      await expect(applyVerifiedPhoneCredential('v1', '123456')).rejects.toThrow(/authenticated/);
    });
  });

  describe('mapFirebaseAuthError', () => {
    it.each([
      ['auth/invalid-phone-number', 'מספר טלפון'],
      ['auth/invalid-verification-code', 'אימות'],
      ['auth/code-expired', 'אימות'],
      ['auth/captcha-check-failed', 'reCAPTCHA'],
      ['auth/too-many-requests', 'יותר מדי'],
      ['auth/email-already-in-use', 'משויכת'],
      ['auth/credential-already-in-use', 'משויך לחשבון אחר'],
      ['auth/weak-password', 'חלשה'],
      ['auth/invalid-email', 'תקינה'],
      ['auth/wrong-password', 'שגויה'],
      ['auth/invalid-credential', 'שגויה'],
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
