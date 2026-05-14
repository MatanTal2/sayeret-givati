/**
 * Tests for `serverPurgeCredentialAuditLog`. Verifies paged deletion, dry-run,
 * the maxDeletes cap (truncated flag), retention-window math, idempotence on
 * an empty page, and batch-failure bail-out.
 *
 * The Firestore mock here is per-test — each test seeds its own `pages` array
 * and the query `.get()` returns the next page, simulating the implementation
 * pattern where the next iteration's `where('timestamp', '<', cutoff)` query
 * automatically returns the next batch once the previous batch is deleted.
 */

jest.mock('firebase-admin/firestore', () => {
  class FakeTimestamp {
    constructor(public ms: number) {}
    static fromMillis(ms: number) {
      return new FakeTimestamp(ms);
    }
    toMillis() {
      return this.ms;
    }
  }
  return {
    FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
    Timestamp: FakeTimestamp,
  };
});

jest.mock('firebase-admin/app', () => ({
  initializeApp: () => ({}),
  getApps: () => [],
  cert: () => ({}),
  applicationDefault: () => ({}),
}));

interface FakeDoc {
  id: string;
  ref: { id: string };
}

interface QueryState {
  pages: FakeDoc[][];
  pageIdx: number;
  deletedIds: string[];
  batchCommitShouldThrow: boolean;
  batchCommitCalls: number;
  limits: number[];
}

const state: QueryState = {
  pages: [],
  pageIdx: 0,
  deletedIds: [],
  batchCommitShouldThrow: false,
  batchCommitCalls: 0,
  limits: [],
};

const queryChain = () => ({
  where: (_field: string, _op: string, _value: unknown) => queryChain(),
  orderBy: (_field: string, _direction: string) => queryChain(),
  limit: (n: number) => {
    state.limits.push(n);
    return {
      get: async () => {
        if (state.pageIdx >= state.pages.length) return { empty: true, size: 0, docs: [] };
        const docs = state.pages[state.pageIdx];
        state.pageIdx += 1;
        // Clamp the returned page to the requested limit, matching real Firestore.
        const truncated = docs.slice(0, n);
        return { empty: truncated.length === 0, size: truncated.length, docs: truncated };
      },
    };
  },
});

const collectionMock = jest.fn(() => queryChain());

const batchMock = () => {
  const pending: string[] = [];
  return {
    delete: (ref: { id: string }) => {
      pending.push(ref.id);
    },
    commit: async () => {
      state.batchCommitCalls += 1;
      if (state.batchCommitShouldThrow) throw new Error('boom');
      state.deletedIds.push(...pending);
    },
  };
};

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: jest.fn(() => ({
    collection: collectionMock,
    batch: batchMock,
  })),
}));

import {
  serverPurgeCredentialAuditLog,
  CREDENTIAL_AUDIT_RETENTION_DAYS,
} from '../credentialAuditService';

beforeEach(() => {
  state.pages = [];
  state.pageIdx = 0;
  state.deletedIds = [];
  state.batchCommitShouldThrow = false;
  state.batchCommitCalls = 0;
  state.limits = [];
  collectionMock.mockClear();
});

function pageOf(ids: string[]): FakeDoc[] {
  return ids.map((id) => ({ id, ref: { id } }));
}

describe('serverPurgeCredentialAuditLog', () => {
  it('default retention is 365 days', () => {
    expect(CREDENTIAL_AUDIT_RETENTION_DAYS).toBe(365);
  });

  it('returns zero counts when nothing is past cutoff', async () => {
    state.pages = []; // empty result
    const result = await serverPurgeCredentialAuditLog();
    expect(result).toMatchObject({
      examined: 0,
      deleted: 0,
      failed: 0,
      dryRun: false,
      truncated: false,
      ageDays: 365,
    });
    expect(state.batchCommitCalls).toBe(0);
  });

  it('deletes a full page and stops when the next page is empty', async () => {
    state.pages = [pageOf(['a1', 'a2', 'a3'])];
    const result = await serverPurgeCredentialAuditLog({ ageDays: 30 });
    expect(state.deletedIds).toEqual(['a1', 'a2', 'a3']);
    expect(result.deleted).toBe(3);
    expect(result.examined).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.truncated).toBe(false);
    expect(result.ageDays).toBe(30);
    expect(state.batchCommitCalls).toBe(1);
  });

  it('iterates multiple pages until empty', async () => {
    state.pages = [pageOf(['a1', 'a2']), pageOf(['a3', 'a4']), pageOf(['a5'])];
    const result = await serverPurgeCredentialAuditLog();
    expect(state.deletedIds).toEqual(['a1', 'a2', 'a3', 'a4', 'a5']);
    expect(result.deleted).toBe(5);
    expect(result.truncated).toBe(false);
  });

  it('dry-run examines without committing batches', async () => {
    state.pages = [pageOf(['a1', 'a2']), pageOf(['a3'])];
    const result = await serverPurgeCredentialAuditLog({ dryRun: true });
    expect(state.deletedIds).toEqual([]); // nothing actually deleted
    expect(state.batchCommitCalls).toBe(0);
    expect(result.deleted).toBe(3); // dry-run still reports the planned count
    expect(result.dryRun).toBe(true);
    expect(result.examined).toBe(3);
  });

  it('honours maxDeletes cap and reports truncated=true', async () => {
    // Two real pages exist, but maxDeletes=3 should clamp the second page's
    // limit to 1 doc and then stop without asking for another page.
    state.pages = [pageOf(['a1', 'a2']), pageOf(['a3', 'a4', 'a5']), pageOf(['a6'])];
    const result = await serverPurgeCredentialAuditLog({ maxDeletes: 3 });
    expect(result.deleted).toBe(3);
    expect(result.truncated).toBe(true);
    expect(state.deletedIds).toEqual(['a1', 'a2', 'a3']);
    // The limit passed to the second page must be remaining=1, not 500.
    expect(state.limits).toEqual([3, 1]);
  });

  it('bails out on batch commit failure without spinning retries', async () => {
    state.pages = [pageOf(['a1', 'a2']), pageOf(['a3'])];
    state.batchCommitShouldThrow = true;
    const result = await serverPurgeCredentialAuditLog();
    expect(result.failed).toBe(2);
    expect(result.deleted).toBe(0);
    expect(state.batchCommitCalls).toBe(1); // did not retry second page
  });

  it('cutoff is now - ageDays', async () => {
    state.pages = [];
    const now = new Date('2026-05-14T00:00:00Z');
    const result = await serverPurgeCredentialAuditLog({ ageDays: 10, now });
    const cutoff = new Date(result.cutoff).getTime();
    expect(now.getTime() - cutoff).toBe(10 * 24 * 60 * 60 * 1000);
  });
});
