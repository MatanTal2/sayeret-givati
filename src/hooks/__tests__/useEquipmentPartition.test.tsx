/**
 * @jest-environment jsdom
 *
 * Regression guard for bug #25: RETIRED equipment must split off into a
 * separate `archivedEquipment` bucket so it doesn't clutter the active list.
 *
 * We test the partition logic at the hook boundary — feeding `rawEquipment`
 * through the listener path and asserting the two output buckets.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useEquipment } from '../useEquipment';
import { EquipmentService } from '@/lib/equipmentService';
import { EquipmentStatus, EquipmentCondition } from '@/types/equipment';
import { UserType } from '@/types/user';
import type { Equipment } from '@/types/equipment';

jest.mock('@/lib/equipmentService', () => ({
  EquipmentService: {
    Items: { subscribeEquipmentList: jest.fn() },
    Types: { subscribeEquipmentTypes: jest.fn() },
  },
}));

jest.mock('@/lib/firebase', () => ({
  auth: {
    onAuthStateChanged: (cb: (u: { uid: string } | null) => void) => {
      cb({ uid: 'user-x' });
      return () => {};
    },
    currentUser: { uid: 'user-x' },
  },
  db: {},
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    enhancedUser: {
      uid: 'user-x',
      userType: UserType.ADMIN, // admin sees all via canView
      teamId: 'team-a',
    },
  }),
}));

const nowTs = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp;

function makeEquipment(id: string, status: EquipmentStatus, over: Partial<Equipment> = {}): Equipment {
  return {
    id,
    equipmentType: 'rifle_m4',
    productName: 'Rifle M4',
    category: 'armory',
    signedBy: 'Alice',
    signedById: 'user-x',
    currentHolder: 'Alice',
    currentHolderId: 'user-x',
    holderTeamId: 'team-a',
    signerTeamId: 'team-a',
    photoUrl: '',
    status,
    condition: EquipmentCondition.GOOD,
    location: 'warehouse',
    acquisitionDate: nowTs,
    dateSigned: nowTs,
    lastSeen: nowTs,
    lastReportUpdate: nowTs,
    trackingHistory: [],
    createdAt: nowTs,
    updatedAt: nowTs,
    ...over,
  };
}

describe('useEquipment — active/archived partition (bug #25)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function primeListener(rows: Equipment[]) {
    (EquipmentService.Items.subscribeEquipmentList as jest.Mock).mockImplementation(
      (cb: (r: { success: true; equipments: Equipment[]; totalCount: number; hasMore: false }) => void) => {
        cb({ success: true, equipments: rows, totalCount: rows.length, hasMore: false });
        return () => {};
      },
    );
    (EquipmentService.Types.subscribeEquipmentTypes as jest.Mock).mockImplementation(
      (cb: (r: { success: true; equipmentTypes: []; totalCount: number }) => void) => {
        cb({ success: true, equipmentTypes: [], totalCount: 0 });
        return () => {};
      },
    );
  }

  it('splits RETIRED rows into archivedEquipment and out of the main list', async () => {
    primeListener([
      makeEquipment('EQ-active-1', EquipmentStatus.AVAILABLE),
      makeEquipment('EQ-stored', EquipmentStatus.STORED),
      makeEquipment('EQ-retired-1', EquipmentStatus.RETIRED),
      makeEquipment('EQ-retired-2', EquipmentStatus.RETIRED),
    ]);

    const { result } = renderHook(() => useEquipment({ scope: 'all' }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.equipment.map((e) => e.id).sort()).toEqual(['EQ-active-1', 'EQ-stored']);
    expect(result.current.archivedEquipment.map((e) => e.id).sort()).toEqual([
      'EQ-retired-1',
      'EQ-retired-2',
    ]);
  });

  it('returns empty archived list when nothing is retired', async () => {
    primeListener([
      makeEquipment('EQ-1', EquipmentStatus.AVAILABLE),
      makeEquipment('EQ-2', EquipmentStatus.STORED),
    ]);

    const { result } = renderHook(() => useEquipment({ scope: 'all' }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.archivedEquipment).toEqual([]);
    expect(result.current.equipment).toHaveLength(2);
  });

  it('STORED items stay in the active list (only RETIRED moves to archive)', async () => {
    primeListener([makeEquipment('EQ-stored-only', EquipmentStatus.STORED)]);

    const { result } = renderHook(() => useEquipment({ scope: 'all' }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.equipment).toHaveLength(1);
    expect(result.current.equipment[0].status).toBe(EquipmentStatus.STORED);
    expect(result.current.archivedEquipment).toEqual([]);
  });
});
