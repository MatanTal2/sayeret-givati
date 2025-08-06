/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddEquipmentForm from '../AddEquipmentForm';

// Mock the services
jest.mock('@/lib/itemTypesService', () => ({
  ItemTypesService: {
    getAllItemTypes: jest.fn(() => Promise.resolve([
      {
        id: 'TEMPLATE_RADIO_PRC-152',
        category: 'radio',
        model: 'PRC-152',
        manufacturer: 'Harris',
        assignmentType: 'team',
        defaultDepot: 'Radio Depot',
        defaultStatus: 'work'
      },
      {
        id: 'TEMPLATE_OPTICS_ACOG',
        category: 'optics',
        model: 'ACOG 4x32',
        manufacturer: 'Trijicon',
        assignmentType: 'personal',
        defaultDepot: 'Optics Depot',
        defaultStatus: 'work'
      }
    ]))
  }
}));

jest.mock('@/lib/equipmentService', () => ({
  EquipmentService: {
    createEquipment: jest.fn(() => Promise.resolve({
      success: true,
      message: 'Equipment created successfully',
      equipmentId: 'EQ-TEST-001'
    }))
  }
}));

// Mock LoadingSpinner component
jest.mock('@/app/components/LoadingSpinner', () => {
  return function MockLoadingSpinner({ size }: { size?: string }) {
    return <div data-testid="loading-spinner" data-size={size}>Loading...</div>;
  };
});

describe('AddEquipmentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form with loading state initially', async () => {
    render(<AddEquipmentForm />);
    
    expect(screen.getByText('Loading equipment templates...')).toBeInTheDocument();
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Add New Equipment')).toBeInTheDocument();
    });
  });

  test('displays templates after loading', async () => {
    render(<AddEquipmentForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Harris PRC-152')).toBeInTheDocument();
      expect(screen.getByText('Trijicon ACOG 4x32')).toBeInTheDocument();
    });
  });

  test('shows template selection interface', async () => {
    render(<AddEquipmentForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Select Equipment Template *')).toBeInTheDocument();
      expect(screen.getByText('RADIO:')).toBeInTheDocument();
      expect(screen.getByText('OPTICS:')).toBeInTheDocument();
    });
  });

  test('pre-fills form when template is selected', async () => {
    render(<AddEquipmentForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Harris PRC-152')).toBeInTheDocument();
    });

    // Click on radio template
    fireEvent.click(screen.getByText('Harris PRC-152'));

    await waitFor(() => {
      // Check that template details are shown
      expect(screen.getByText('Template Details')).toBeInTheDocument();
      expect(screen.getByText('radio')).toBeInTheDocument();
      expect(screen.getByText('PRC-152')).toBeInTheDocument();
      expect(screen.getByText('Harris')).toBeInTheDocument();
      
      // Check that form fields are visible and pre-filled
      expect(screen.getByDisplayValue('Radio Depot')).toBeInTheDocument();
      expect(screen.getByDisplayValue('work')).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    render(<AddEquipmentForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Harris PRC-152')).toBeInTheDocument();
    });

    // Select template
    fireEvent.click(screen.getByText('Harris PRC-152'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Equipment/i })).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /Create Equipment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Assigned User ID is required')).toBeInTheDocument();
    });
  });

  test('generates suggested equipment ID', async () => {
    render(<AddEquipmentForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Harris PRC-152')).toBeInTheDocument();
    });

    // Select template
    fireEvent.click(screen.getByText('Harris PRC-152'));

    await waitFor(() => {
      const idInput = screen.getByLabelText('Equipment ID *') as HTMLInputElement;
      expect(idInput.value).toMatch(/^EQ-RAD-\d{6}$/);
    });
  });

  test('calls onSuccess when equipment is created successfully', async () => {
    const mockOnSuccess = jest.fn();
    render(<AddEquipmentForm onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText('Harris PRC-152')).toBeInTheDocument();
    });

    // Select template
    fireEvent.click(screen.getByText('Harris PRC-152'));

    await waitFor(() => {
      expect(screen.getByLabelText('Assigned User ID *')).toBeInTheDocument();
    });

    // Fill required fields
    fireEvent.change(screen.getByLabelText('Assigned User ID *'), {
      target: { value: 'test-user-001' }
    });

    fireEvent.change(screen.getByLabelText('Assigned User Name'), {
      target: { value: 'Test User' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Equipment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('EQ-TEST-001');
    });
  });

  test('resets form after successful submission', async () => {
    render(<AddEquipmentForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Harris PRC-152')).toBeInTheDocument();
    });

    // Select template and fill form
    fireEvent.click(screen.getByText('Harris PRC-152'));

    await waitFor(() => {
      expect(screen.getByLabelText('Assigned User ID *')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Assigned User ID *'), {
      target: { value: 'test-user-001' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Equipment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Equipment created successfully/)).toBeInTheDocument();
    });

    // Check that form is reset
    expect(screen.queryByText('Template Details')).not.toBeInTheDocument();
    const userIdInput = screen.getByLabelText('Assigned User ID *') as HTMLInputElement;
    expect(userIdInput.value).toBe('');
  });

  test('handles form reset button', async () => {
    render(<AddEquipmentForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Harris PRC-152')).toBeInTheDocument();
    });

    // Select template and fill form
    fireEvent.click(screen.getByText('Harris PRC-152'));

    await waitFor(() => {
      expect(screen.getByLabelText('Assigned User ID *')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Assigned User ID *'), {
      target: { value: 'test-user-001' }
    });

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /Reset Form/i });
    fireEvent.click(resetButton);

    // Check that form is reset
    expect(screen.queryByText('Template Details')).not.toBeInTheDocument();
    const userIdInput = screen.getByLabelText('Assigned User ID *') as HTMLInputElement;
    expect(userIdInput.value).toBe('');
  });

  test('calls onCancel when cancel button is clicked', async () => {
    const mockOnCancel = jest.fn();
    render(<AddEquipmentForm onCancel={mockOnCancel} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('shows loading state during submission', async () => {
    // Mock a delayed response
    const { EquipmentService } = await import('@/lib/equipmentService');
    EquipmentService.createEquipment.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        message: 'Equipment created successfully',
        equipmentId: 'EQ-TEST-001'
      }), 100))
    );

    render(<AddEquipmentForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Harris PRC-152')).toBeInTheDocument();
    });

    // Select template and fill form
    fireEvent.click(screen.getByText('Harris PRC-152'));

    await waitFor(() => {
      expect(screen.getByLabelText('Assigned User ID *')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Assigned User ID *'), {
      target: { value: 'test-user-001' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Equipment/i });
    fireEvent.click(submitButton);

    // Check loading state
    expect(screen.getByText('Creating Equipment...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/Equipment created successfully/)).toBeInTheDocument();
    });
  });
});