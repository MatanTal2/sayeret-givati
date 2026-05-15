'use client';

/**
 * IndexedDB-backed outbox for offline mutation replay.
 *
 * Browser-only. Server / SSR paths never touch this module — the index file
 * for offline-first imports it via dynamic import or guards with `typeof window`.
 *
 * Versioning (audit M4): bump `DB_VERSION` and extend the `upgrade` callback
 * for every schema change. Existing entries must survive the migration; a
 * test in `src/lib/offline/__tests__/outboxMigration.test.ts` (P5 follow-up)
 * gates this.
 *
 * See docs/spec/offline-first.md Phase 5 and docs/codebase/outbox.md.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export const DB_NAME = 'sayeret-offline';
export const DB_VERSION = 1;
export const STORE = 'outbox';

export type OutboxStatus =
  | 'pending'
  | 'replaying'
  | 'awaiting_auth'
  | 'conflict'
  | 'poisoned'
  | 'stuck'
  | 'synced';

export interface OutboxEntry {
  /** Auto-increment key. Set after `add`. */
  id?: number;
  /** UID that enqueued the entry. Queue is UID-tagged so shared-device sign-outs surface correctly. */
  uid: string;
  /** HTTP method — POST/PUT/PATCH/DELETE only. */
  method: string;
  /** Absolute path of the request (e.g. `/api/equipment/transfer`). */
  url: string;
  /** Serialized headers; rebuilt at replay time. ID token is NEVER stored. */
  headers: Record<string, string>;
  /** Raw body text (already JSON-stringified by the caller). */
  body: string;
  /** Idempotency key reused across retries so server-side dedupe works. */
  idempotencyKey: string;
  /** Allowlisted route name (e.g. `equipment.transfer`) for indexer / metrics. */
  routeName: string;
  status: OutboxStatus;
  /** Epoch ms. */
  createdAt: number;
  /** Number of replay attempts. */
  attempts: number;
  /** Epoch ms; backoff target. */
  nextAttemptAt: number;
  lastError?: string;
  /** Resource identifier for chained-If-Match rewriting (M3). */
  resourceKey?: string;
  /** Conflict resolution state (P6 will set this). */
  conflictState?: {
    detectedAt: number;
    serverData?: unknown;
  };
}

interface OfflineSchema extends DBSchema {
  [STORE]: {
    key: number;
    value: OutboxEntry;
    indexes: {
      'by-uid-status': [string, OutboxStatus];
      'by-uid-resource': [string, string];
    };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineSchema>> | null = null;

function openOutbox(): Promise<IDBPDatabase<OfflineSchema>> {
  if (typeof window === 'undefined') {
    throw new Error('Outbox is browser-only (called from a non-browser context)');
  }
  if (!dbPromise) {
    dbPromise = openDB<OfflineSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('by-uid-status', ['uid', 'status']);
          store.createIndex('by-uid-resource', ['uid', 'resourceKey']);
        }
        // future: if (oldVersion < 2) { ... } — see docs/spec/offline-first.md M4.
      },
    });
  }
  return dbPromise;
}

export async function enqueue(entry: Omit<OutboxEntry, 'id' | 'status' | 'createdAt' | 'attempts' | 'nextAttemptAt'>): Promise<number> {
  const db = await openOutbox();
  const now = Date.now();
  const full: OutboxEntry = {
    status: 'pending',
    createdAt: now,
    attempts: 0,
    nextAttemptAt: now,
    ...entry,
  };
  const id = await db.add(STORE, full);
  notifyChange();
  return id as number;
}

export async function listAll(): Promise<OutboxEntry[]> {
  const db = await openOutbox();
  return db.getAll(STORE);
}

export async function listForUid(uid: string): Promise<OutboxEntry[]> {
  const db = await openOutbox();
  const all = await db.getAll(STORE);
  return all.filter((e) => e.uid === uid);
}

export async function listPendingForUid(uid: string, now = Date.now()): Promise<OutboxEntry[]> {
  const items = await listForUid(uid);
  return items
    .filter((e) => (e.status === 'pending' || e.status === 'awaiting_auth') && e.nextAttemptAt <= now)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function updateById(id: number, patch: Partial<OutboxEntry>): Promise<void> {
  const db = await openOutbox();
  const existing = await db.get(STORE, id);
  if (!existing) return;
  await db.put(STORE, { ...existing, ...patch, id });
  notifyChange();
}

export async function removeById(id: number): Promise<void> {
  const db = await openOutbox();
  await db.delete(STORE, id);
  notifyChange();
}

export async function findNextOnResource(uid: string, resourceKey: string, afterId: number): Promise<OutboxEntry | undefined> {
  const all = await listForUid(uid);
  return all
    .filter((e) => e.resourceKey === resourceKey && typeof e.id === 'number' && e.id > afterId)
    .sort((a, b) => (a.id! - b.id!))[0];
}

/**
 * Pub-sub for context subscribers. Fires after any mutation to the store.
 * No payload — listeners re-read what they need.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyChange() {
  listeners.forEach((l) => {
    try { l(); } catch (e) { console.warn('[outbox] listener failed', e); }
  });
}
