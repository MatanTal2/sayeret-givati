import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegistrationStepDots, { RegistrationStep } from '../RegistrationStepDots';

describe('RegistrationStepDots Component', () => {
  describe('should render all step dots', () => {
    it('should render 5 step dots', () => {
      render(<RegistrationStepDots currentStep="personal-number" />);
      
      const dots = document.querySelectorAll('.w-3.h-3.rounded-full');
      expect(dots).toHaveLength(5);
    });

    it('should render connector lines between dots', () => {
      render(<RegistrationStepDots currentStep="personal-number" />);
      
      const connectors = document.querySelectorAll('.h-0\\.5.w-8');
      expect(connectors).toHaveLength(4); // 4 connectors between 5 dots
    });

    it('should have proper accessibility attributes', () => {
      render(<RegistrationStepDots currentStep="personal-number" />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Registration progress');
      expect(progressbar).toHaveAttribute('aria-valuenow', '1');
      expect(progressbar).toHaveAttribute('aria-valuemin', '1');
      expect(progressbar).toHaveAttribute('aria-valuemax', '5');
    });
  });

  describe('should highlight current step correctly', () => {
    it('should highlight step 1 for personal-number', () => {
      render(<RegistrationStepDots currentStep="personal-number" />);
      
      const dots = document.querySelectorAll('.w-3.h-3.rounded-full');
      const firstDot = dots[0];
      
      expect(firstDot).toHaveClass('bg-blue-500');
      expect(firstDot).toHaveClass('ring-2', 'ring-blue-200');
    });

    it('should highlight step 2 for otp', () => {
      render(<RegistrationStepDots currentStep="otp" />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '2');
      
      const dots = document.querySelectorAll('.w-3.h-3.rounded-full');
      const secondDot = dots[1];
      
      expect(secondDot).toHaveClass('bg-blue-500');
    });

    it('should highlight step 3 for details', () => {
      render(<RegistrationStepDots currentStep="details" />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '3');
      
      const dots = document.querySelectorAll('.w-3.h-3.rounded-full');
      const thirdDot = dots[2];
      
      // In the details step, step 3 is shown as active/completed (green)
      expect(thirdDot).toHaveClass('bg-green-500');
    });

    it('should highlight step 5 for success', () => {
      render(<RegistrationStepDots currentStep="success" />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '5');
      
      const dots = document.querySelectorAll('.w-3.h-3.rounded-full');
      const fifthDot = dots[4];
      
      expect(fifthDot).toHaveClass('bg-blue-500');
    });
  });

  describe('should show completed steps correctly', () => {
    it('should mark previous steps as completed', () => {
      render(<RegistrationStepDots currentStep="details" />);
      
      const dots = document.querySelectorAll('.w-3.h-3.rounded-full');
      
      // Steps 1, 2, and 3 should be completed (green) in details step
      expect(dots[0]).toHaveClass('bg-green-500');
      expect(dots[1]).toHaveClass('bg-green-500');
      expect(dots[2]).toHaveClass('bg-green-500');
      
      // Steps 4 and 5 should be upcoming (gray)
      expect(dots[3]).toHaveClass('bg-gray-300');
      expect(dots[4]).toHaveClass('bg-gray-300');
    });

    it('should show completed connectors in green', () => {
      render(<RegistrationStepDots currentStep="otp" />);
      
      const connectors = document.querySelectorAll('.h-0\\.5.w-8');
      
      // First connector should be green (between completed step 1 and active step 2)
      expect(connectors[0]).toHaveClass('bg-green-500');
      
      // Other connectors should be gray
      expect(connectors[1]).toHaveClass('bg-gray-300');
      expect(connectors[2]).toHaveClass('bg-gray-300');
      expect(connectors[3]).toHaveClass('bg-gray-300');
    });
  });

  describe('should show tooltips on hover', () => {
    it('should have tooltip content for each step', () => {
      render(<RegistrationStepDots currentStep="personal-number" />);
      
      const stepElements = document.querySelectorAll('[role="button"]');
      
      expect(stepElements[0]).toHaveAttribute('title', 'ID Verification');
      expect(stepElements[1]).toHaveAttribute('title', 'OTP');
      expect(stepElements[2]).toHaveAttribute('title', 'Personal Details');
      expect(stepElements[3]).toHaveAttribute('title', 'Account Details');
      expect(stepElements[4]).toHaveAttribute('title', 'Review & Submit');
    });

    it('should have proper aria-labels for accessibility', () => {
      render(<RegistrationStepDots currentStep="personal-number" />);
      
      const stepElements = document.querySelectorAll('[role="button"]');
      
      expect(stepElements[0]).toHaveAttribute('aria-label', 'Step 1: ID Verification');
      expect(stepElements[1]).toHaveAttribute('aria-label', 'Step 2: OTP Verification');
      expect(stepElements[2]).toHaveAttribute('aria-label', 'Step 3: Personal Details');
      expect(stepElements[3]).toHaveAttribute('aria-label', 'Step 4: Account Details');
      expect(stepElements[4]).toHaveAttribute('aria-label', 'Step 5: Review and Submit');
    });

    it('should show tooltip on hover', async () => {
      const user = userEvent.setup();
      render(<RegistrationStepDots currentStep="personal-number" />);
      
      const firstStep = document.querySelector('[role="button"]');
      
      // Initially tooltip should be hidden
      const tooltip = firstStep?.querySelector('.opacity-0');
      expect(tooltip).toBeInTheDocument();
      
      // Hover should make tooltip visible
      if (firstStep) {
        await user.hover(firstStep);
        const visibleTooltip = firstStep.querySelector('.group-hover\\:opacity-100');
        expect(visibleTooltip).toBeInTheDocument();
      }
    });
  });

  describe('should handle keyboard accessibility', () => {
    it('should be focusable with keyboard', () => {
      render(<RegistrationStepDots currentStep="personal-number" />);
      
      const stepElements = document.querySelectorAll('[role="button"]');
      
      stepElements.forEach(element => {
        expect(element).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should handle focus states', async () => {
      render(<RegistrationStepDots currentStep="personal-number" />);
      
      const firstStep = document.querySelector('[role="button"]');
      
      if (firstStep) {
        firstStep.focus();
        expect(firstStep).toHaveFocus();
      }
    });
  });

  describe('should accept custom className', () => {
    it('should apply custom className', () => {
      render(<RegistrationStepDots currentStep="personal-number" className="custom-class" />);
      
      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });

    it('should preserve default classes with custom className', () => {
      render(<RegistrationStepDots currentStep="personal-number" className="custom-class" />);
      
      const container = document.querySelector('.flex.justify-center.items-center');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('edge cases and validation', () => {
    it('should handle all valid step values', () => {
      const validSteps: RegistrationStep[] = ['personal-number', 'otp', 'details', 'success'];
      
      validSteps.forEach(step => {
        expect(() => {
          render(<RegistrationStepDots currentStep={step} />);
        }).not.toThrow();
      });
    });

    it('should render consistently across re-renders', () => {
      const { rerender } = render(<RegistrationStepDots currentStep="personal-number" />);
      
      const initialDots = document.querySelectorAll('.w-3.h-3.rounded-full');
      expect(initialDots).toHaveLength(5);
      
      rerender(<RegistrationStepDots currentStep="otp" />);
      
      const newDots = document.querySelectorAll('.w-3.h-3.rounded-full');
      expect(newDots).toHaveLength(5);
    });

    it('should maintain proper structure', () => {
      render(<RegistrationStepDots currentStep="personal-number" />);
      
      // Should have container with progressbar role
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      
      // Should have 5 step buttons
      const stepButtons = screen.getAllByRole('button');
      expect(stepButtons).toHaveLength(5);
      
      // Should have proper spacing
      expect(progressbar).toHaveClass('space-x-3');
    });
  });
});