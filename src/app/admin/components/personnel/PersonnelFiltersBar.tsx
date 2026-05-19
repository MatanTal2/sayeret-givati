'use client';

import React, { useEffect, useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { SlidersHorizontal } from 'lucide-react';
import { Select } from '@/components/ui';
import { TEXT_CONSTANTS } from '@/constants/text';
import { cn } from '@/lib/cn';

export type RegistrationFilter = 'all' | 'registered' | 'pending';

export type PersonnelSortKey =
  | 'created_desc'
  | 'created_asc'
  | 'name_asc'
  | 'name_desc'
  | 'rank_desc'
  | 'rank_asc';

export interface PersonnelFilters {
  searchTerm: string;
  rank: string;
  userType: string;
  registration: RegistrationFilter;
  sort: PersonnelSortKey;
}

export const DEFAULT_FILTERS: PersonnelFilters = {
  searchTerm: '',
  rank: '',
  userType: '',
  registration: 'all',
  sort: 'created_desc',
};

interface PersonnelFiltersBarProps {
  filters: PersonnelFilters;
  onChange: (next: PersonnelFilters) => void;
  /** Distinct rank values present in the loaded data. */
  rankOptions: string[];
  /** Distinct user-type values present in the loaded data + their display labels. */
  userTypeOptions: { value: string; label: string }[];
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search + filter toggle + collapsible (Headless UI Disclosure) filter grid
 * for the merged Personnel tab.
 *
 * Controlled component — state lives in `PersonnelTab`. Search input is
 * locally debounced (300ms) before propagating to the parent.
 */
export default function PersonnelFiltersBar({
  filters,
  onChange,
  rankOptions,
  userTypeOptions,
}: PersonnelFiltersBarProps) {
  const labels = TEXT_CONSTANTS.FEATURES.ADMIN.PERSONNEL;

  // Debounce the search input locally before pushing to the parent so the
  // filtered list doesn't recompute on every keystroke.
  const [localSearch, setLocalSearch] = useState(filters.searchTerm);
  useEffect(() => {
    setLocalSearch(filters.searchTerm);
  }, [filters.searchTerm]);
  useEffect(() => {
    if (localSearch === filters.searchTerm) return;
    const t = window.setTimeout(() => {
      onChange({ ...filters, searchTerm: localSearch });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
    // intentionally omit `filters`/`onChange` to avoid restarting the timer
    // on every parent re-render; the localSearch change drives the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const sortOptions: { value: PersonnelSortKey; label: string }[] = [
    { value: 'created_desc', label: labels.SORT_OPTIONS.CREATED_DESC },
    { value: 'created_asc', label: labels.SORT_OPTIONS.CREATED_ASC },
    { value: 'name_asc', label: labels.SORT_OPTIONS.NAME_ASC },
    { value: 'name_desc', label: labels.SORT_OPTIONS.NAME_DESC },
    { value: 'rank_desc', label: labels.SORT_OPTIONS.RANK_DESC },
    { value: 'rank_asc', label: labels.SORT_OPTIONS.RANK_ASC },
  ];

  const registrationOptions: { value: RegistrationFilter; label: string }[] = [
    { value: 'all', label: labels.REG_ALL },
    { value: 'registered', label: labels.REG_REGISTERED },
    { value: 'pending', label: labels.REG_PENDING },
  ];

  const nonDefaultActive =
    filters.rank !== '' ||
    filters.userType !== '' ||
    filters.registration !== 'all' ||
    filters.sort !== 'created_desc';

  const reset = () => {
    setLocalSearch('');
    onChange({ ...DEFAULT_FILTERS });
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-3 space-y-3">
      <Disclosure>
        {({ open }) => (
          <>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={labels.SEARCH_PLACEHOLDER}
                aria-label={labels.SEARCH_PLACEHOLDER}
                className="input-base flex-1 text-sm"
              />
              <DisclosureButton
                aria-label={labels.FILTER_TOGGLE_ARIA}
                className={cn(
                  'btn-ghost relative !px-2 !py-2',
                  open && 'bg-neutral-100',
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {nonDefaultActive && (
                  <span
                    aria-label={labels.FILTERS_ACTIVE_DOT_ARIA}
                    className="absolute top-1 end-1 w-2 h-2 rounded-full bg-primary-500"
                  />
                )}
              </DisclosureButton>
            </div>

            <DisclosurePanel className="pt-2 border-t border-neutral-100 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                <Select
                  value={filters.rank || null}
                  onChange={(v) => onChange({ ...filters, rank: v ?? '' })}
                  options={rankOptions.map((r) => ({ value: r, label: r }))}
                  placeholder={labels.FILTER_RANK_PLACEHOLDER}
                  clearable
                  ariaLabel={labels.FILTER_RANK_LABEL}
                />
                <Select
                  value={filters.userType || null}
                  onChange={(v) => onChange({ ...filters, userType: v ?? '' })}
                  options={userTypeOptions}
                  placeholder={labels.FILTER_USER_TYPE_PLACEHOLDER}
                  clearable
                  ariaLabel={labels.FILTER_USER_TYPE_LABEL}
                />
                <Select
                  value={filters.registration}
                  onChange={(v) => v && onChange({ ...filters, registration: v as RegistrationFilter })}
                  options={registrationOptions}
                  ariaLabel={labels.FILTER_REGISTRATION_LABEL}
                />
                <Select
                  value={filters.sort}
                  onChange={(v) => v && onChange({ ...filters, sort: v as PersonnelSortKey })}
                  options={sortOptions}
                  ariaLabel={labels.SORT_LABEL}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={reset}
                  className="btn-ghost text-sm"
                >
                  {labels.CLEAR_FILTERS}
                </button>
              </div>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </div>
  );
}
