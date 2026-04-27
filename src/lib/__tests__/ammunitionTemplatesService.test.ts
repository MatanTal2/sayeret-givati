/**
 * Phase 2 — ammunitionTemplatesService input validation.
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
  validateAmmunitionTemplateInput,
  serverCreateAmmunitionTemplate,
  serverListAmmunitionTemplates,
} from '@/lib/db/server/ammunitionTemplatesService';

describe('validateAmmunitionTemplateInput', () => {
  const baseInput = {
    name: '5.56 לבן',
    subcategory: 'BULLETS',
    allocation: 'TEAM',
    trackingMode: 'BRUCE',
    securityLevel: 'EXPLOSIVE',
    bulletsPerCardboard: 30,
    cardboardsPerBruce: 33,
    status: 'CANONICAL',
    createdBy: 'admin-uid',
  };

  it('accepts a well-formed BRUCE template', () => {
    const out = validateAmmunitionTemplateInput(baseInput);
    expect(out.name).toBe('5.56 לבן');
    expect(out.bulletsPerCardboard).toBe(30);
    expect(out.cardboardsPerBruce).toBe(33);
  });

  it('rejects empty input', () => {
    expect(() => validateAmmunitionTemplateInput(undefined)).toThrow(/input is required/);
    expect(() => validateAmmunitionTemplateInput(null)).toThrow(/input is required/);
  });

  it('rejects short name', () => {
    expect(() =>
      validateAmmunitionTemplateInput({ ...baseInput, name: 'a' })
    ).toThrow(/at least 2 characters/);
  });

  it('rejects unknown subcategory', () => {
    expect(() =>
      validateAmmunitionTemplateInput({ ...baseInput, subcategory: 'NOPE' })
    ).toThrow(/subcategory is invalid/);
  });

  it('rejects unknown allocation', () => {
    expect(() =>
      validateAmmunitionTemplateInput({ ...baseInput, allocation: 'WORLD' })
    ).toThrow(/allocation must be one of/);
  });

  it('requires bulletsPerCardboard for BRUCE templates', () => {
    expect(() =>
      validateAmmunitionTemplateInput({ ...baseInput, bulletsPerCardboard: undefined })
    ).toThrow(/bulletsPerCardboard/);
  });

  it('does not require BRUCE constants for non-BRUCE templates', () => {
    const out = validateAmmunitionTemplateInput({
      ...baseInput,
      trackingMode: 'LOOSE_COUNT',
      bulletsPerCardboard: undefined,
      cardboardsPerBruce: undefined,
    });
    expect(out.bulletsPerCardboard).toBeUndefined();
    expect(out.cardboardsPerBruce).toBeUndefined();
  });

  it('requires createdBy', () => {
    expect(() =>
      validateAmmunitionTemplateInput({ ...baseInput, createdBy: '' })
    ).toThrow(/createdBy is required/);
  });

  it('rejects unknown status', () => {
    expect(() =>
      validateAmmunitionTemplateInput({ ...baseInput, status: 'WHAT' })
    ).toThrow(/status must be one of/);
  });
});

describe('ammunitionTemplatesService — admin DB reach', () => {
  it('serverCreateAmmunitionTemplate touches admin DB after validation', async () => {
    await expect(
      serverCreateAmmunitionTemplate({
        name: 'test',
        subcategory: 'OTHER',
        allocation: 'USER',
        trackingMode: 'LOOSE_COUNT',
        securityLevel: 'GRABBABLE',
        status: 'CANONICAL',
        createdBy: 'uid',
      })
    ).rejects.toThrow(/Test reached admin DB/);
  });

  it('serverListAmmunitionTemplates touches admin DB', async () => {
    await expect(serverListAmmunitionTemplates()).rejects.toThrow(/Test reached admin DB/);
  });
});
