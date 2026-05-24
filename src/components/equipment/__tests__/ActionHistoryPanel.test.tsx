import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionHistoryPanel from '../ActionHistoryPanel';
import {
  EquipmentCondition,
  EquipmentStatus,
  type Equipment,
} from '@/types/equipment';

// Mock data sources for the panel. We do NOT mock the timestamp util — we
// want to verify the plain-object Firestore shape is handled end-to-end.
jest.mock('@/lib/actionsLogService', () => ({
  getEquipmentActionLogs: jest.fn(async () => []),
}));

jest.mock('@/lib/equipmentService', () => ({
  EquipmentService: {
    Items: {
      getEquipment: jest.fn(async () => ({ success: false, data: null })),
    },
  },
}));

jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    FEATURES: {
      EQUIPMENT: {
        HISTORY_PANEL: {
          TITLE: 'היסטוריה',
          SUBTITLE: 'יומן',
          EMPTY: 'אין היסטוריה',
          LOADING: 'טוען...',
          CLOSE: 'סגור',
          PREDECESSOR_BADGE: 'קודם',
          UNKNOWN_DATE: 'תאריך לא ידוע',
          EXPAND_ROW_ARIA: 'הצג פרטים',
          COLLAPSE_ROW_ARIA: 'הסתר פרטים',
          SOURCE_TRACKING: 'מהיסטוריית הפריט',
          SOURCE_LOG: 'מיומן הפעולות',
          SOURCE_LABEL: 'מקור',
          OWNER_DOC_LABEL: 'מסמך פריט',
          PREDECESSOR_FLAG_LABEL: 'מהיסטוריה של פריט קודם',
          CONDITION_LABEL: 'מצב הפריט',
        },
        ACTION_TYPES: {
          equipment_created: 'פריט נוצר',
          stored: 'נשלח לאחסון',
          report_submitted: 'דווח',
          transfer_approved: 'אישור העברה',
        },
        CONDITION_LABELS: {
          good: 'תקין',
          needs_repair: 'דורש תיקון',
          worn: 'שחוק',
        },
        EXCHANGE: {
          PREDECESSOR_PILL: 'נוצר מ-{serial}',
        },
      },
    },
  },
}));

const historyPanelLabels = {
  TITLE: 'היסטוריה',
  SUBTITLE: 'יומן',
  EMPTY: 'אין היסטוריה',
  LOADING: 'טוען...',
  CLOSE: 'סגור',
  PREDECESSOR_BADGE: 'קודם',
  UNKNOWN_DATE: 'תאריך לא ידוע',
  EXPAND_ROW_ARIA: 'הצג פרטים',
  COLLAPSE_ROW_ARIA: 'הסתר פרטים',
  SOURCE_TRACKING: 'מהיסטוריית הפריט',
  SOURCE_LOG: 'מיומן הפעולות',
  SOURCE_LABEL: 'מקור',
  OWNER_DOC_LABEL: 'מסמך פריט',
  PREDECESSOR_FLAG_LABEL: 'מהיסטוריה של פריט קודם',
  CONDITION_LABEL: 'מצב הפריט',
};

