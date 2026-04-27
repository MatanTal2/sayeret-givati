/**
 * Phase 3 — ammunitionInventoryService validation tests.
 */

jest.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    now: () => ({ toDate: () => new Date(), seconds: 0, nanoseconds: 0 }),
    fromDate: (d: Date) => ({ toDate: () => d, seconds: 0, nanoseconds: 0 }),
  },
  FieldValue: {
    serverTimestamp: () => 'SERVER_TIMESTAMP',
  },
}));

jest.mock('firebase-admin/app', () => ({
  initializeApp: () => ({}),
  getApps: () => [],
  cert: () => ({}),
  applicationDefault: () => ({}),
}));

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: jest.fn(() => {
    throw new Error('Test reached admin DB without setting up a fake');
  }),
}));

import {
  validateUpsertStockInput,
  validateCreateSerialItemInput,
  serverUpsertAmmunitionStock,
  serverCreateSerialItem,
  serverListAmmunitionStock,
  serverListSerialItems,
  canMutateAmmunitionInventory,
} from '@/lib/db/server/ammunitionInventoryService';
import { UserType } from '@/types/user';
import type { AmmunitionType } from '@/types/ammunition';

const stubActor = (over: Partial<{ uid: string; userType: UserType; teamId?: string }> = {}) => ({
  uid: over.uid ?? 'u1',
  userType: over.userType ?? UserType.USER,
  teamId: over.teamId,
});

const stubTemplate: AmmunitionType = {
  id: 't1',
  name: 'Test',
  subcategory: 'BULLETS',
  allocation: 'TEAM',
  trackingMode: 'BRUCE',
  securityLevel: 'EXPLOSIVE',
  bulletsPerCardboard: 30,
  cardboardsPerBruce: 33,
  totalBulletsPerBruce: 990,
  status: 'CANONICAL',
  // unused server-generated fields
  createdAt: undefined as unknown as never,
  updatedAt: undefined as unknown as never,
  createdBy: 'admin',
};

describe('validateUpsertStockInput', () => {
  const base = {
    actor: stubActor(),
    templateId: 't1',
    holderType: 'TEAM',
    holderId: 'team-a',
    bruceCount: 5,
  };

  it('accepts a well-formed BRUCE input', () => {
    const out = validateUpsertStockInput(base);
    expect(out.bruceCount).toBe(5);
  });

  it('rejects empty input', () => {
    expect(() => validateUpsertStockInput(undefined)).toThrow(/input is required/);
  });

  it('rejects missing templateId', () => {
    expect(() => validateUpsertStockInput({ ...base, templateId: '' })).toThrow(
      /templateId is required/
    );
  });

  it('rejects bad holderType', () => {
    expect(() => validateUpsertStockInput({ ...base, holderType: 'NOPE' })).toThrow(
      /holderType must be USER or TEAM/
    );
  });

  it('rejects negative bruceCount', () => {
    expect(() => validateUpsertStockInput({ ...base, bruceCount: -1 })).toThrow(
      /non-negative/
    );
  });

  it('rejects bad openBruceState', () => {
    expect(() =>
      validateUpsertStockInput({ ...base, openBruceState: 'WHAT' })
    ).toThrow(/openBruceState must be/);
  });
});

describe('validateCreateSerialItemInput', () => {
  it('rejects missing serial', () => {
    expect(() =>
      validateCreateSerialItemInput({
        actor: stubActor(),
        templateId: 't1',
        holderType: 'TEAM',
        holderId: 'team-a',
      })
    ).toThrow(/serial is required/);
  });

  it('trims and accepts well-formed input', () => {
    const out = validateCreateSerialItemInput({
      actor: stubActor(),
      serial: '  צ-12345  ',
      templateId: 't1',
      holderType: 'USER',
      holderId: 'u1',
    });
    expect(out.serial).toBe('צ-12345');
  });
});

describe('canMutateAmmunitionInventory', () => {
  // canMutateAmmunitionInventory may call into admin DB via getResponsibleManagerId / userTeamId
  // when the actor is below MANAGER. The mocked admin DB throws, so for those branches
  // we use a manager+ actor where the DB is never consulted.

  it('allows MANAGER for any holder', async () => {
    const allowed = await canMutateAmmunitionInventory({
      actor: stubActor({ userType: UserType.MANAGER }),
      template: stubTemplate,
      holderType: 'TEAM',
      holderId: 'team-z',
    });
    expect(allowed).toBe(true);
  });

  it('allows ADMIN for any holder', async () => {
    const allowed = await canMutateAmmunitionInventory({
      actor: stubActor({ userType: UserType.ADMIN }),
      template: stubTemplate,
      holderType: 'USER',
      holderId: 'someone-else',
    });
    expect(allowed).toBe(true);
  });

  it('allows SYSTEM_MANAGER for any holder', async () => {
    const allowed = await canMutateAmmunitionInventory({
      actor: stubActor({ userType: UserType.SYSTEM_MANAGER }),
      template: stubTemplate,
      holderType: 'TEAM',
      holderId: 'team-zzz',
    });
    expect(allowed).toBe(true);
  });
});

describe('admin DB reach (proves validation passed)', () => {
  it('serverListAmmunitionStock', async () => {
    await expect(serverListAmmunitionStock()).rejects.toThrow(/Test reached admin DB/);
  });

  it('serverListSerialItems', async () => {
    await expect(serverListSerialItems()).rejects.toThrow(/Test reached admin DB/);
  });

  it('serverUpsertAmmunitionStock with manager actor reaches admin DB after passing template fetch', async () => {
    await expect(
      serverUpsertAmmunitionStock({
        actor: stubActor({ userType: UserType.MANAGER }),
        templateId: 't1',
        holderType: 'TEAM',
        holderId: 'team-a',
        bruceCount: 5,
      })
    ).rejects.toThrow(/Test reached admin DB/);
  });

  it('serverCreateSerialItem with manager actor reaches admin DB', async () => {
    await expect(
      serverCreateSerialItem({
        actor: stubActor({ userType: UserType.MANAGER }),
        serial: 'X-1',
        templateId: 't1',
        holderType: 'TEAM',
        holderId: 'team-a',
      })
    ).rejects.toThrow(/Test reached admin DB/);
  });
});
