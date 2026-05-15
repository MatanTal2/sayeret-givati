import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  type Firestore,
} from "firebase/firestore";
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

// Browser path uses an IndexedDB-backed persistent cache so reads survive
// reloads and serve while offline (P1 of offline-first migration —
// docs/spec/offline-first.md). Server / SSR path falls back to in-memory.
// `persistentSingleTabManager({ forceOwnership: false })` lets multi-tab use
// proceed; only one tab owns the writer at a time, others read.
function initDb(firebaseApp: FirebaseApp): Firestore {
  if (typeof window === 'undefined') {
    return getFirestore(firebaseApp);
  }
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({ forceOwnership: false }),
      }),
    });
  } catch {
    // HMR / second import after the app was already initialized once.
    return getFirestore(firebaseApp);
  }
}

export const db = initDb(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// App Check — browser-only, no-op when site key is missing (logs a warning).
// Must run AFTER the core SDKs are initialized so the AppCheck instance can
// attach to the same Firebase app.
if (typeof window !== 'undefined') {
  ensureAppCheckInitialized();
}

export default app;
