/**
 * Tests for `PersonnelFiltersBar` — the search + Disclosure-based filter
 * bar in the merged Personnel tab.
 *
 * Scope:
 *   - search input is always visible
 *   - Disclosure starts closed and toggles open via the SlidersHorizontal button
 *   - the active-filter dot appears when any non-default filter is set
 *   - "Clear" resets every filter to default
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import PersonnelFiltersBar, {
  DEFAULT_FILTERS,
  type PersonnelFilters,
} from '../PersonnelFiltersBar';

function renderBar(initial: Partial<PersonnelFilters> = {}) {
  const onChange = jest.fn();
  const filters: PersonnelFilters = { ...DEFAULT_FILTERS, ...initial };
  const utils = render(
    <PersonnelFiltersBar
      filters={filters}
      onChange={onChange}
      rankOptions={['סמל', 'סרן']}
      userTypeOptions={[
        { value: 'user', label: 'משתמש' },
        { value: 'manager', label: 'מנהל' },
      ]}
    />,
  );
  return { ...utils, onChange, filters };
}

describe('PersonnelFiltersBar', () => {
  it('always renders the search input', () => {
    renderBar();
    expect(
      screen.getByPlaceholderText('חפש לפי שם או טלפון'),
    ).toBeInTheDocument();
  });

  it('Disclosure panel starts closed and reveals dropdowns when toggled', () => {
    renderBar();

    // Filter dropdowns are not in the accessibility tree before the panel opens.
    expect(screen.queryByRole('button', { name: 'דרגה' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'הצג/הסתר מסננים' }));

    expect(screen.getByRole('button', { name: 'דרגה' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'סוג משתמש' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'סטטוס רישום' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'מיון' })).toBeInTheDocument();
  });

  it('shows the active-filter dot when any non-default filter is set', () => {
    renderBar({ rank: 'סמל' });
    const dot = screen.getByLabelText('מסננים פעילים');
    expect(dot).toBeInTheDocument();
  });

  it('does not show the active-filter dot at defaults', () => {
    renderBar();
    expect(screen.queryByLabelText('מסננים פעילים')).not.toBeInTheDocument();
  });

  it('Clear button resets every filter to default', () => {
    const { onChange } = renderBar({
      rank: 'סמל',
      userType: 'manager',
      registration: 'registered',
      sort: 'name_asc',
    });
    fireEvent.click(screen.getByRole('button', { name: 'הצג/הסתר מסננים' }));
    fireEvent.click(screen.getByRole('button', { name: 'נקה' }));

    expect(onChange).toHaveBeenLastCalledWith(DEFAULT_FILTERS);
  });
});
