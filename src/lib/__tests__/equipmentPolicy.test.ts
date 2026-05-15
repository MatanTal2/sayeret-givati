import {
  canAddEquipment,
  canApproveRetirementOversight,
  canBulkOps,
  canCreateCanonicalTemplate,
  canForceTransfer,
  canProposeTemplate,
  canRequestTemplate,
  canReport,
  canReportWithoutPhoto,
  canRetire,
  canRetireImmediately,
  canReviewTemplate,
  canTransfer,
  canView,
  canRequestExchange,
  canApproveExchange,
  canReplaceByAnother,
  canSendToStorage,
  canPullFromStorage,
  isAdmin,
  isHolder,
  isInTeam,
  isManagerOrAbove,
  isSelf,
  isSigner,
  isTeamLeaderOrAbove,
} from '@/lib/equipmentPolicy';
import type { Equipment } from '@/types/equipment';
import { EquipmentCondition, EquipmentStatus } from '@/types/equipment';
import type { EnhancedAuthUser } from '@/types/user';
import { UserType } from '@/types/user';

// Firebase is mocked in jest.config.js, so Timestamp isn't a real instance.
// Use a lightweight stub that satisfies the Equipment type's Timestamp fields.
const nowTsStub = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp;

/**
 * The policy module is consulted by both UI and server-side endpoints.
 * Every branch below exists to document an intentional decision — if a test
 * breaks, revisit the rule in the plan doc before loosening the check.
 */

const nowTs = nowTsStub;

function makeUser(overrides: Partial<EnhancedAuthUser>): EnhancedAuthUser {
  return {
    uid: 'user-x',
    userType: UserType.USER,
    teamId: 'team-a',
    ...overrides,
  } as EnhancedAuthUser;
}

function makeEquipment(overrides: Partial<Equipment>): Equipment {
  return {
    id: 'EQ-1',
    equipmentType: 'rifle_m4',
    productName: 'Rifle M4',
    category: 'armory',
    signedBy: 'Alice',
    signedById: 'user-signer',
    currentHolder: 'Alice',
    currentHolderId: 'user-signer',
    holderTeamId: 'team-a',
    signerTeamId: 'team-a',
    photoUrl: 'https://x/photo.jpg',
    status: EquipmentStatus.AVAILABLE,
    condition: EquipmentCondition.GOOD,
    location: 'warehouse',
    acquisitionDate: nowTs,
    dateSigned: nowTs,
    lastSeen: nowTs,
    lastReportUpdate: nowTs,
    trackingHistory: [],
    createdAt: nowTs,
    updatedAt: nowTs,
    ...overrides,
  };
}

describe('equipmentPolicy — role classifiers', () => {
  it('isAdmin recognizes admin only', () => {
    expect(isAdmin(makeUser({ userType: UserType.ADMIN }))).toBe(true);
    expect(isAdmin(makeUser({ userType: UserType.SYSTEM_MANAGER }))).toBe(false);
    expect(isAdmin(makeUser({ userType: UserType.USER }))).toBe(false);
  });

  it('isManagerOrAbove covers admin, system_manager, manager', () => {
    expect(isManagerOrAbove(makeUser({ userType: UserType.ADMIN }))).toBe(true);
    expect(isManagerOrAbove(makeUser({ userType: UserType.SYSTEM_MANAGER }))).toBe(true);
    expect(isManagerOrAbove(makeUser({ userType: UserType.MANAGER }))).toBe(true);
    expect(isManagerOrAbove(makeUser({ userType: UserType.TEAM_LEADER }))).toBe(false);
    expect(isManagerOrAbove(makeUser({ userType: UserType.USER }))).toBe(false);
  });

  it('isTeamLeaderOrAbove also includes TL', () => {
    expect(isTeamLeaderOrAbove(makeUser({ userType: UserType.TEAM_LEADER }))).toBe(true);
    expect(isTeamLeaderOrAbove(makeUser({ userType: UserType.MANAGER }))).toBe(true);
    expect(isTeamLeaderOrAbove(makeUser({ userType: UserType.USER }))).toBe(false);
  });
});

