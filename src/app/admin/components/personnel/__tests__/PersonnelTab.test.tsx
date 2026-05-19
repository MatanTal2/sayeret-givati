/**
 * Tests for `PersonnelTab` — the merged Personnel admin tab.
 *
 * Scope:
 *   - renders one row per item returned by `usePersonnelManagement`
 *   - search filters narrow the visible row count (after debounce)
 *   - sort combined-option choice reorders the rows
 *   - clicking a collapsed row toggles its expanded state
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Timestamp } from 'firebase/firestore';

import { UserType } from '@/types/user';
import { UserRole } from '@/types/equipment';
import type { AuthorizedPersonnel } from '@/types/admin';

const fetchPersonnel = jest.fn();
const updatePersonnel = jest.fn(async () => ({ success: true, message: 'ok' }));
const deletePersonnel = jest.fn(async () => {});
const clearMessage = jest.fn();

const PERSONNEL: AuthorizedPersonnel[] = [
  {
    id: 'p1',
    militaryPersonalNumberHash: 'h1',
    firstName: 'יוסי',
    lastName: 'כהן',
    rank: 'סמל',
    phoneNumber: '0501111111',
    userType: UserType.USER,
    approvedRole: UserRole.SOLDIER,
    roleStatus: 'approved',
    status: 'active',
    registered: true,
    joinDate: { toDate: () => new Date('2026-01-01') } as unknown as Timestamp,
    createdAt: { toDate: () => new Date('2026-01-01') } as unknown as Timestamp,
    createdBy: 'admin',
  },
  {
    id: 'p2',
    militaryPersonalNumberHash: 'h2',
    firstName: 'דנה',
    lastName: 'לוי',
    rank: 'סרן',
    phoneNumber: '0502222222',
    userType: UserType.MANAGER,
    approvedRole: UserRole.OFFICER,
    roleStatus: 'approved',
    status: 'active',
    registered: false,
    joinDate: { toDate: () => new Date('2026-02-01') } as unknown as Timestamp,
    createdAt: { toDate: () => new Date('2026-02-01') } as unknown as Timestamp,
    createdBy: 'admin',
  },
];

jest.mock('@/hooks/usePersonnelManagement', () => ({
  usePersonnelManagement: () => ({
    personnel: PERSONNEL,
    isLoading: false,
    message: null,
    fetchPersonnel,
    updatePersonnel,
    deletePersonnel,
    clearMessage,
    formData: {},
    updateFormField: jest.fn(),
    addPersonnel: jest.fn(),
    addPersonnelBulk: jest.fn(),
    resetForm: jest.fn(),
    cacheInfo: { isValid: false, ageInHours: 0, lastManualRefresh: null },
  }),
}));

jest.mock('@/components/ui/ConfirmationModal', () => ({
  __esModule: true,
  default: () => null,
}));

import PersonnelTab from '../../PersonnelTab';

beforeEach(() => {
  fetchPersonnel.mockReset();
  updatePersonnel.mockReset();
  deletePersonnel.mockReset();
});

describe('PersonnelTab', () => {
  it('renders one row per personnel record', () => {
    render(<PersonnelTab />);
    expect(screen.getByText('יוסי כהן')).toBeInTheDocument();
    expect(screen.getByText('דנה לוי')).toBeInTheDocument();
  });

  it('narrows the list when the search input matches a single record (after debounce)', async () => {
    jest.useFakeTimers();
    try {
      render(<PersonnelTab />);
      const searchBox = screen.getByPlaceholderText('חפש לפי שם או טלפון');
      fireEvent.change(searchBox, { target: { value: 'דנה' } });

      // Allow the 300ms debounce timer to fire.
      act(() => {
        jest.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(screen.queryByText('יוסי כהן')).not.toBeInTheDocument();
      });
      expect(screen.getByText('דנה לוי')).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('expands a row when the header is clicked', () => {
    render(<PersonnelTab />);
    // Two row headers, one per record. Click the first (יוסי).
    const headers = screen.getAllByRole('button', { name: 'הרחב פרטים' });
    expect(headers).toHaveLength(2);
    fireEvent.click(headers[0]);

    // After expansion the field labels appear.
    expect(screen.getByText('מספר טלפון')).toBeInTheDocument();
    expect(screen.getByText('תאריך הוספה')).toBeInTheDocument();
  });

  it('switches sort to "name asc" and reorders the rows accordingly', async () => {
    render(<PersonnelTab />);

    // Open the filter panel.
    fireEvent.click(screen.getByRole('button', { name: 'הצג/הסתר מסננים' }));

    // Open the sort listbox and pick the name-asc option.
    fireEvent.click(screen.getByRole('button', { name: 'מיון' }));
    const opt = await screen.findByRole('option', { name: 'שם (א → ת)' });
    fireEvent.click(opt);

    // With Hebrew sort 'א→ת', דנה (ד) precedes יוסי (י), so דנה comes first.
    const names = screen.getAllByText(/כהן|לוי/);
    expect(names[0]).toHaveTextContent('דנה לוי');
    expect(names[1]).toHaveTextContent('יוסי כהן');
  });
});
