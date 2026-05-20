import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EquipmentToolbar from '../EquipmentToolbar';

jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    FEATURES: {
      EQUIPMENT: {
        ADD_NEW: 'Add item',
        ARCHIVE: {
          SHOW_ACTIVE: 'Active equipment',
          SHOW_ARCHIVE: 'Archive',
          TOGGLE_ARIA: 'Toggle archive view',
        },
      },
    },
  },
}));

describe('EquipmentToolbar', () => {
  it('renders the active label when view=active and Switch is on (colored)', () => {
    render(
      <EquipmentToolbar
        view="active"
        onViewChange={jest.fn()}
        archiveCount={0}
        onAddClick={jest.fn()}
        canAdd
      />,
    );

    const sw = screen.getByRole('switch', { name: 'Toggle archive view' });
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Active equipment')).toBeInTheDocument();
    expect(screen.queryByText('Archive')).not.toBeInTheDocument();
  });

  it('calls onViewChange("archive") and shows the archive label after toggle', () => {
    const onViewChange = jest.fn();
    const { rerender } = render(
      <EquipmentToolbar
        view="active"
        onViewChange={onViewChange}
        archiveCount={3}
        onAddClick={jest.fn()}
        canAdd
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Toggle archive view' }));
    expect(onViewChange).toHaveBeenCalledWith('archive');

    rerender(
      <EquipmentToolbar
        view="archive"
        onViewChange={onViewChange}
        archiveCount={3}
        onAddClick={jest.fn()}
        canAdd
      />,
    );
    expect(screen.getByText('Archive')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('toggling on from archive calls onViewChange("active")', () => {
    const onViewChange = jest.fn();
    render(
      <EquipmentToolbar
        view="archive"
        onViewChange={onViewChange}
        archiveCount={2}
        onAddClick={jest.fn()}
        canAdd
      />,
    );

    fireEvent.click(screen.getByRole('switch'));
    expect(onViewChange).toHaveBeenCalledWith('active');
  });

  it('shows the archive count badge when in archive view and archiveCount > 0', () => {
    render(
      <EquipmentToolbar
        view="archive"
        onViewChange={jest.fn()}
        archiveCount={7}
        onAddClick={jest.fn()}
        canAdd
      />,
    );
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('hides the archive count badge while viewing active list', () => {
    render(
      <EquipmentToolbar
        view="active"
        onViewChange={jest.fn()}
        archiveCount={7}
        onAddClick={jest.fn()}
        canAdd
      />,
    );
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });

  it('hides the archive count badge when archiveCount = 0', () => {
    render(
      <EquipmentToolbar
        view="archive"
        onViewChange={jest.fn()}
        archiveCount={0}
        onAddClick={jest.fn()}
        canAdd
      />,
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onAddClick when Add item is clicked', () => {
    const onAddClick = jest.fn();
    render(
      <EquipmentToolbar
        view="active"
        onViewChange={jest.fn()}
        archiveCount={0}
        onAddClick={onAddClick}
        canAdd
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /add item/i }));
    expect(onAddClick).toHaveBeenCalledTimes(1);
  });

  it('hides the Add item button when canAdd=false', () => {
    render(
      <EquipmentToolbar
        view="active"
        onViewChange={jest.fn()}
        archiveCount={0}
        onAddClick={jest.fn()}
        canAdd={false}
      />,
    );
    expect(screen.queryByRole('button', { name: /add item/i })).not.toBeInTheDocument();
  });
});