describe('equipmentPolicy — scope helpers', () => {
  it('isSigner matches signedById', () => {
    const user = makeUser({ uid: 'u1' });
    const equipment = makeEquipment({ signedById: 'u1', currentHolderId: 'u2' });
    expect(isSigner({ user, equipment })).toBe(true);
    expect(isHolder({ user, equipment })).toBe(false);
    expect(isSelf({ user, equipment })).toBe(true);
  });

  it('isHolder matches currentHolderId', () => {
    const user = makeUser({ uid: 'u2' });
    const equipment = makeEquipment({ signedById: 'u1', currentHolderId: 'u2' });
    expect(isHolder({ user, equipment })).toBe(true);
    expect(isSigner({ user, equipment })).toBe(false);
    expect(isSelf({ user, equipment })).toBe(true);
  });

  it('isInTeam matches holder or signer team', () => {
    const user = makeUser({ uid: 'outsider', teamId: 'team-b' });
    const eqHolder = makeEquipment({ holderTeamId: 'team-b', signerTeamId: 'team-x' });
    const eqSigner = makeEquipment({ holderTeamId: 'team-z', signerTeamId: 'team-b' });
    const eqNeither = makeEquipment({ holderTeamId: 'team-z', signerTeamId: 'team-x' });
    expect(isInTeam({ user, equipment: eqHolder })).toBe(true);
    expect(isInTeam({ user, equipment: eqSigner })).toBe(true);
    expect(isInTeam({ user, equipment: eqNeither })).toBe(false);
  });

  it('isInTeam returns false when user has no teamId', () => {
    const user = makeUser({ teamId: undefined });
    const equipment = makeEquipment({ holderTeamId: undefined, signerTeamId: undefined });
    expect(isInTeam({ user, equipment })).toBe(false);
  });

});

describe('equipmentPolicy — visibility (canView)', () => {
  it('manager sees everything', () => {
    const user = makeUser({ userType: UserType.MANAGER, uid: 'mgr', teamId: 'other' });
    const equipment = makeEquipment({ holderTeamId: 'x', signerTeamId: 'y' });
    expect(canView({ user, equipment })).toBe(true);
  });

  it('team leader sees their team only (no unit scope)', () => {
    const user = makeUser({ userType: UserType.TEAM_LEADER, uid: 'tl', teamId: 'team-a' });
    const equipment = makeEquipment({
      signedById: 'x', currentHolderId: 'y',
      holderTeamId: 'team-b', signerTeamId: 'team-b',
    });
    expect(canView({ user, equipment })).toBe(false);
  });

  it('regular user cannot see non-team, non-self items', () => {
    const user = makeUser({ userType: UserType.USER, uid: 'u', teamId: 'team-a' });
    const equipment = makeEquipment({
      signedById: 'other', currentHolderId: 'other',
      holderTeamId: 'team-b', signerTeamId: 'team-b',
    });
    expect(canView({ user, equipment })).toBe(false);
  });

  it('regular user sees their own item', () => {
    const user = makeUser({ uid: 'me' });
    const equipment = makeEquipment({ signedById: 'me', currentHolderId: 'me' });
    expect(canView({ user, equipment })).toBe(true);
  });

  it('regular user sees team items read-only', () => {
    const user = makeUser({ uid: 'me', teamId: 'team-a' });
    const equipment = makeEquipment({ signedById: 'x', currentHolderId: 'y', holderTeamId: 'team-a', signerTeamId: 'team-a' });
    expect(canView({ user, equipment })).toBe(true);
  });
});

