import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EquipmentRowActions from '../EquipmentRowActions';
import { EquipmentStatus, EquipmentCondition, type Equipment } from '@/types/equipment';
import { UserType, type EnhancedAuthUser } from '@/types/user';

jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    FEATURES: {
      EQUIPMENT: {
        ROW_ACTIONS: {
          MORE: 'More',
          REPORT: 'Report',
          TRANSFER: 'Transfer',
          REQUEST_EXCHANGE: 'Request exchange',
          APPROVE_EXCHANGE: 'Approve exchange',
          REPLACE_BY_ANOTHER: 'Replace by another',
          SEND_TO_STORAGE: 'Send to storage',
          PULL_FROM_STORAGE: 'Pull from storage',
          HISTORY: 'History',
          REJECT_EXCHANGE: 'Reject exchange',
          RETURN: 'Return',
        },
        STORAGE: {
          ROUND_CLOSED_TOOLTIP: 'Round is closed',
          TRANSFER_BLOCKED_STORED_TOOLTIP: 'Item is in storage — pull first',
          INFO_BUBBLE_LABEL: 'Info',
        },
      },
    },
  },
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
  // jsdom only — we just need enough shape for visibility/disabled logic.
  return {
    id: 'eq-1',
    equipmentType: 'rifle_m4',
    productName: 'Rifle',
    category: 'weapons',
    signedBy: 'Signer',
    signedById: 'signer-uid',
    currentHolder: 'Holder',
    currentHolderId: HOLDER_UID,
    status: EquipmentStatus.AVAILABLE,
    location: 'base',
    condition: EquipmentCondition.GOOD,
    trackingHistory: [],
    // Timestamps are not exercised by these tests; cast through unknown to
    // satisfy the Equipment interface without dragging in firebase types.
    acquisitionDate: {} as Equipment['acquisitionDate'],
    dateSigned: {} as Equipment['dateSigned'],
    lastSeen: {} as Equipment['lastSeen'],
    lastReportUpdate: {} as Equipment['lastReportUpdate'],
    createdAt: {} as Equipment['createdAt'],
    updatedAt: {} as Equipment['updatedAt'],
    ...overrides,
  };
}

describe('EquipmentRowActions', () => {
  function openMenu() {
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
  }

  it('renders the transfer row disabled with an info bubble when status is STORED', () => {
    const user = makeUser();
    const equipment = makeEquipment({ status: EquipmentStatus.STORED });

    render(
      <EquipmentRowActions
        equipment={equipment}
        user={user}
        roundOpen={true}
        onAction={jest.fn()}
      />,
    );

    openMenu();

    const transferRow = screen.getByText('Transfer').closest('button');
    expect(transferRow).toHaveClass('cursor-not-allowed');

    // Exactly one info bubble is rendered (next to the disabled transfer row).
    // Round is open, so pull-from-storage is enabled and has no bubble.
    const infoButtons = screen.getAllByRole('button', { name: 'Info' });
    expect(infoButtons).toHaveLength(1);
    expect(infoButtons[0]).toHaveAttribute(
      'data-info-content',
      'Item is in storage — pull first',
    );
  });

  it('disables pull-from-storage and shows an info bubble when round is closed', () => {
    const user = makeUser();
    const equipment = makeEquipment({ status: EquipmentStatus.STORED });

    render(
      <EquipmentRowActions
        equipment={equipment}
        user={user}
        roundOpen={false}
        onAction={jest.fn()}
      />,
    );

    openMenu();

    const pullRow = screen.getByText('Pull from storage').closest('button');
    expect(pullRow).toHaveClass('cursor-not-allowed');

    // STORED + roundOpen=false yields TWO disabled rows with bubbles:
    // transfer (STORED → "pull first") and pull-from-storage (round closed).
    const infoButtons = screen.getAllByRole('button', { name: 'Info' });
    const contents = infoButtons.map((b) => b.getAttribute('data-info-content'));
    expect(contents).toEqual(
      expect.arrayContaining([
        'Item is in storage — pull first',
        'Round is closed',
      ]),
    );
    expect(contents).toHaveLength(2);
  });

  it('does NOT render any info bubble when the row is enabled', () => {
    const user = makeUser();
    const equipment = makeEquipment({ status: EquipmentStatus.AVAILABLE });

    render(
      <EquipmentRowActions
        equipment={equipment}
        user={user}
        roundOpen={true}
        onAction={jest.fn()}
      />,
    );

    openMenu();

    expect(screen.queryByRole('button', { name: 'Info' })).not.toBeInTheDocument();
  });

  it('calls onAction when the user clicks an enabled row', () => {
    const onAction = jest.fn();
    const user = makeUser();
    const equipment = makeEquipment({ status: EquipmentStatus.AVAILABLE });

    render(
      <EquipmentRowActions
        equipment={equipment}
        user={user}
        roundOpen={true}
        onAction={onAction}
      />,
    );

    openMenu();
    fireEvent.click(screen.getByText('Transfer'));
    expect(onAction).toHaveBeenCalledWith('transfer');
  });
});
