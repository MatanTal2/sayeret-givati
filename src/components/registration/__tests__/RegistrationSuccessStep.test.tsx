import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegistrationSuccessStep from '../RegistrationSuccessStep';

// Mock text constants
jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    AUTH: {
      REGISTRATION_SUCCESS: 'הרשמה בוצעה בהצלחה!',
      CONTINUE_TO_SYSTEM: 'המשך למערכת',
    },
  },
}));

describe('RegistrationSuccessStep Component', () => {
  const mockProps = {
    onContinue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('should display success message', () => {
    it('should render success checkmark icon', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      // Check for the checkmark icon container
      const iconContainer = document.querySelector('.w-20.h-20.bg-gradient-to-br.from-green-400.to-green-600');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('rounded-full', 'flex', 'items-center', 'justify-center');
      
      // Check for the SVG checkmark icon
      const checkmarkIcon = iconContainer?.querySelector('svg');
      expect(checkmarkIcon).toBeInTheDocument();
      expect(checkmarkIcon).toHaveClass('w-10', 'h-10', 'text-white');
    });

    it('should display success message text', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const successMessage = screen.getByTestId('success-message');
      expect(successMessage).toBeInTheDocument();
      expect(successMessage).toHaveTextContent('הרשמה בוצעה בהצלחה!');
    });

    it('should have proper success message styling', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const successMessage = screen.getByTestId('success-message');
      expect(successMessage).toHaveClass(
        'text-2xl',
        'font-bold',
        'text-gray-900',
        'mb-8'
      );
    });

    it('should display success message with proper structure', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      // Check for proper header container
      const headerContainer = document.querySelector('.text-center.px-6.pb-4');
      expect(headerContainer).toBeInTheDocument();
      
      // Check message exists within header
      const successMessage = screen.getByTestId('success-message');
      expect(headerContainer).toContainElement(successMessage);
    });

    it('should render checkmark with correct SVG path', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const checkmarkPath = document.querySelector('path[d="M5 13l4 4L19 7"]');
      expect(checkmarkPath).toBeInTheDocument();
      expect(checkmarkPath).toHaveAttribute('stroke-linecap', 'round');
      expect(checkmarkPath).toHaveAttribute('stroke-linejoin', 'round');
      expect(checkmarkPath).toHaveAttribute('stroke-width', '3');
    });

    it('should show success icon with gradient background', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-green-400.to-green-600');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('w-20', 'h-20', 'rounded-full');
    });
  });

  describe('should handle continue button click', () => {
    it('should render continue button with correct text', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toBeInTheDocument();
      expect(continueButton).toHaveTextContent('המשך למערכת');
    });

    it('should call onContinue when continue button clicked', async () => {
      const user = userEvent.setup();
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      await user.click(continueButton);
      
      expect(mockProps.onContinue).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks on continue button', async () => {
      const user = userEvent.setup();
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      
      await user.click(continueButton);
      await user.click(continueButton);
      await user.click(continueButton);
      
      expect(mockProps.onContinue).toHaveBeenCalledTimes(3);
    });

    it('should have proper continue button styling', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toHaveClass(
        'w-full',
        'py-3',
        'px-4',
        'font-semibold',
        'rounded-xl',
        'btn-press',
        'focus-ring',
        'flex',
        'items-center',
        'justify-center',
        'gap-2',
        'transition-all',
        'duration-200',
        'bg-gradient-to-r',
        'from-green-600',
        'to-green-700',
        'text-white'
      );
    });

    it('should render continue button with arrow icon', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      const arrowIcon = continueButton.querySelector('svg');
      
      expect(arrowIcon).toBeInTheDocument();
      expect(arrowIcon).toHaveClass('w-5', 'h-5');
      
      const arrowPath = arrowIcon?.querySelector('path[d="M13 7l5 5m0 0l-5 5m5-5H6"]');
      expect(arrowPath).toBeInTheDocument();
    });

    it('should log TODO message when continue clicked', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      await user.click(continueButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('TODO: redirect to home page');
      
      consoleSpy.mockRestore();
    });

    it('should be a button element with correct type', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton.tagName).toBe('BUTTON');
      expect(continueButton).toHaveAttribute('type', 'button');
    });
  });

  describe('should handle missing props gracefully', () => {
    it('should handle missing onContinue prop without crashing', () => {
      expect(() => {
        render(<RegistrationSuccessStep />);
      }).not.toThrow();
    });

    it('should not call onContinue when prop is missing', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationSuccessStep />);
      
      const continueButton = screen.getByTestId('continue-button');
      await user.click(continueButton);
      
      // Should only log the TODO message, no callback called
      expect(consoleSpy).toHaveBeenCalledWith('TODO: redirect to home page');
      
      consoleSpy.mockRestore();
    });

    it('should still render all elements when onContinue is undefined', () => {
      render(<RegistrationSuccessStep onContinue={undefined} />);
      
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByTestId('continue-button')).toBeInTheDocument();
    });

    it('should handle onClick when onContinue is null', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationSuccessStep onContinue={undefined} />);
      
      const continueButton = screen.getByTestId('continue-button');
      await user.click(continueButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('TODO: redirect to home page');
      
      consoleSpy.mockRestore();
    });
  });

  describe('component structure and layout', () => {
    it('should render proper component structure', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      // Check for main containers
      const headerContainer = document.querySelector('.text-center.px-6.pb-4');
      const buttonContainer = document.querySelector('.px-6.pb-5');
      
      expect(headerContainer).toBeInTheDocument();
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should have proper spacing and layout classes', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const iconContainer = document.querySelector('.w-20.h-20');
      expect(iconContainer).toHaveClass('mx-auto', 'mb-6');
      
      const successMessage = screen.getByTestId('success-message');
      expect(successMessage).toHaveClass('mb-8');
    });

    it('should render all visual elements in correct order', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const container = document.body;
      const elements = container.querySelectorAll('*');
      
      // Find indexes of key elements
      let iconIndex = -1;
      let messageIndex = -1;
      let buttonIndex = -1;
      
      elements.forEach((element, index) => {
        if (element.classList.contains('w-20') && element.classList.contains('h-20')) {
          iconIndex = index;
        }
        if (element.getAttribute('data-testid') === 'success-message') {
          messageIndex = index;
        }
        if (element.getAttribute('data-testid') === 'continue-button') {
          buttonIndex = index;
        }
      });
      
      // Icon should come before message, message before button
      expect(iconIndex).toBeLessThan(messageIndex);
      expect(messageIndex).toBeLessThan(buttonIndex);
    });

    it('should have accessible structure', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const successMessage = screen.getByTestId('success-message');
      expect(successMessage.tagName).toBe('H3');
      
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton.tagName).toBe('BUTTON');
      expect(continueButton).toHaveAttribute('type', 'button');
    });
  });

  describe('success state verification', () => {
    it('should indicate completed registration state', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      // Presence of success message indicates completion
      const successMessage = screen.getByTestId('success-message');
      expect(successMessage).toHaveTextContent('הרשמה בוצעה בהצלחה!');
      
      // Green theme indicates success
      const iconContainer = document.querySelector('.from-green-400.to-green-600');
      expect(iconContainer).toBeInTheDocument();
      
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toHaveClass('from-green-600', 'to-green-700');
    });

    it('should show final step UI elements', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      // Final step should have prominent success display
      const successMessage = screen.getByTestId('success-message');
      expect(successMessage).toHaveClass('text-2xl', 'font-bold');
      
      // Large success icon
      const iconContainer = document.querySelector('.w-20.h-20');
      expect(iconContainer).toBeInTheDocument();
      
      // Prominent continue button
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toHaveClass('w-full');
    });

    it('should use success-themed colors throughout', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      // Success icon with green gradient
      const iconContainer = document.querySelector('.from-green-400.to-green-600');
      expect(iconContainer).toBeInTheDocument();
      
      // Success button with green gradient
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toHaveClass('from-green-600', 'to-green-700');
      
      // White checkmark on green background
      const checkmarkIcon = document.querySelector('.text-white svg');
      expect(checkmarkIcon).toBeInTheDocument();
    });
  });

  describe('flow completion testing', () => {
    it('should represent end of registration flow', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      // Success step is final - only has continue button, no back navigation
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toBeInTheDocument();
      
      // No back button or other navigation elements
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });

    it('should trigger system continuation on button click', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      await user.click(continueButton);
      
      // Should log continuation intent
      expect(consoleSpy).toHaveBeenCalledWith('TODO: redirect to home page');
      
      // Should call parent continuation handler
      expect(mockProps.onContinue).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should enable user progression to main system', async () => {
      const user = userEvent.setup();
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      
      // Button should be ready for interaction
      expect(continueButton).not.toBeDisabled();
      expect(continueButton).toBeVisible();
      
      // Should respond to click
      await user.click(continueButton);
      expect(mockProps.onContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('user experience and feedback', () => {
    it('should provide clear success feedback', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      // Clear visual success indicator
      const iconContainer = document.querySelector('.w-20.h-20.bg-gradient-to-br');
      expect(iconContainer).toBeInTheDocument();
      
      // Clear textual success message
      const successMessage = screen.getByTestId('success-message');
      expect(successMessage).toHaveTextContent('הרשמה בוצעה בהצלחה!');
      
      // Clear call-to-action
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toHaveTextContent('המשך למערכת');
    });

    it('should have proper visual hierarchy', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      // Large prominent icon
      const iconContainer = document.querySelector('.w-20.h-20');
      expect(iconContainer).toBeInTheDocument();
      
      // Large prominent message
      const successMessage = screen.getByTestId('success-message');
      expect(successMessage).toHaveClass('text-2xl', 'font-bold');
      
      // Full-width prominent button
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toHaveClass('w-full', 'py-3', 'font-semibold');
    });

    it('should indicate completion and next steps', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      // Completion message in Hebrew
      const successMessage = screen.getByTestId('success-message');
      expect(successMessage).toHaveTextContent('הרשמה בוצעה בהצלחה!');
      
      // Next step indication
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toHaveTextContent('המשך למערכת');
      
      // Forward arrow indicating progression
      const arrowIcon = continueButton.querySelector('path[d="M13 7l5 5m0 0l-5 5m5-5H6"]');
      expect(arrowIcon).toBeInTheDocument();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle rapid clicking without issues', async () => {
      const user = userEvent.setup();
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      
      // Rapid clicks
      await user.click(continueButton);
      await user.click(continueButton);
      await user.click(continueButton);
      await user.click(continueButton);
      await user.click(continueButton);
      
      expect(mockProps.onContinue).toHaveBeenCalledTimes(5);
    });

    it('should render consistently across re-renders', () => {
      const { rerender } = render(<RegistrationSuccessStep {...mockProps} />);
      
      // Initial render
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByTestId('continue-button')).toBeInTheDocument();
      
      // Re-render with same props
      rerender(<RegistrationSuccessStep {...mockProps} />);
      
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByTestId('continue-button')).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<RegistrationSuccessStep {...mockProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      
      // Focus and activate with keyboard
      continueButton.focus();
      expect(continueButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockProps.onContinue).toHaveBeenCalled();
    });

    it('should be accessible to screen readers', () => {
      render(<RegistrationSuccessStep {...mockProps} />);
      
      // Semantic heading for success message
      const successMessage = screen.getByTestId('success-message');
      expect(successMessage.tagName).toBe('H3');
      
      // Button with descriptive text
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toHaveTextContent('המשך למערכת');
      expect(continueButton.tagName).toBe('BUTTON');
    });
  });
});