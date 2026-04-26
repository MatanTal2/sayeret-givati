/**
 * Phase 4 — ammunitionReportsService validation tests.
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

jest.mock('@/lib/db/server/actionsLogService', () => ({
  serverCreateActionLog: jest.fn(async () => 'log-id'),
}));
jest.mock('@/lib/db/server/notificationService', () => ({
  serverCreateNotification: jest.fn(async () => 'notif-id'),
  serverCreateBatchNotifications: jest.fn(async () => []),
}));

import {
  validateSubmitReportInput,
  serverSubmitAmmunitionReport,
  serverListAmmunitionReports,
} from '@/lib/db/server/ammunitionReportsService';
import { UserType } from '@/types/user';

const baseInput = {
  actor: { uid: 'reporter', userType: UserType.USER },
  templateId: 't1',
  reason: 'אימון',
  usedAtMs: Date.now(),
};

describe('validateSubmitReportInput', () => {
  it('accepts a minimal well-formed input', () => {
    const out = validateSubmitReportInput(baseInput);
    expect(out.templateId).toBe('t1');
    expect(out.reason).toBe('אימון');
  });

  it('rejects empty input', () => {
    expect(() => validateSubmitReportInput(undefined)).toThrow(/input is required/);
  });

  it('rejects missing templateId', () => {
    expect(() => validateSubmitReportInput({ ...baseInput, templateId: '' })).toThrow(
      /templateId is required/
    );
  });

  it('rejects empty reason', () => {
    expect(() => validateSubmitReportInput({ ...baseInput, reason: '   ' })).toThrow(
      /reason is required/
    );
  });

  it('rejects non-numeric usedAtMs', () => {
    expect(() =>
      validateSubmitReportInput({ ...baseInput, usedAtMs: 'now' })
    ).toThrow(/usedAtMs must be a number/);
  });

  it('rejects negative bruceConsumed', () => {
    expect(() =>
      validateSubmitReportInput({ ...baseInput, brucesConsumed: -1 })
    ).toThrow(/non-negative/);
  });

  it('rejects bad finalOpenBruceState', () => {
    expect(() =>
      validateSubmitReportInput({ ...baseInput, finalOpenBruceState: 'NOPE' })
    ).toThrow(/finalOpenBruceState must be/);
  });

  it('rejects non-array itemSerials', () => {
    expect(() =>
      validateSubmitReportInput({ ...baseInput, itemSerials: 'serial-1' })
    ).toThrow(/itemSerials must be an array/);
  });

  it('rejects negative quantityConsumed', () => {
    expect(() =>
      validateSubmitReportInput({ ...baseInput, quantityConsumed: -3 })
    ).toThrow(/non-negative/);
  });
});

describe('admin DB reach', () => {
  it('serverListAmmunitionReports', async () => {
    await expect(serverListAmmunitionReports({})).rejects.toThrow(/Test reached admin DB/);
  });

  it('serverSubmitAmmunitionReport', async () => {
    await expect(serverSubmitAmmunitionReport(baseInput)).rejects.toThrow(/Test reached admin DB/);
  });
});
