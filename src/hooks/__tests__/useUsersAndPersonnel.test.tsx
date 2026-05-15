/**
 * @jest-environment jsdom
 *
 * Regression guard: the management UsersTab `team` column showed "כללי"
 * (general — the SOLDIER role-bucket fallback) for every soldier even when
 * the underlying `users.teamId` was populated. Root cause was a blind call
 * to `teamFromRole(role)` that ignored the real Firestore field. This hook
 * now prefers `userDoc.teamId` / `data.teamId` and only falls back to the
 * role bucket when the field is missing/blank.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useUsersAndPersonnel } from '../useUsersAndPersonnel';
import { UserRole } from '@/types/equipment';

const mockGetDocs = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ id: 'col' })),
  query: jest.fn((c) => c),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

function fakeSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
  };
}

describe('useUsersAndPersonnel — team resolution', () => {
  beforeEach(() => {
    mockGetDocs.mockReset();
  });

  it('uses users.teamId when present (registered user)', async () => {
    const usersSnap = fakeSnapshot([
      {
        id: 'u1',
        data: {
          uid: 'u1',
          email: 'a@b.com',
          firstName: 'דנה',
          lastName: 'כהן',
          phoneNumber: '+972500000001',
          rank: 'רב טוראי',
          role: UserRole.SOLDIER,
          militaryPersonalNumberHash: 'h1',
          teamId: 'מסייעת א',
          status: 'active',
        },
      },
    ]);
    const personnelSnap = fakeSnapshot([
      {
        id: 'h1',
        data: {
          firstName: 'דנה',
          lastName: 'כהן',
          militaryPersonalNumberHash: 'h1',
          approvedRole: UserRole.SOLDIER,
          registered: true,
          status: 'active',
        },
      },
    ]);
    mockGetDocs.mockResolvedValueOnce(usersSnap).mockResolvedValueOnce(personnelSnap);

    const { result } = renderHook(() => useUsersAndPersonnel());
    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    expect(result.current.rows[0].team).toBe('מסייעת א');
  });

  it('falls back to the role-bucket when teamId is empty', async () => {
    const usersSnap = fakeSnapshot([
      {
        id: 'u2',
        data: {
          uid: 'u2',
          email: 'b@c.com',
          firstName: 'נועה',
          lastName: 'לוי',
          phoneNumber: '+972500000002',
          rank: 'טוראי',
          role: UserRole.SOLDIER,
          militaryPersonalNumberHash: 'h2',
          teamId: '   ', // blank → fallback
          status: 'active',
        },
      },
    ]);
    const personnelSnap = fakeSnapshot([
      {
        id: 'h2',
        data: {
          firstName: 'נועה',
          lastName: 'לוי',
          militaryPersonalNumberHash: 'h2',
          approvedRole: UserRole.SOLDIER,
          registered: true,
          status: 'active',
        },
      },
    ]);
    mockGetDocs.mockResolvedValueOnce(usersSnap).mockResolvedValueOnce(personnelSnap);

    const { result } = renderHook(() => useUsersAndPersonnel());
    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    expect(result.current.rows[0].team).toBe('כללי');
  });

  it('unregistered personnel row falls back to role-bucket (no teamId on personnel docs)', async () => {
    const usersSnap = fakeSnapshot([]);
    const personnelSnap = fakeSnapshot([
      {
        id: 'h3',
        data: {
          firstName: 'יואב',
          lastName: 'מזרחי',
          militaryPersonalNumberHash: 'h3',
          approvedRole: UserRole.TEAM_LEADER,
          registered: false,
          status: 'active',
        },
      },
    ]);
    mockGetDocs.mockResolvedValueOnce(usersSnap).mockResolvedValueOnce(personnelSnap);

    const { result } = renderHook(() => useUsersAndPersonnel());
    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    expect(result.current.rows[0].team).toBe('מפקדי צוות');
    expect(result.current.rows[0].registered).toBe(false);
  });
});
