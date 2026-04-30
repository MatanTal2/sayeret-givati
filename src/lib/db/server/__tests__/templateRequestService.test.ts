/**
 * serverProposeTemplate — status mapping per proposer userType.
 *
 * Bug #8: ADMIN / SYSTEM_MANAGER submissions must land as CANONICAL with
 * isActive:true and self-populated reviewedBy fields. Regular users must
 * stay PENDING_REQUEST. Other roles (TL, MANAGER) stay PROPOSED.
 */

jest.mock('firebase-admin/firestore', () => ({
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

const writes: Record<string, unknown>[] = [];
const setMock = jest.fn(async (data: Record<string, unknown>) => {
  writes.push(data);
});
const docMock = jest.fn(() => ({ id: 'fake-template-id', set: setMock }));
const collectionMock = jest.fn(() => ({
  doc: docMock,
  where: () => ({
    get: async () => ({ empty: true, docs: [] }),
  }),
}));

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: jest.fn(() => ({ collection: collectionMock })),
}));

jest.mock('../actionsLogService', () => ({
  serverCreateActionLog: jest.fn(async () => undefined),
}));

jest.mock('../notificationService', () => ({
  serverCreateNotification: jest.fn(async () => undefined),
  serverCreateBatchNotifications: jest.fn(async () => undefined),
}));

jest.mock('../equipmentDraftService', () => ({
  serverPromoteDraftsForTemplate: jest.fn(async () => []),
}));

import { serverProposeTemplate } from '../templateRequestService';
import { TemplateStatus } from '@/types/equipment';
import { UserType } from '@/types/user';
import { serverCreateActionLog } from '../actionsLogService';
import { serverCreateBatchNotifications } from '../notificationService';
import { ActionType } from '@/types/equipment';

const baseInput = {
  proposerUserId: 'user-1',
  proposerUserName: 'Test User',
  name: 'Template A',
  category: 'cat-1',
  subcategory: 'sub-1',
  requiresSerialNumber: true,
  requiresDailyStatusCheck: false,
};

describe('serverProposeTemplate — status by proposer userType', () => {
  beforeEach(() => {
    writes.length = 0;
    (serverCreateActionLog as jest.Mock).mockClear();
    (serverCreateBatchNotifications as jest.Mock).mockClear();
  });

  it('USER → PENDING_REQUEST, isActive:false, no reviewer fields', async () => {
    const result = await serverProposeTemplate({
      ...baseInput,
      proposerUserType: UserType.USER,
    });
    expect(result.status).toBe(TemplateStatus.PENDING_REQUEST);
    expect(writes[0].status).toBe(TemplateStatus.PENDING_REQUEST);
    expect(writes[0].isActive).toBe(false);
    expect(writes[0].reviewedByUserId).toBeUndefined();
    expect(writes[0].reviewedAt).toBeUndefined();
    expect((serverCreateActionLog as jest.Mock).mock.calls[0][0].actionType).toBe(
      ActionType.TEMPLATE_REQUESTED
    );
  });

  it('TEAM_LEADER → PROPOSED, isActive:false, no reviewer fields', async () => {
    const result = await serverProposeTemplate({
      ...baseInput,
      proposerUserType: UserType.TEAM_LEADER,
    });
    expect(result.status).toBe(TemplateStatus.PROPOSED);
    expect(writes[0].status).toBe(TemplateStatus.PROPOSED);
    expect(writes[0].isActive).toBe(false);
    expect(writes[0].reviewedByUserId).toBeUndefined();
    expect((serverCreateActionLog as jest.Mock).mock.calls[0][0].actionType).toBe(
      ActionType.TEMPLATE_PROPOSED
    );
  });

  it('MANAGER → PROPOSED (still requires admin/system_manager review)', async () => {
    const result = await serverProposeTemplate({
      ...baseInput,
      proposerUserType: UserType.MANAGER,
    });
    expect(result.status).toBe(TemplateStatus.PROPOSED);
    expect(writes[0].isActive).toBe(false);
  });

  it('ADMIN → CANONICAL, isActive:true, self as reviewer, no notify', async () => {
    const result = await serverProposeTemplate({
      ...baseInput,
      proposerUserType: UserType.ADMIN,
    });
    expect(result.status).toBe(TemplateStatus.CANONICAL);
    expect(writes[0].status).toBe(TemplateStatus.CANONICAL);
    expect(writes[0].isActive).toBe(true);
    expect(writes[0].reviewedByUserId).toBe('user-1');
    expect(writes[0].reviewedAt).toBe('SERVER_TIMESTAMP');
    expect((serverCreateActionLog as jest.Mock).mock.calls[0][0].actionType).toBe(
      ActionType.TEMPLATE_APPROVED
    );
    expect(serverCreateBatchNotifications).not.toHaveBeenCalled();
  });

  it('SYSTEM_MANAGER → CANONICAL, isActive:true, self as reviewer, no notify', async () => {
    const result = await serverProposeTemplate({
      ...baseInput,
      proposerUserType: UserType.SYSTEM_MANAGER,
    });
    expect(result.status).toBe(TemplateStatus.CANONICAL);
    expect(writes[0].isActive).toBe(true);
    expect(writes[0].reviewedByUserId).toBe('user-1');
    expect(serverCreateBatchNotifications).not.toHaveBeenCalled();
  });
});
