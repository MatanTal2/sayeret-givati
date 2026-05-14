import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { ensureAppCheckInitialized } from "./appCheck";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firestore, Auth, and Storage
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// App Check — browser-only, no-op when site key is missing (logs a warning).
// Must run AFTER the core SDKs are initialized so the AppCheck instance can
// attach to the same Firebase app.
if (typeof window !== 'undefined') {
  ensureAppCheckInitialized();
}

export default app;
