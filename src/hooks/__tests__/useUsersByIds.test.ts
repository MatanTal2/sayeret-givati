/**
 * @jest-environment jsdom
 *
 * Coverage for the chunked `documentId() in [...]` resolution behind
 * `useUsersByIds`. The hook is the only piece between the recipient list and
 * the rendered name, so the contract that matters is:
 *
 *   - empty input -> empty map, never reads Firestore
 *   - dedupes uids before reading
 *   - chunks at the 10-doc Firestore `in` limit
 *   - shape of the returned map matches `{ uid: string; displayName }`
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useUsersByIds } from '../useUsersByIds';

const mockGetDocs = jest.fn();
const mockWhere = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ _kind: 'collection' })),
  query: jest.fn((c, ...rest) => ({ _kind: 'query', collection: c, where: rest })),
  where: (...args: unknown[]) => {
    mockWhere(...args);
    return { _kind: 'where', args };
  },
  documentId: jest.fn(() => '__name__'),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

function fakeSnapshot(docs: Array<{ id: string; firstName?: string; lastName?: string }>) {
  return {
    docs: docs.map((d) => ({
      id: d.id,
      data: () => ({ firstName: d.firstName, lastName: d.lastName }),
    })),
  };
}

describe('useUsersByIds', () => {
  beforeEach(() => {
    mockGetDocs.mockReset();
    mockWhere.mockReset();
  });

  it('returns an empty map and skips Firestore when input is empty', async () => {
    const { result } = renderHook(() => useUsersByIds([]));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.users).toEqual({});
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('resolves a single small batch in one query', async () => {
    mockGetDocs.mockResolvedValueOnce(
      fakeSnapshot([
        { id: 'u1', firstName: 'דנה', lastName: 'כהן' },
        { id: 'u2', firstName: 'יואב', lastName: 'לוי' },
      ])
    );

    const { result } = renderHook(() => useUsersByIds(['u1', 'u2']));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetDocs).toHaveBeenCalledTimes(1);
    expect(result.current.users).toEqual({
      u1: { uid: 'u1', displayName: 'דנה כהן' },
      u2: { uid: 'u2', displayName: 'יואב לוי' },
    });
  });

  it('falls back to uid when no name is stored', async () => {
    mockGetDocs.mockResolvedValueOnce(fakeSnapshot([{ id: 'u1' }]));
    const { result } = renderHook(() => useUsersByIds(['u1']));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.users).toEqual({ u1: { uid: 'u1', displayName: 'u1' } });
  });

  it('dedupes uids before reading', async () => {
    mockGetDocs.mockResolvedValueOnce(
      fakeSnapshot([{ id: 'u1', firstName: 'A', lastName: 'B' }])
    );
    const { result } = renderHook(() => useUsersByIds(['u1', 'u1', '  ', '']));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetDocs).toHaveBeenCalledTimes(1);
    // The single where-call should include exactly one uid in its `in` list.
    expect(mockWhere).toHaveBeenCalledTimes(1);
    expect(mockWhere.mock.calls[0][2]).toEqual(['u1']);
  });

  it('chunks at the 10-uid Firestore `in` limit', async () => {
    const ids = Array.from({ length: 23 }, (_, i) => `u${i}`);
    mockGetDocs.mockImplementation(async () =>
      fakeSnapshot([{ id: 'u0', firstName: 'X', lastName: 'Y' }])
    );

    const { result } = renderHook(() => useUsersByIds(ids));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 23 ids → chunks of 10 + 10 + 3 → 3 queries.
    expect(mockGetDocs).toHaveBeenCalledTimes(3);
    expect(mockWhere).toHaveBeenCalledTimes(3);
    const chunkLengths = mockWhere.mock.calls.map(
      (call) => (call[2] as string[]).length
    );
    // Sort because dedup-sort may reorder vs original input order.
    expect(chunkLengths.sort((a, b) => b - a)).toEqual([10, 10, 3]);
  });

  it('reports load errors without throwing', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useUsersByIds(['u1']));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toMatch(/network/);
    expect(result.current.users).toEqual({});
  });
});