describe('equipmentPolicy — reporting', () => {
  it('signer/holder can report', () => {
    const user = makeUser({ uid: 'u' });
    expect(canReport({ user, equipment: makeEquipment({ signedById: 'u', currentHolderId: 'other' }) })).toBe(true);
    expect(canReport({ user, equipment: makeEquipment({ signedById: 'other', currentHolderId: 'u' }) })).toBe(true);
  });

  it('team leader can report on team items', () => {
    const user = makeUser({ userType: UserType.TEAM_LEADER, uid: 'tl', teamId: 'team-a' });
    const eq = makeEquipment({ signedById: 'other', currentHolderId: 'other', holderTeamId: 'team-a', signerTeamId: 'team-a' });
    expect(canReport({ user, equipment: eq })).toBe(true);
  });

  it('regular user cannot report on team items they do not hold', () => {
    const user = makeUser({ userType: UserType.USER, uid: 'u', teamId: 'team-a' });
    const eq = makeEquipment({ signedById: 'other', currentHolderId: 'other', holderTeamId: 'team-a' });
    expect(canReport({ user, equipment: eq })).toBe(false);
  });

  it('manager can report on any item', () => {
    const user = makeUser({ userType: UserType.MANAGER, uid: 'mgr', teamId: 'other' });
    const eq = makeEquipment({ signedById: 'other', currentHolderId: 'other', holderTeamId: 'x' });
    expect(canReport({ user, equipment: eq })).toBe(true);
  });

  it('photo bypass gated to privileged roles', () => {
    expect(canReportWithoutPhoto(makeUser({ userType: UserType.USER }))).toBe(false);
    expect(canReportWithoutPhoto(makeUser({ userType: UserType.TEAM_LEADER }))).toBe(true);
    expect(canReportWithoutPhoto(makeUser({ userType: UserType.MANAGER }))).toBe(true);
    expect(canReportWithoutPhoto(makeUser({ userType: UserType.ADMIN }))).toBe(true);
  });
});

describe('equipmentPolicy — retirement', () => {
  it('only signer can retire', () => {
    const user = makeUser({ uid: 'u' });
    expect(canRetire({ user, equipment: makeEquipment({ signedById: 'u' }) })).toBe(true);
    expect(canRetire({ user, equipment: makeEquipment({ signedById: 'other' }) })).toBe(false);
  });

  it('non-signer holder cannot retire', () => {
    const user = makeUser({ uid: 'holder-only' });
    const eq = makeEquipment({ signedById: 'signer', currentHolderId: 'holder-only' });
    expect(canRetire({ user, equipment: eq })).toBe(false);
  });

  it('immediate retirement requires signer AND holder', () => {
    const user = makeUser({ uid: 'u' });
    expect(canRetireImmediately({ user, equipment: makeEquipment({ signedById: 'u', currentHolderId: 'u' }) })).toBe(true);
    expect(canRetireImmediately({ user, equipment: makeEquipment({ signedById: 'u', currentHolderId: 'other' }) })).toBe(false);
  });

  it('manager oversight flag gated to manager+', () => {
    expect(canApproveRetirementOversight(makeUser({ userType: UserType.MANAGER }))).toBe(true);
    expect(canApproveRetirementOversight(makeUser({ userType: UserType.TEAM_LEADER }))).toBe(false);
  });
});

describe('equipmentPolicy — transfer', () => {
  it('only the current holder can request a user transfer', () => {
    const holderUser = makeUser({ uid: 'h' });
    const signerOnlyUser = makeUser({ uid: 's' });
    const eq = makeEquipment({ signedById: 's', currentHolderId: 'h' });
    expect(canTransfer({ user: holderUser, equipment: eq })).toBe(true);
    // Signer-only (not holder) cannot user-transfer — use retirement instead
    expect(canTransfer({ user: signerOnlyUser, equipment: eq })).toBe(false);
  });

  it('force-transfer: TL within team, manager everywhere', () => {
    const tl = makeUser({ userType: UserType.TEAM_LEADER, uid: 'tl', teamId: 'team-a' });
    const mgr = makeUser({ userType: UserType.MANAGER, uid: 'mgr', teamId: 'elsewhere' });
    const user = makeUser({ userType: UserType.USER, uid: 'u', teamId: 'team-a' });
    const eqInTeam = makeEquipment({ holderTeamId: 'team-a', signerTeamId: 'team-a' });
    const eqOutOfTeam = makeEquipment({ holderTeamId: 'team-z', signerTeamId: 'team-z' });

    expect(canForceTransfer({ user: tl, equipment: eqInTeam })).toBe(true);
    expect(canForceTransfer({ user: tl, equipment: eqOutOfTeam })).toBe(false);
    expect(canForceTransfer({ user: mgr, equipment: eqOutOfTeam })).toBe(true);
    expect(canForceTransfer({ user, equipment: eqInTeam })).toBe(false);
  });
});

