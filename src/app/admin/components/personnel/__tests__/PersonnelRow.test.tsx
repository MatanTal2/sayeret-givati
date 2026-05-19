/**
 * Tests for `PersonnelRow` — the collapsible/expandable personnel row.
 *
 * Scope:
 *   - collapsed view shows only registration dot + name + user-type badge + 3-dots
 *   - expanding reveals the field grid (view mode)
 *   - opening the actions menu and clicking "edit" calls onStartEdit
 *   - edit mode swaps the field values for inputs
 *   - save calls onSave with the modified payload
 *   - cancel calls onCancelEdit (and does not call onSave)
 */

import React from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Timestamp } from 'firebase/firestore';

import PersonnelRow from '../PersonnelRow';
import { UserType } from '@/types/user';
import type { AuthorizedPersonnel } from '@/types/admin';
import { UserRole } from '@/types/equipment';

function makePerson(overrides: Partial<AuthorizedPersonnel> = {}): AuthorizedPersonnel {
  // Minimal shape sufficient for row rendering. createdAt is a stub with
  // toDate() since the row uses it for the formatted date field.
  const createdAt = {
    toDate: () => new Date('2026-01-15T10:00:00Z'),
  } as unknown as Timestamp;
  return {
    id: 'p1',
    militaryPersonalNumberHash: 'hash-1',
    firstName: 'יוסי',
    lastName: 'כהן',
    rank: 'סמל',
    phoneNumber: '0501234567',
    userType: UserType.USER,
    approvedRole: UserRole.SOLDIER,
    roleStatus: 'approved',
    status: 'active',
    registered: true,
    joinDate: createdAt,
    createdAt,
    createdBy: 'admin',
    ...overrides,
  };
}

interface RenderOpts {
  expanded?: boolean;
  editing?: boolean;
  isSaving?: boolean;
  person?: AuthorizedPersonnel;
}

function renderRow(opts: RenderOpts = {}) {
  const onToggleExpand = jest.fn();
  const onCollapse = jest.fn();
  const onStartEdit = jest.fn();
  const onCancelEdit = jest.fn();
  const onDelete = jest.fn();
  const onSave = jest.fn(async () => {});
  const person = opts.person ?? makePerson();
  const utils = render(
    <ul>
      <PersonnelRow
        person={person}
        expanded={opts.expanded ?? false}
        editing={opts.editing ?? false}
        isSaving={opts.isSaving ?? false}
        onToggleExpand={onToggleExpand}
        onCollapse={onCollapse}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        onDelete={onDelete}
        onSave={onSave}
      />
    </ul>,
  );
  return {
    ...utils,
    onToggleExpand,
    onCollapse,
    onStartEdit,
    onCancelEdit,
    onDelete,
    onSave,
    person,
  };
}

describe('PersonnelRow — collapsed', () => {
  it('shows name, rank, user-type badge, and the 3-dots trigger', () => {
    renderRow();
    // Header row exposes name + rank inline
    expect(screen.getByText('יוסי כהן')).toBeInTheDocument();
    // user-type badge uses the label from USER_TYPE_OPTIONS
    expect(screen.getByText('משתמש')).toBeInTheDocument();
    // 3-dots actions trigger
    expect(screen.getByRole('button', { name: 'פעולות נוספות' })).toBeInTheDocument();
  });

  it('does not render the expanded grid in the collapsed state', () => {
    renderRow();
    expect(screen.queryByText('סטטוס רישום')).not.toBeInTheDocument();
    expect(screen.queryByText('תאריך הוספה')).not.toBeInTheDocument();
  });
});

describe('PersonnelRow — expanded view', () => {
  it('reveals the view-mode field grid', () => {
    renderRow({ expanded: true });
    // Field labels rendered as uppercase tracking text.
    expect(screen.getByText('מספר טלפון')).toBeInTheDocument();
    expect(screen.getByText('דרגה')).toBeInTheDocument();
    expect(screen.getByText('סטטוס רישום')).toBeInTheDocument();
    expect(screen.getByText('תאריך הוספה')).toBeInTheDocument();
  });
});

describe('PersonnelRow — actions menu', () => {
  it('opening the menu and clicking edit calls onStartEdit', async () => {
    const { onStartEdit } = renderRow();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'פעולות נוספות' }));
    });
    const editItem = await screen.findByRole('menuitem', { name: 'ערוך' });
    fireEvent.click(within(editItem).getByText('ערוך'));
    expect(onStartEdit).toHaveBeenCalledTimes(1);
  });

  it('clicking delete calls onDelete', async () => {
    const { onDelete } = renderRow();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'פעולות נוספות' }));
    });
    const deleteItem = await screen.findByRole('menuitem', { name: 'מחק' });
    fireEvent.click(within(deleteItem).getByText('מחק'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe('PersonnelRow — edit mode', () => {
  it('swaps view labels for inputs', () => {
    renderRow({ expanded: true, editing: true });
    // First/last name inputs visible
    const firstNameLabel = screen.getByText('שם פרטי');
    expect(firstNameLabel).toBeInTheDocument();
    const firstNameInput = firstNameLabel.parentElement?.querySelector('input');
    expect(firstNameInput).toBeInTheDocument();
    expect(firstNameInput).toHaveValue('יוסי');
  });

  it('save calls onSave with only the changed fields', async () => {
    const { onSave } = renderRow({ expanded: true, editing: true });
    const lastNameInput = screen.getByText('שם משפחה').parentElement?.querySelector('input');
    if (!lastNameInput) throw new Error('expected last-name input');
    fireEvent.change(lastNameInput, { target: { value: 'לוי' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'שמור' }));
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ lastName: 'לוי' });
  });

  it('cancel calls onCancelEdit (and not onSave)', () => {
    const { onCancelEdit, onSave } = renderRow({ expanded: true, editing: true });
    fireEvent.click(screen.getByRole('button', { name: 'ביטול' }));
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows a validation error when the name is invalid (e.g. Latin letters)', async () => {
    const { onSave } = renderRow({ expanded: true, editing: true });
    const firstNameInput = screen.getByText('שם פרטי').parentElement?.querySelector('input');
    if (!firstNameInput) throw new Error('expected first-name input');
    fireEvent.change(firstNameInput, { target: { value: 'Yossi' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'שמור' }));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