function makeEquipment(overrides: Partial<Equipment> = {}): Equipment {
  const epochSeconds = Math.floor(Date.UTC(2026, 4, 1, 10, 30, 0) / 1000);
  return {
    id: 'eq-1',
    equipmentType: 'rifle_m4',
    productName: 'M4',
    category: 'weapons',
    acquisitionDate: { seconds: epochSeconds, nanoseconds: 0 },
    dateSigned: { seconds: epochSeconds, nanoseconds: 0 },
    lastSeen: { seconds: epochSeconds, nanoseconds: 0 },
    lastReportUpdate: { seconds: epochSeconds, nanoseconds: 0 },
    signedBy: 'Holder',
    signedById: 'u1',
    currentHolder: 'Holder',
    currentHolderId: 'u1',
    status: EquipmentStatus.AVAILABLE,
    location: 'base',
    condition: EquipmentCondition.GOOD,
    trackingHistory: [
      {
        // Firestore admin-SDK plain-object shape — previously triggered
        // "Invalid Date" in the panel.
        action: 'equipment_created',
        holder: 'Creator',
        location: 'base',
        notes: 'Equipment created in system',
        // Cast: the Firestore plain-object shape is what the panel sees
        // after admin-SDK round-trip; the EquipmentHistoryEntry type
        // declares Timestamp but at runtime this is the actual data.
        timestamp: { seconds: epochSeconds, nanoseconds: 0 },
        updatedBy: 'u1',
        actor: 'Creator',
      },
      {
        action: 'stored',
        holder: 'Stored Holder',
        location: 'base',
        notes: 'Sent to storage by Storage Actor',
        timestamp: { seconds: epochSeconds + 60, nanoseconds: 0 },
        updatedBy: 'u1',
        actor: 'Storage Actor',
      },
    ] as unknown as Equipment['trackingHistory'],
    createdAt: { seconds: epochSeconds, nanoseconds: 0 },
    updatedAt: { seconds: epochSeconds, nanoseconds: 0 },
    ...overrides,
  } as unknown as Equipment;
}

describe('ActionHistoryPanel', () => {
  it('renders Hebrew action labels for known enum values', async () => {
    render(<ActionHistoryPanel equipment={makeEquipment()} onClose={jest.fn()} />);
    expect(await screen.findByText('פריט נוצר')).toBeInTheDocument();
    expect(screen.getByText('נשלח לאחסון')).toBeInTheDocument();
  });

  it('does not render "Invalid Date" for plain-object timestamps', async () => {
    render(<ActionHistoryPanel equipment={makeEquipment()} onClose={jest.fn()} />);
    // Wait for content to settle
    await screen.findByText('פריט נוצר');
    expect(screen.queryByText(/Invalid Date/i)).toBeNull();
  });

  it('shows actor name on STORED tracking entry', async () => {
    render(<ActionHistoryPanel equipment={makeEquipment()} onClose={jest.fn()} />);
    await screen.findByText('נשלח לאחסון');
    // The actor line is rendered as "👤 {actor}" — the literal actor text is
    // contained in the actor row regardless of the note line.
    expect(screen.getAllByText(/Storage Actor/).length).toBeGreaterThan(0);
  });

  it('expands row on click to show extra detail fields', async () => {
    render(<ActionHistoryPanel equipment={makeEquipment()} onClose={jest.fn()} />);
    const createdRowLabel = await screen.findByText('פריט נוצר');
    const row = createdRowLabel.closest('[role="button"]') as HTMLElement | null;
    expect(row).not.toBeNull();
    expect(row!.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(row!);
    await waitFor(() => {
      expect(row!.getAttribute('aria-expanded')).toBe('true');
    });
    // Exact timestamp row removed — collapsed shortDate is the only time shown.
    const iso = new Date(Date.UTC(2026, 4, 1, 10, 30, 0)).toISOString();
    expect(screen.queryByText(iso)).toBeNull();
    // Remaining detail labels still render in the expanded panel.
    expect(screen.getAllByText(historyPanelLabels.SOURCE_LABEL).length).toBeGreaterThan(0);
    expect(screen.getAllByText(historyPanelLabels.OWNER_DOC_LABEL).length).toBeGreaterThan(0);
  });

  it('renders UNKNOWN_DATE placeholder when timestamp is missing', async () => {
    const eq = makeEquipment({
      trackingHistory: [
        {
          action: 'equipment_created',
          holder: 'Creator',
          location: 'base',
          notes: 'created',
          // No timestamp — older docs predating admin-SDK normalization.
          timestamp: undefined as unknown as Equipment['trackingHistory'][number]['timestamp'],
          updatedBy: 'u1',
          actor: 'Creator',
        },
      ] as unknown as Equipment['trackingHistory'],
    });
    render(<ActionHistoryPanel equipment={eq} onClose={jest.fn()} />);
    await screen.findByText('פריט נוצר');
    expect(screen.getAllByText(historyPanelLabels.UNKNOWN_DATE).length).toBeGreaterThan(0);
  });
});
