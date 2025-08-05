import React from 'react';

export type RegistrationStep = 'personal-number' | 'otp' | 'personal' | 'account' | 'success';

interface RegistrationStepDotsProps {
  currentStep: RegistrationStep;
  className?: string;
}

interface StepConfig {
  id: number;
  label: string;
  ariaLabel: string;
}

const STEP_CONFIGS: StepConfig[] = [
  {
    id: 1,
    label: 'ID Verification',
    ariaLabel: 'Step 1: ID Verification',
  },
  {
    id: 2,
    label: 'OTP',
    ariaLabel: 'Step 2: OTP Verification',
  },
  {
    id: 3,
    label: 'Personal Details',
    ariaLabel: 'Step 3: Personal Details',
  },
  {
    id: 4,
    label: 'Account Details',
    ariaLabel: 'Step 4: Account Details',
  },
  {
    id: 5,
    label: 'Review & Submit',
    ariaLabel: 'Step 5: Review and Submit',
  },
];

const getActiveStepNumber = (currentStep: RegistrationStep): number => {
  switch (currentStep) {
    case 'personal-number':
      return 1; // ID Verification
    case 'otp':
      return 2; // OTP
    case 'personal':
      return 3; // Personal Details
    case 'account':
      return 4; // Account Details  
    case 'success':
      return 5; // Review & Submit
    default:
      return 1;
  }
};

const isStepCompleted = (stepNumber: number, currentStep: RegistrationStep): boolean => {
  const activeStep = getActiveStepNumber(currentStep);
  
  if (currentStep === 'success') {
    return stepNumber <= 4; // All steps except the final review are completed
  }
  
  return stepNumber < activeStep;
};

const isStepActive = (stepNumber: number, currentStep: RegistrationStep): boolean => {
  const activeStep = getActiveStepNumber(currentStep);
  return stepNumber === activeStep;
};

export default function RegistrationStepDots({ 
  currentStep, 
  className = '' 
}: RegistrationStepDotsProps) {
  return (
    <div 
      className={`flex justify-center items-center space-x-3 mb-6 ${className}`}
      role="progressbar"
      aria-label="Registration progress"
      aria-valuenow={getActiveStepNumber(currentStep)}
      aria-valuemin={1}
      aria-valuemax={5}
    >
      {STEP_CONFIGS.map((step, index) => {
        const isCompleted = isStepCompleted(step.id, currentStep);
        const isActive = isStepActive(step.id, currentStep);
        
        return (
          <React.Fragment key={step.id}>
            {/* Step Dot */}
            <div
              className="relative group"
              role="button"
              tabIndex={0}
              aria-label={step.ariaLabel}
              title={step.label}
            >
              {/* Dot */}
              <div
                className={`
                  w-3 h-3 rounded-full transition-all duration-300 ease-in-out
                  ${isCompleted 
                    ? 'bg-green-500 shadow-sm' 
                    : isActive 
                      ? 'bg-blue-500 shadow-lg ring-2 ring-blue-200' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }
                `}
              />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                {step.label}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
              </div>
            </div>
            
            {/* Connector Line */}
            {index < STEP_CONFIGS.length - 1 && (
              <div
                className={`
                  h-0.5 w-8 transition-all duration-300 ease-in-out
                  ${isCompleted 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                  }
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}