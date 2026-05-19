/**
 * Tests for `AdminDashboard` — verifies the new URL-driven tab persistence
 * (Phase 1 of admin-tabs-persist-and-personnel-rework):
 *   - initial tab read from `?tab=` query param
 *   - unknown / removed slug falls back silently to the default
 *   - clicking a tab updates the URL (router.replace)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────

const mockReplace = jest.fn();
let mockTabParam: string | null = null;

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'tab' ? mockTabParam : null),
  }),
}));

jest.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    message: null,
    showLogoutModal: false,
    login: jest.fn(),
    requestLogout: jest.fn(),
    confirmLogout: jest.fn(),
    cancelLogout: jest.fn(),
    checkSession: jest.fn(),
    clearMessage: jest.fn(),
  }),
}));

// Stub out each tab body so we don't need to mock their dependencies.
jest.mock('../AddPersonnel', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-add-personnel">AddPersonnel</div>,
}));
jest.mock('../BulkUpload', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-bulk-upload">BulkUpload</div>,
}));
jest.mock('../PersonnelTab', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-personnel">PersonnelTab</div>,
}));
jest.mock('../SystemStats', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-system-stats">SystemStats</div>,
}));
jest.mock('../SystemConfigPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-system-config">SystemConfig</div>,
}));

// ConfirmationModal renders nothing when isOpen=false; the test doesn't
// touch it, so a passthrough is enough.
jest.mock('@/components/ui/ConfirmationModal', () => ({
  __esModule: true,
  default: () => null,
}));

import AdminDashboard from '../AdminDashboard';

beforeEach(() => {
  mockReplace.mockReset();
  mockTabParam = null;
});

describe('AdminDashboard — URL tab persistence', () => {
  it('renders the default tab when `?tab=` is missing', () => {
    render(<AdminDashboard onLogout={jest.fn()} />);
    expect(screen.getByTestId('tab-add-personnel')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-personnel')).not.toBeInTheDocument();
  });

  it('honors a valid `?tab=` query param on initial render', () => {
    mockTabParam = 'personnel';
    render(<AdminDashboard onLogout={jest.fn()} />);
    expect(screen.getByTestId('tab-personnel')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-add-personnel')).not.toBeInTheDocument();
  });

  it('falls back to the default when the slug is unknown (e.g. retired `update-personnel`)', () => {
    mockTabParam = 'update-personnel';
    render(<AdminDashboard onLogout={jest.fn()} />);
    expect(screen.getByTestId('tab-add-personnel')).toBeInTheDocument();
  });

  it('updates the URL via router.replace when a tab is clicked', () => {
    render(<AdminDashboard onLogout={jest.fn()} />);

    // The tab strip button label matches the exact Hebrew tab name.
    const personnelBtn = screen.getByRole('button', { name: '👥 כוח אדם' });
    fireEvent.click(personnelBtn);

    expect(mockReplace).toHaveBeenCalledWith('?tab=personnel', { scroll: false });
  });

  it('shows system-stats tab content when `?tab=system-stats`', () => {
    mockTabParam = 'system-stats';
    render(<AdminDashboard onLogout={jest.fn()} />);
    expect(screen.getByTestId('tab-system-stats')).toBeInTheDocument();
  });
});
