import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// jsdom lacks URL.createObjectURL — ReportModal calls it on every captured
// blob to build a preview image src. Stub before importing the component.
beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    value: jest.fn(() => 'blob:mock'),
    writable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: jest.fn(),
    writable: true,
  });
});

import ReportModal from '../ReportModal';
import {
  EquipmentCondition,
  EquipmentStatus,
  type Equipment,
} from '@/types/equipment';
import { UserType, type EnhancedAuthUser } from '@/types/user';
import { selectListboxOption, listboxButtonLabel } from '@/__test-utils__/listboxHelpers';

// CameraCapture pulls in the camera hook and getUserMedia which jsdom doesn't
// provide. Replace it with a tiny stub that exposes a "capture" button.
jest.mock('@/components/camera/CameraCapture', () => {
  const Mock = ({ onCapture }: { onCapture: (blob: Blob) => void }) => (
    <button
      type="button"
      data-testid="mock-capture"
      onClick={() => onCapture(new Blob(['x'], { type: 'image/png' }))}
    >
      capture
    </button>
  );
  Mock.displayName = 'MockCameraCapture';
  return { __esModule: true, default: Mock };
});

jest.mock('@/lib/storageService', () => ({
  uploadEquipmentPhoto: jest.fn(async () => ({ url: 'https://example.com/photo.jpg' })),
}));

jest.mock('@/lib/equipmentPolicy', () => ({
  canReportWithoutPhoto: () => false,
}));

jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    FEATURES: {
      EQUIPMENT: {
        REPORT_MODAL: {
          TITLE: 'דיווח',
          SUBTITLE: 'תת',
          NOTE_LABEL: 'הערות',
          NOTE_PLACEHOLDER: 'מצב הציוד...',
          BYPASS_PHOTO: 'דווח ללא תמונה',
          CONDITION_LABEL: 'מצב הפריט',
          CONDITION_OPTIONS: {
            GOOD: 'תקין',
            NEEDS_REPAIR: 'דורש תיקון',
            WORN: 'שחוק',
          },
          SUBMIT: 'שלח',
          CANCEL: 'ביטול',
          SUCCESS: 'נשלח',
          ERROR: 'נכשל',
        },
        WIZARD: {
          PHOTO_REQUIRED_ERROR: 'photo required',
        },
      },
    },
    CAMERA: {
      RETAKE: 'צלם שוב',
    },
  },
}));

const labels = {
  TITLE: 'דיווח',
  SUBTITLE: 'תת',
  NOTE_LABEL: 'הערות',
  NOTE_PLACEHOLDER: 'מצב הציוד...',
  BYPASS_PHOTO: 'דווח ללא תמונה',
  CONDITION_LABEL: 'מצב הפריט',
  CONDITION_OPTIONS: {
    GOOD: 'תקין',
    NEEDS_REPAIR: 'דורש תיקון',
    WORN: 'שחוק',
  },
  SUBMIT: 'שלח',
  CANCEL: 'ביטול',
  SUCCESS: 'נשלח',
  ERROR: 'נכשל',
};

function makeEquipment(): Equipment {
  return {
    id: 'eq-1',
    equipmentType: 'rifle_m4',
    productName: 'M4',
    category: 'weapons',
    acquisitionDate: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 },
    dateSigned: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 },
    lastSeen: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 },
    lastReportUpdate: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 },
    signedBy: 'Holder',
    signedById: 'u1',
    currentHolder: 'Holder',
    currentHolderId: 'u1',
    status: EquipmentStatus.AVAILABLE,
    location: 'base',
    condition: EquipmentCondition.GOOD,
    trackingHistory: [],
    createdAt: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 },
    updatedAt: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 },
  } as unknown as Equipment;
}

function makeUser(): EnhancedAuthUser {
  return {
    uid: 'u1',
    userType: UserType.USER,
    displayName: 'Holder',
  };
}

describe('ReportModal — condition field', () => {
  it('renders the condition Select with GOOD label as default', () => {
    render(
      <ReportModal
        equipment={makeEquipment()}
        user={makeUser()}
        onClose={jest.fn()}
        onSubmit={jest.fn(async () => ({ success: true }))}
      />
    );
    expect(listboxButtonLabel(labels.CONDITION_LABEL)).toBe(labels.CONDITION_OPTIONS.GOOD);
  });

  it('passes the selected condition to onSubmit', async () => {
    const onSubmit = jest.fn(async () => ({ success: true }));
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(
      <ReportModal
        equipment={makeEquipment()}
        user={makeUser()}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    // Capture a photo via the mock CameraCapture stub.
    fireEvent.click(screen.getByTestId('mock-capture'));

    // Change condition to NEEDS_REPAIR via the Listbox.
    await selectListboxOption(
      user,
      labels.CONDITION_LABEL,
      labels.CONDITION_OPTIONS.NEEDS_REPAIR,
    );

    fireEvent.click(screen.getByRole('button', { name: labels.SUBMIT }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(
      'https://example.com/photo.jpg',
      '',
      EquipmentCondition.NEEDS_REPAIR,
    );
  });

  it('submits with the default GOOD condition when not changed', async () => {
    const onSubmit = jest.fn(async () => ({ success: true }));
    render(
      <ReportModal
        equipment={makeEquipment()}
        user={makeUser()}
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByTestId('mock-capture'));
    fireEvent.click(screen.getByRole('button', { name: labels.SUBMIT }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        'https://example.com/photo.jpg',
        '',
        EquipmentCondition.GOOD,
      );
    });
  });
});
