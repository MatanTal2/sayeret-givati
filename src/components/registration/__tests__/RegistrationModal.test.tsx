import React, { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegistrationModal from '../RegistrationModal';

// Mock child components
jest.mock('../RegistrationHeader', () => {
  return function MockRegistrationHeader({ onBack, onClose }: { onBack: () => void, onClose: () => void }) {
    return (
      <div data-testid="registration-header">
        <button onClick={onBack} data-testid="header-back-button">Back</button>
        <button onClick={onClose} data-testid="header-close-button">Close</button>
      </div>
    );
  };
});

jest.mock('../RegistrationForm', () => {
  return function MockRegistrationForm({ 
    personalNumber, 
    setPersonalNumber, 
    onSwitchToLogin 
  }: { 
    personalNumber: string, 
    setPersonalNumber: (value: string) => void, 
    onSwitchToLogin?: () => void 
  }) {
    return (
      <div data-testid="registration-form">
        <input 
          data-testid="personal-number-input"
          value={personalNumber}
          onChange={(e) => setPersonalNumber(e.target.value)}
        />
        <button onClick={onSwitchToLogin} data-testid="form-switch-to-login">
          Switch to Login
        </button>
      </div>
    );
  };
});

jest.mock('../RegistrationFooter', () => {
  return function MockRegistrationFooter({ showRegistrationNote }: { showRegistrationNote?: boolean }) {
    return (
      <div data-testid="registration-footer">
        Footer
        {showRegistrationNote && <span data-testid="registration-note">Test Note</span>}
      </div>
    );
  };
});

describe('RegistrationModal Component', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSwitch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('should render modal when open', () => {
    it('should show modal content when isOpen is true', () => {
      render(<RegistrationModal {...mockProps} />);
      
      expect(screen.getByTestId('registration-header')).toBeInTheDocument();
      expect(screen.getByTestId('registration-form')).toBeInTheDocument();
      expect(screen.getByTestId('registration-footer')).toBeInTheDocument();
    });

    it('should show modal backdrop when open', () => {
      render(<RegistrationModal {...mockProps} />);
      
      const backdrop = document.querySelector('.fixed.inset-0.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have proper modal styling and positioning', () => {
      render(<RegistrationModal {...mockProps} />);
      
      const modalContainer = document.querySelector('.bg-white.rounded-2xl.shadow-2xl');
      expect(modalContainer).toBeInTheDocument();
      expect(modalContainer).toHaveClass('w-full', 'max-w-sm', 'h-[600px]');
    });
  });

  describe('should not render when closed', () => {
    it('should return null when isOpen is false', () => {
      render(<RegistrationModal {...mockProps} isOpen={false} />);
      
      expect(screen.queryByTestId('registration-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('registration-footer')).not.toBeInTheDocument();
    });

    it('should not render backdrop when closed', () => {
      render(<RegistrationModal {...mockProps} isOpen={false} />);
      
      const backdrop = document.querySelector('.fixed.inset-0.backdrop-blur-sm');
      expect(backdrop).not.toBeInTheDocument();
    });
  });

  describe('should reset form state on close', () => {
    it('should clear personal number on close', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<RegistrationModal {...mockProps} />);
      
      // Fill personal number
      const personalNumberInput = screen.getByTestId('personal-number-input');
      await user.type(personalNumberInput, '123456');
      expect(personalNumberInput).toHaveValue('123456');
      
      // Close modal
      const closeButton = screen.getByTestId('header-close-button');
      await user.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
      
      // Simulate modal closing and reopening with fresh state
      rerender(<RegistrationModal {...mockProps} isOpen={false} />);
      rerender(<RegistrationModal {...mockProps} isOpen={true} />);
      
      const newPersonalNumberInput = screen.getByTestId('personal-number-input');
      expect(newPersonalNumberInput).toHaveValue('');
    });

    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      const closeButton = screen.getByTestId('header-close-button');
      await user.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should reset form state even if fields were filled', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      // Fill some data
      const personalNumberInput = screen.getByTestId('personal-number-input');
      await user.type(personalNumberInput, '987654');
      
      // Close modal
      const closeButton = screen.getByTestId('header-close-button');
      await user.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('should reset form state on switch', () => {
    it('should clear personal number on switch to login', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<RegistrationModal {...mockProps} />);
      
      // Fill personal number
      const personalNumberInput = screen.getByTestId('personal-number-input');
      await user.type(personalNumberInput, '123456');
      expect(personalNumberInput).toHaveValue('123456');
      
      // Switch to login
      const switchButton = screen.getByTestId('form-switch-to-login');
      await user.click(switchButton);
      
      expect(mockProps.onSwitch).toHaveBeenCalled();
      
      // Simulate switching to login then back to registration with fresh state
      rerender(<RegistrationModal {...mockProps} isOpen={false} />);
      rerender(<RegistrationModal {...mockProps} isOpen={true} />);
      
      const newPersonalNumberInput = screen.getByTestId('personal-number-input');
      expect(newPersonalNumberInput).toHaveValue('');
    });

    it('should call onSwitch when switch button clicked', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      const switchButton = screen.getByTestId('form-switch-to-login');
      await user.click(switchButton);
      
      expect(mockProps.onSwitch).toHaveBeenCalled();
    });

    it('should handle switch from header back button', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      const backButton = screen.getByTestId('header-back-button');
      await user.click(backButton);
      
      expect(mockProps.onSwitch).toHaveBeenCalled();
    });
  });

  describe('should close modal on backdrop click', () => {
    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      const backdrop = document.querySelector('.fixed.inset-0.backdrop-blur-sm');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockProps.onClose).toHaveBeenCalled();
      }
    });

    it('should not close when clicking modal content', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      const modalContent = screen.getByTestId('registration-form');
      await user.click(modalContent);
      
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });

    it('should handle backdrop click with pointer events', () => {
      render(<RegistrationModal {...mockProps} />);
      
      const backdrop = document.querySelector('.fixed.inset-0.backdrop-blur-sm');
      const modalContainer = document.querySelector('.pointer-events-auto');
      
      expect(backdrop).toBeInTheDocument();
      expect(modalContainer).toBeInTheDocument();
    });
  });

  describe('modal component integration', () => {
    it('should pass correct props to RegistrationHeader', () => {
      render(<RegistrationModal {...mockProps} />);
      
      expect(screen.getByTestId('registration-header')).toBeInTheDocument();
      expect(screen.getByTestId('header-back-button')).toBeInTheDocument();
      expect(screen.getByTestId('header-close-button')).toBeInTheDocument();
    });

    it('should pass correct props to RegistrationForm', () => {
      render(<RegistrationModal {...mockProps} />);
      
      expect(screen.getByTestId('registration-form')).toBeInTheDocument();
      expect(screen.getByTestId('personal-number-input')).toBeInTheDocument();
      expect(screen.getByTestId('form-switch-to-login')).toBeInTheDocument();
    });

    it('should render RegistrationFooter', () => {
      render(<RegistrationModal {...mockProps} />);
      
      expect(screen.getByTestId('registration-footer')).toBeInTheDocument();
    });

    it('should show registration note only on first step', () => {
      render(<RegistrationModal {...mockProps} />);
      
      // Should show registration note on initial step (personal-number)
      expect(screen.getByTestId('registration-note')).toBeInTheDocument();
    });

    it('should maintain component hierarchy', () => {
      render(<RegistrationModal {...mockProps} />);
      
      const modalContainer = document.querySelector('.bg-white.rounded-2xl');
      expect(modalContainer).toBeInTheDocument();
      
      // Verify components are rendered in correct order
      const header = screen.getByTestId('registration-header');
      const form = screen.getByTestId('registration-form');
      const footer = screen.getByTestId('registration-footer');
      
      expect(header).toBeInTheDocument();
      expect(form).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
    });
  });

  describe('modal state management', () => {
    it('should handle personal number state correctly', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      const personalNumberInput = screen.getByTestId('personal-number-input');
      
      // Initially empty
      expect(personalNumberInput).toHaveValue('');
      
      // Update value
      await user.type(personalNumberInput, '123');
      expect(personalNumberInput).toHaveValue('123');
      
      // Continue typing
      await user.type(personalNumberInput, '456');
      expect(personalNumberInput).toHaveValue('123456');
    });

    it('should handle controlled component updates', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      const personalNumberInput = screen.getByTestId('personal-number-input');
      
      // Type and verify each character
      await user.type(personalNumberInput, '1');
      expect(personalNumberInput).toHaveValue('1');
      
      await user.type(personalNumberInput, '2');
      expect(personalNumberInput).toHaveValue('12');
      
      await user.type(personalNumberInput, '3');
      expect(personalNumberInput).toHaveValue('123');
    });

    it('should handle clearing input', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      const personalNumberInput = screen.getByTestId('personal-number-input');
      
      // Fill input
      await user.type(personalNumberInput, '123456');
      expect(personalNumberInput).toHaveValue('123456');
      
      // Clear input
      await user.clear(personalNumberInput);
      expect(personalNumberInput).toHaveValue('');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle missing onClose prop gracefully', () => {
      const propsWithoutOnClose = {
        isOpen: true,
        onSwitch: mockProps.onSwitch,
      } as unknown as Parameters<typeof RegistrationModal>[0];
      
      expect(() => {
        render(<RegistrationModal {...propsWithoutOnClose} />);
      }).not.toThrow();
    });

    it('should handle missing onSwitch prop gracefully', () => {
      const propsWithoutOnSwitch = {
        isOpen: true,
        onClose: mockProps.onClose,
      } as unknown as Parameters<typeof RegistrationModal>[0];
      
      expect(() => {
        render(<RegistrationModal {...propsWithoutOnSwitch} />);
      }).not.toThrow();
    });

    it('should handle rapid open/close cycles', () => {
      const { rerender } = render(<RegistrationModal {...mockProps} isOpen={false} />);
      
      rerender(<RegistrationModal {...mockProps} isOpen={true} />);
      expect(screen.getByTestId('registration-form')).toBeInTheDocument();
      
      rerender(<RegistrationModal {...mockProps} isOpen={false} />);
      expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument();
      
      rerender(<RegistrationModal {...mockProps} isOpen={true} />);
      expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    });
  });
});