describe('equipmentPolicy — templates', () => {
  it('canonical template creation is manager+', () => {
    expect(canCreateCanonicalTemplate(makeUser({ userType: UserType.MANAGER }))).toBe(true);
    expect(canCreateCanonicalTemplate(makeUser({ userType: UserType.TEAM_LEADER }))).toBe(false);
    expect(canCreateCanonicalTemplate(makeUser({ userType: UserType.USER }))).toBe(false);
  });

  it('TL can propose templates', () => {
    expect(canProposeTemplate(makeUser({ userType: UserType.TEAM_LEADER }))).toBe(true);
    expect(canProposeTemplate(makeUser({ userType: UserType.USER }))).toBe(false);
  });

  it('any authenticated user can request a template', () => {
    expect(canRequestTemplate(makeUser({ userType: UserType.USER }))).toBe(true);
  });

  it('only managers review templates', () => {
    expect(canReviewTemplate(makeUser({ userType: UserType.MANAGER }))).toBe(true);
    expect(canReviewTemplate(makeUser({ userType: UserType.TEAM_LEADER }))).toBe(false);
  });
});

describe('equipmentPolicy — misc', () => {
  it('bulk ops are manager+', () => {
    expect(canBulkOps(makeUser({ userType: UserType.MANAGER }))).toBe(true);
    expect(canBulkOps(makeUser({ userType: UserType.TEAM_LEADER }))).toBe(false);
  });

  it('canAddEquipment is always true for authenticated users', () => {
    expect(canAddEquipment(makeUser({ userType: UserType.USER }))).toBe(true);
    expect(canAddEquipment(makeUser({ userType: UserType.ADMIN }))).toBe(true);
  });
});

describe('equipmentPolicy — exchange + storage', () => {
  const holder = makeUser({ uid: 'holder-uid' });
  const signer = makeUser({ uid: 'signer-uid' });
  const stranger = makeUser({ uid: 'stranger-uid' });
  const baseEquipment = makeEquipment({
    currentHolderId: 'holder-uid',
    signedById: 'signer-uid',
    currentHolder: 'Holder',
    signedBy: 'Signer',
    status: EquipmentStatus.AVAILABLE,
  });

  it('canRequestExchange: holder + AVAILABLE only', () => {
    expect(canRequestExchange({ user: holder, equipment: baseEquipment })).toBe(true);
    expect(canRequestExchange({ user: signer, equipment: baseEquipment })).toBe(false);
    expect(canRequestExchange({
      user: holder,
      equipment: { ...baseEquipment, status: EquipmentStatus.EXCHANGE_REQUESTED },
    })).toBe(false);
  });

  it('canApproveExchange: signer + EXCHANGE_REQUESTED only', () => {
    const pending = { ...baseEquipment, status: EquipmentStatus.EXCHANGE_REQUESTED };
    expect(canApproveExchange({ user: signer, equipment: pending })).toBe(true);
    expect(canApproveExchange({ user: holder, equipment: pending })).toBe(false);
    expect(canApproveExchange({ user: signer, equipment: baseEquipment })).toBe(false);
  });

  it('canReplaceByAnother: signer + AVAILABLE only', () => {
    expect(canReplaceByAnother({ user: signer, equipment: baseEquipment })).toBe(true);
    expect(canReplaceByAnother({ user: holder, equipment: baseEquipment })).toBe(false);
    expect(canReplaceByAnother({
      user: signer,
      equipment: { ...baseEquipment, status: EquipmentStatus.EXCHANGE_REQUESTED },
    })).toBe(false);
  });

  it('canSendToStorage: holder + AVAILABLE only', () => {
    expect(canSendToStorage({ user: holder, equipment: baseEquipment })).toBe(true);
    expect(canSendToStorage({ user: signer, equipment: baseEquipment })).toBe(false);
    expect(canSendToStorage({
      user: holder,
      equipment: { ...baseEquipment, status: EquipmentStatus.STORED },
    })).toBe(false);
    expect(canSendToStorage({ user: stranger, equipment: baseEquipment })).toBe(false);
  });

  it('canPullFromStorage: holder + STORED only', () => {
    const stored = { ...baseEquipment, status: EquipmentStatus.STORED };
    expect(canPullFromStorage({ user: holder, equipment: stored })).toBe(true);
    expect(canPullFromStorage({ user: signer, equipment: stored })).toBe(false);
    expect(canPullFromStorage({ user: holder, equipment: baseEquipment })).toBe(false);
  });
});

