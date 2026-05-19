import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InfoPopover from '../InfoPopover';

jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    FEATURES: {
      EQUIPMENT: {
        STORAGE: {
          INFO_BUBBLE_LABEL: 'Info',
        },
      },
    },
  },
}));

describe('InfoPopover', () => {
  it('renders a trigger button with the default aria-label', () => {
    render(<InfoPopover content="Why disabled" />);
    expect(screen.getByRole('button', { name: 'Info' })).toBeInTheDocument();
  });

  it('uses the custom aria-label when provided', () => {
    render(<InfoPopover content="Why disabled" ariaLabel="More info" />);
    expect(screen.getByRole('button', { name: 'More info' })).toBeInTheDocument();
  });

  it('panel content is hidden until the trigger is clicked', () => {
    render(<InfoPopover content="Item is in storage" />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Info' }));

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('Item is in storage');
  });
});
