export const db = {};
// Per Firebase phone-auth docs, set appVerificationDisabledForTesting on the
// auth settings object so component tests can simulate OTP without invoking
// real reCAPTCHA. Fictional test phone numbers configured in Firebase Console
// will resolve without sending an SMS.
export const auth = {
  currentUser: null,
  settings: { appVerificationDisabledForTesting: true },
};
export const app = {};

// firebase/app
export const getApps = () => [];
export const initializeApp = () => ({});

// firebase/firestore
export const getFirestore = () => ({});
export const collection = jest.fn();
export const doc = jest.fn();
export const getDoc = jest.fn();
export const getDocs = jest.fn();
export const setDoc = jest.fn();
export const updateDoc = jest.fn();
export const deleteDoc = jest.fn();
export const query = jest.fn();
export const where = jest.fn();
export const limit = jest.fn();
export const orderBy = jest.fn();
export const serverTimestamp = jest.fn(() => ({ __serverTimestamp: true }));
export const Timestamp = {
  now: jest.fn(() => ({ toDate: () => new Date(), seconds: 0, nanoseconds: 0 })),
  fromDate: jest.fn((d: Date) => ({ toDate: () => d, seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 })),
};
export const FieldValue = { serverTimestamp: () => ({ __serverTimestamp: true }) };

// firebase/auth
export const getAuth = () => auth;
export const signInWithEmailAndPassword = jest.fn();
export const createUserWithEmailAndPassword = jest.fn();
export const signOut = jest.fn();
export const onAuthStateChanged = jest.fn();
export const sendPasswordResetEmail = jest.fn();
export const sendEmailVerification = jest.fn();
export const linkWithCredential = jest.fn();
export const signInWithPhoneNumber = jest.fn();

export class RecaptchaVerifier {
  constructor() {}
  clear() {}
  render() {
    return Promise.resolve(0);
  }
}

export const EmailAuthProvider = {
  credential: jest.fn((email: string, password: string) => ({ email, password })),
};

// firebase/storage
export const getStorage = () => ({});