describe('equipmentPolicy — bug #25 status gates', () => {
  // Regression guard for bug #25: RETIRED items should leave the active list
  // entirely (only history allowed), and STORED items should collapse the
  // action menu to history + pull-from-storage. The policy layer is the
  // single chokepoint — UI uses these helpers to decide menu visibility.
  const holder = makeUser({ uid: 'holder-uid' });
  const signer = makeUser({ uid: 'signer-uid' });
  const both = makeUser({ uid: 'self-uid' }); // is BOTH holder + signer
  const admin = makeUser({ uid: 'admin-uid', userType: UserType.ADMIN });

  function eq(over: Partial<Equipment>): Equipment {
    return makeEquipment({
      currentHolderId: 'holder-uid',
      signedById: 'signer-uid',
      currentHolder: 'Holder',
      signedBy: 'Signer',
      ...over,
    });
  }

  describe('RETIRED items: every mutating action returns false', () => {
    const retired = eq({ status: EquipmentStatus.RETIRED });

    it('canReport returns false even for holder', () => {
      expect(canReport({ user: holder, equipment: retired })).toBe(false);
    });
    it('canReport returns false even for admin', () => {
      expect(canReport({ user: admin, equipment: retired })).toBe(false);
    });
    it('canTransfer returns false for holder', () => {
      expect(canTransfer({ user: holder, equipment: retired })).toBe(false);
    });
    it('canRetire returns false for signer (already retired)', () => {
      expect(canRetire({ user: signer, equipment: retired })).toBe(false);
    });
    it('canRetireImmediately returns false for holder+signer combo', () => {
      const selfRetired = eq({
        status: EquipmentStatus.RETIRED,
        currentHolderId: 'self-uid',
        signedById: 'self-uid',
      });
      expect(canRetireImmediately({ user: both, equipment: selfRetired })).toBe(false);
    });
    it('canForceTransfer returns false even for admin', () => {
      expect(canForceTransfer({ user: admin, equipment: retired })).toBe(false);
    });
    it('canRequestExchange / canSendToStorage / canReplaceByAnother all false', () => {
      expect(canRequestExchange({ user: holder, equipment: retired })).toBe(false);
      expect(canSendToStorage({ user: holder, equipment: retired })).toBe(false);
      expect(canReplaceByAnother({ user: signer, equipment: retired })).toBe(false);
    });
  });

  describe('STORED items: only pull-from-storage permitted; rest false', () => {
    const stored = eq({ status: EquipmentStatus.STORED });

    it('canPullFromStorage stays true for holder (un-store path)', () => {
      expect(canPullFromStorage({ user: holder, equipment: stored })).toBe(true);
    });
    it('canReport returns false for holder while stored', () => {
      expect(canReport({ user: holder, equipment: stored })).toBe(false);
    });
    it('canReport returns false even for admin while stored', () => {
      expect(canReport({ user: admin, equipment: stored })).toBe(false);
    });
    it('canTransfer returns false while stored', () => {
      expect(canTransfer({ user: holder, equipment: stored })).toBe(false);
    });
    it('canRetire returns false while stored (must pull from storage first)', () => {
      expect(canRetire({ user: signer, equipment: stored })).toBe(false);
    });
    it('canRequestExchange / canSendToStorage / canReplaceByAnother all false', () => {
      expect(canRequestExchange({ user: holder, equipment: stored })).toBe(false);
      expect(canSendToStorage({ user: holder, equipment: stored })).toBe(false);
      expect(canReplaceByAnother({ user: signer, equipment: stored })).toBe(false);
    });
    it('canForceTransfer returns false even for admin while stored', () => {
      expect(canForceTransfer({ user: admin, equipment: stored })).toBe(false);
    });
  });
});
