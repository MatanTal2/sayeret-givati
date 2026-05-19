import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// EquipmentTable's date helpers do `t instanceof Timestamp`. The default
// firebase mock exports `Timestamp` as a plain object literal, which makes
// `instanceof` throw "Right-hand side of 'instanceof' is not callable".
// Provide a real class shape so the helpers can short-circuit cleanly.
jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('@/lib/__mocks__/firebase');
  class TimestampClass {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    toDate() {
      return new Date(this.seconds * 1000);
    }
    toMillis() {
      return this.seconds * 1000;
    }
  }
  return { ...actual, Timestamp: TimestampClass };
});

import EquipmentTable from '../EquipmentTable';
import { EquipmentStatus, EquipmentCondition, type Equipment } from '@/types/equipment';
import { UserType, type EnhancedAuthUser } from '@/types/user';

jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    FEATURES: {
      EQUIPMENT: {
        TABLE_SERIAL: 'Serial',
        TABLE_ITEM: 'Item',
        TABLE_HOLDER: 'Holder',
        TABLE_STATUS: 'Status',
        TABLE_LAST_CHECK: 'Last check',
        STATUS_AVAILABLE: 'Available',
        STATUS_PENDING_TRANSFER: 'Pending',
        STATUS_SECURITY: 'Security',
        STATUS_REPAIR: 'Repair',
        STATUS_LOST: 'Lost',
        STATUS_EXCHANGE_REQUESTED: 'Exchange',
        STATUS_STORED: 'Stored',
        STATUS_RETIRED: 'Retired',
        LOCATION: 'Location',
        NOTES: 'Notes',
        DIMMED_ANNOTATION: 'Item is with {holder}',
        STALE_REPORT_BADGE: 'Not reported in {days} days',
        ROW_ACTIONS: {
          REPORT: 'Report',
          TRANSFER: 'Transfer',
          RETURN: 'Return',
          HISTORY: 'History',
          MORE: 'More',
          REQUEST_EXCHANGE: 'Request exchange',
          APPROVE_EXCHANGE: 'Approve exchange',
          REJECT_EXCHANGE: 'Reject exchange',
          REPLACE_BY_ANOTHER: 'Replace',
          SEND_TO_STORAGE: 'Send to storage',
          PULL_FROM_STORAGE: 'Pull from storage',
        },
        STORAGE: {
          ROUND_CLOSED_TOOLTIP: 'Round is closed',
          TRANSFER_BLOCKED_STORED_TOOLTIP: 'Pull first',
          INFO_BUBBLE_LABEL: 'Info',
        },
      },
    },
  },
}));

jest.mock('@/hooks/useCategoryLookup', () => ({
  useCategoryLookup: () => ({
    categoryName: (id: string) => id,
    subcategoryName: (id: string) => id,
    isLoading: false,
  }),
}));

const HOLDER_UID = 'holder-uid';

function makeUser(): EnhancedAuthUser {
  return {
    uid: HOLDER_UID,
    userType: UserType.USER,
    displayName: 'Test Holder',
  };
}

function makeEquipment(overrides: Partial<Equipment> = {}): Equipment {
  return {
    id: 'eq-1',
    equipmentType: 'rifle_m4',
    productName: 'Rifle A',
    category: 'weapons',
    signedBy: 'Signer',
    signedById: 'signer-uid',
    currentHolder: 'Holder',
    currentHolderId: HOLDER_UID,
    status: EquipmentStatus.AVAILABLE,
    location: 'base',
    condition: EquipmentCondition.GOOD,
    trackingHistory: [],
    acquisitionDate: {} as Equipment['acquisitionDate'],
    dateSigned: {} as Equipment['dateSigned'],
    lastSeen: {} as Equipment['lastSeen'],
    lastReportUpdate: {} as Equipment['lastReportUpdate'],
    createdAt: {} as Equipment['createdAt'],
    updatedAt: {} as Equipment['updatedAt'],
    ...overrides,
  };
}

describe('EquipmentTable — row scrollIntoView on expand', () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  let scrollIntoViewMock: jest.Mock;
  let rafSpy: jest.SpyInstance;

  beforeEach(() => {
    scrollIntoViewMock = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    // Run rAF synchronously so the scrollIntoView call is observable without
    // additional async waits.
    rafSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
  });

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
    rafSpy.mockRestore();
  });

  function renderTable(items: Equipment[]) {
    return render(
      <EquipmentTable
        equipment={items}
        user={makeUser()}
        selectedIds={new Set()}
        onToggleSelect={jest.fn()}
        onToggleSelectAllVisible={jest.fn()}
        onRowAction={jest.fn()}
        emptyMessage="empty"
        roundOpen
      />,
    );
  }

  it('does not call scrollIntoView for collapsed rows on initial render', () => {
    renderTable([makeEquipment({ id: 'a' }), makeEquipment({ id: 'b' })]);
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it('calls scrollIntoView once when a row is expanded', () => {
    renderTable([makeEquipment({ id: 'a' }), makeEquipment({ id: 'b', productName: 'Rifle B' })]);

    // The row body is the role="button" that toggles expand.
    const rowButtons = screen.getAllByRole('button').filter((el) =>
      el.className.includes('cursor-pointer'),
    );
    expect(rowButtons.length).toBeGreaterThanOrEqual(2);

    fireEvent.click(rowButtons[0]);

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  });

  it('does not call scrollIntoView again when the same row collapses', () => {
    renderTable([makeEquipment({ id: 'a' })]);
    const rowButton = screen
      .getAllByRole('button')
      .filter((el) => el.className.includes('cursor-pointer'))[0];

    fireEvent.click(rowButton); // expand → scroll
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);

    fireEvent.click(rowButton); // collapse → no additional scroll
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });
});
