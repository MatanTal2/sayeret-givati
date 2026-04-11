import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let _app: App | null = null;

function getAdminApp(): App {
  if (_app) return _app;

  const existing = getApps();
  if (existing.length > 0) {
    _app = existing[0];
    return _app;
  }

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set');
  }

  let credentials: Record<string, string>;
  try {
    credentials = JSON.parse(serviceAccountJson);
  } catch {
    try {
      credentials = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf-8'));
    } catch {
      throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON — must be JSON or base64-encoded JSON');
    }
  }

  _app = initializeApp({
    credential: cert(credentials as Parameters<typeof cert>[0]),
  });
  return _app;
}

/**
 * Lazy-initialized Admin Firestore instance.
 * Only initializes on first access — not at import time.
 */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Lazy-initialized Admin Auth instance.
 * Only initializes on first access — not at import time.
 */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
