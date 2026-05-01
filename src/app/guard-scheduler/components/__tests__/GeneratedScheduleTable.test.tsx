import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GeneratedScheduleTable from '../GeneratedScheduleTable';
import type { GenerationResult, RosterPerson } from '@/types/guardSchedule';

const roster: RosterPerson[] = [
  { id: 'a', source: 'firestore', displayName: 'Alpha' },
  { id: 'b', source: 'firestore', displayName: 'Bravo' },
];

const result: GenerationResult = {
  shifts: [
    {
      id: 'p1_0',
      postId: 'p1',
      postName: 'שער ראשי',
      start: '2026-05-02T18:00',
      end: '2026-05-02T20:00',
      requiredHeadcount: 1,
    },
  ],
  assignments: [
    { shiftId: 'p1_0', personIds: ['a'], locked: false },
  ],
  stats: [
    { personId: 'a', shiftsAssigned: 1, totalHours: 2 },
    { personId: 'b', shiftsAssigned: 0, totalHours: 0 },
  ],
  fairnessScore: 1,
  warnings: [],
};

describe('GeneratedScheduleTable', () => {
  it('renders shifts and assigned names', () => {
    render(
      <GeneratedScheduleTable
        result={result}
        roster={roster}
        onSwap={() => {}}
        onLockToggle={() => {}}
        onRegenerateFresh={() => {}}
        onRegenerateKeepLocks={() => {}}
      />,
    );
    expect(screen.getByText('שער ראשי')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('opens manual swap dialog when assignee clicked', () => {
    render(
      <GeneratedScheduleTable
        result={result}
        roster={roster}
        onSwap={() => {}}
        onLockToggle={() => {}}
        onRegenerateFresh={() => {}}
        onRegenerateKeepLocks={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Alpha'));
    expect(screen.getByText(/החלפת משתתף/)).toBeInTheDocument();
  });

  it('toggles lock via the lock button', () => {
    const onLock = jest.fn();
    render(
      <GeneratedScheduleTable
        result={result}
        roster={roster}
        onSwap={() => {}}
        onLockToggle={onLock}
        onRegenerateFresh={() => {}}
        onRegenerateKeepLocks={() => {}}
      />,
    );
    fireEvent.click(screen.getByText(/^נעל$/));
    expect(onLock).toHaveBeenCalledWith('p1_0', true);
  });

  it('renders warnings region when present', () => {
    const withWarnings: GenerationResult = {
      ...result,
      warnings: [{ code: 'roster_too_small', message: 'tiny' }],
    };
    render(
      <GeneratedScheduleTable
        result={withWarnings}
        roster={roster}
        onSwap={() => {}}
        onLockToggle={() => {}}
        onRegenerateFresh={() => {}}
        onRegenerateKeepLocks={() => {}}
      />,
    );
    expect(screen.getByText(/אזהרות/)).toBeInTheDocument();
  });
});
