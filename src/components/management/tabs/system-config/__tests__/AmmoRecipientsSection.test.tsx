/**
 * Tests for `AmmoRecipientsSection` — the profile-style edit card backing
 * `systemConfig.ammoNotificationRecipientUserIds`.
 *
 * Scope:
 *   - empty-state copy in view mode
 *   - renders display names from `useUsersByIds`, never emails
 *   - edit toggle exposes X buttons + UserSearchInput
 *   - X removes the row from the pending list
 *   - search-add appends to pending; save calls onSave with the new array
 *   - cancel reverts the pending list and exits edit mode
 *   - duplicate uids cannot be added by the user
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────

jest.mock('@/hooks/useUsersByIds', () => ({
  useUsersByIds: (uids: string[]) => ({
    users: Object.fromEntries(
      uids.map((uid) => [
        uid,
        { uid, displayName: NAME_BY_UID[uid] || uid },
      ])
    ),
    isLoading: false,
    error: null,
  }),
}));

// Lightweight UserSearchInput double — exposes a button per pre-seeded user
// so tests can pick whichever one they want without dealing with the real
// debounced search.
jest.mock('@/components/users/UserSearchInput', () => ({
  __esModule: true,
  default: (props: {
    onChange: (u: { uid: string; displayName: string; email: string }) => void;
    excludeUserIds?: string[];
    placeholder?: string;
  }) => {
    const pool = [
      { uid: 'uid-1', displayName: 'דניאל כהן', email: 'd@example.com' },
      { uid: 'uid-2', displayName: 'יואב לוי', email: 'y@example.com' },
      { uid: 'uid-3', displayName: 'שירה בן-דוד', email: 's@example.com' },
      { uid: 'uid-4', displayName: 'New User', email: 'n@example.com' },
    ];
    const filtered = pool.filter((u) => !props.excludeUserIds?.includes(u.uid));
    return (
      <div data-testid="user-search-input">
        <span>{props.placeholder}</span>
        {filtered.map((u) => (
          <button
            type="button"
            key={u.uid}
            onClick={() => props.onChange(u)}
            data-testid={`search-pick-${u.uid}`}
          >
            {u.displayName}
          </button>
        ))}
      </div>
    );
  },
}));

const NAME_BY_UID: Record<string, string> = {
  'uid-1': 'דניאל כהן',
  'uid-2': 'יואב לוי',
  'uid-3': 'שירה בן-דוד',
  'uid-4': 'New User',
};

import AmmoRecipientsSection from '../AmmoRecipientsSection';

// ─── Helpers ──────────────────────────────────────────────────────────────

function renderSection({
  value = [],
  onSave = jest.fn(async () => {}),
  disabled = false,
}: {
  value?: string[];
  onSave?: jest.Mock;
  disabled?: boolean;
} = {}) {
  const utils = render(
    <AmmoRecipientsSection value={value} onSave={onSave} disabled={disabled} />
  );
  return { ...utils, onSave };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('AmmoRecipientsSection — view mode', () => {
  it('renders the empty state when no recipients are configured', () => {
    renderSection({ value: [] });
    expect(screen.getByText('לא הוגדר מנהל אחראי')).toBeInTheDocument();
  });

  it('renders display names for each recipient uid', () => {
    renderSection({ value: ['uid-1', 'uid-2'] });
    expect(screen.getByText('דניאל כהן')).toBeInTheDocument();
    expect(screen.getByText('יואב לוי')).toBeInTheDocument();
  });

  it('never renders emails', () => {
    renderSection({ value: ['uid-1', 'uid-2'] });
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument();
  });

  it('hides the edit affordance when disabled', () => {
    renderSection({ value: ['uid-1'], disabled: true });
    const editBtn = screen.getByRole('button', { name: 'ערוך מנהלים אחראים לתחמושת' });
    expect(editBtn).toHaveClass('pointer-events-none');
  });
});

describe('AmmoRecipientsSection — edit mode', () => {
  it('shows the search input and X buttons when entering edit mode', () => {
    renderSection({ value: ['uid-1', 'uid-2'] });
    fireEvent.click(screen.getByRole('button', { name: 'ערוך מנהלים אחראים לתחמושת' }));

    expect(screen.getByTestId('user-search-input')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'הסר מנהל' })).toHaveLength(2);
  });

  it('X removes the row from the pending list without calling onSave', () => {
    const onSave = jest.fn();
    renderSection({ value: ['uid-1', 'uid-2'], onSave });
    fireEvent.click(screen.getByRole('button', { name: 'ערוך מנהלים אחראים לתחמושת' }));

    const removeBtns = screen.getAllByRole('button', { name: 'הסר מנהל' });
    fireEvent.click(removeBtns[0]);

    // After removal the row is gone (only one X button left) and the search
    // pool has the just-removed uid available again.
    expect(screen.getAllByRole('button', { name: 'הסר מנהל' })).toHaveLength(1);
    expect(screen.getByText('יואב לוי')).toBeInTheDocument();
    expect(screen.getByTestId('search-pick-uid-1')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('search-add appends a user, and save calls onSave with the resulting array', async () => {
    const onSave = jest.fn(async () => {});
    renderSection({ value: ['uid-1'], onSave });
    fireEvent.click(screen.getByRole('button', { name: 'ערוך מנהלים אחראים לתחמושת' }));

    fireEvent.click(screen.getByTestId('search-pick-uid-2'));
    expect(screen.getByText('יואב לוי')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'שמור' }));
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(['uid-1', 'uid-2']);
  });

  it('excludes already-selected uids from the search', () => {
    renderSection({ value: ['uid-1'] });
    fireEvent.click(screen.getByRole('button', { name: 'ערוך מנהלים אחראים לתחמושת' }));

    expect(screen.queryByTestId('search-pick-uid-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('search-pick-uid-2')).toBeInTheDocument();
  });

  it('cancel reverts pending and exits edit mode', () => {
    const onSave = jest.fn();
    renderSection({ value: ['uid-1'], onSave });
    fireEvent.click(screen.getByRole('button', { name: 'ערוך מנהלים אחראים לתחמושת' }));

    fireEvent.click(screen.getByTestId('search-pick-uid-2'));
    expect(screen.getByText('יואב לוי')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ביטול' }));

    expect(screen.queryByText('יואב לוי')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-search-input')).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('surfaces save errors inline', async () => {
    const onSave = jest.fn(async () => {
      throw new Error('boom');
    });
    renderSection({ value: ['uid-1'], onSave });
    fireEvent.click(screen.getByRole('button', { name: 'ערוך מנהלים אחראים לתחמושת' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'שמור' }));
    });
    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument());
    // Stays in edit mode after a failed save so the user can retry.
    expect(screen.getByTestId('user-search-input')).toBeInTheDocument();
  });
});
