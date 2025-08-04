import { useState, useEffect } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { validateEmail, validatePassword, validateConsent } from '@/utils/validationUtils';
import { AccountDetailsStepProps, AccountDetailsData, AccountDetailsValidationErrors } from '@/types/registration';

export default function AccountDetailsStep({ 
  email = '',
  password = '',
  consent = false,
  onSubmit,
  isSubmitting = false
}: AccountDetailsStepProps) {
  const [formData, setFormData] = useState<AccountDetailsData>({
    email,
    password,
    consent
  });

  const [validationErrors, setValidationErrors] = useState<AccountDetailsValidationErrors>({
    email: null,
    password: null,
    consent: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);

  // Real-time validation
  useEffect(() => {
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);
    const consentValidation = validateConsent(formData.consent);

    const errors: AccountDetailsValidationErrors = {
      email: emailValidation.errorMessage,
      password: passwordValidation.errorMessage,
      consent: consentValidation.errorMessage
    };

    setValidationErrors(errors);

    // Check if form is valid
    const isValid = emailValidation.isValid && 
                   passwordValidation.isValid && 
                   consentValidation.isValid;
    setIsFormValid(isValid);
  }, [formData]);

  const handleInputChange = (field: keyof AccountDetailsData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (isFormValid && onSubmit) {
      onSubmit(formData);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      {/* Header */}
      <div className="text-center px-6 pb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">יצירת חשבון</h3>
        <p className="text-base text-gray-600 mb-3">הגדר את פרטי הכניסה שלך</p>
      </div>

      {/* Form */}
      <div className="px-6 pb-3">
        <form className="space-y-4">
          
          {/* Email Field */}
          <div className="space-y-1">
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 outline-none transition-all
                         text-right text-gray-800 bg-gray-50 focus:bg-white placeholder-gray-500 pr-12 ${
                  validationErrors.email && formData.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder={TEXT_CONSTANTS.AUTH.EMAIL_PLACEHOLDER_REGISTRATION}
                data-testid="email-input"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
            
            {/* Email Error Message */}
            {validationErrors.email && formData.email && (
              <p className="text-xs text-red-600 text-right px-1" data-testid="email-error">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 outline-none transition-all
                         text-right text-gray-800 bg-gray-50 focus:bg-white placeholder-gray-500 pl-12 pr-12 ${
                  validationErrors.password && formData.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder={TEXT_CONSTANTS.AUTH.PASSWORD_PLACEHOLDER_REGISTRATION}
                data-testid="password-input"
              />
              
              {/* Password Toggle Button - Now on Left */}
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                data-testid="password-toggle"
                aria-label={showPassword ? TEXT_CONSTANTS.AUTH.HIDE_PASSWORD : TEXT_CONSTANTS.AUTH.SHOW_PASSWORD}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>

              {/* Lock Icon with Tooltip - Now on Right */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div 
                  className="relative"
                  onMouseEnter={() => setShowPasswordTooltip(true)}
                  onMouseLeave={() => setShowPasswordTooltip(false)}
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  
                  {/* Password Requirements Tooltip */}
                  {showPasswordTooltip && (
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 z-10 shadow-lg">
                      <div className="text-center font-semibold mb-2">דרישות סיסמה:</div>
                      <ul className="text-right space-y-1">
                        <li>• לפחות 8 תווים</li>
                        <li>• אות גדולה (A-Z)</li>
                        <li>• אות קטנה (a-z)</li>
                        <li>• מספר (0-9)</li>
                        <li>• תו מיוחד (!@#$%^&*)</li>
                      </ul>
                      {/* Tooltip Arrow */}
                      <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Password Error Message */}
            {validationErrors.password && formData.password && (
              <p className="text-xs text-red-600 text-right px-1" data-testid="password-error">
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="space-y-2">
            <div className="flex items-start space-x-3 px-1">
              <input
                type="checkbox"
                id="consent"
                checked={formData.consent}
                onChange={(e) => handleInputChange('consent', e.target.checked)}
                className={`mt-1 h-4 w-4 rounded border-2 focus:ring-2 focus:ring-blue-500  ${
                  validationErrors.consent
                    ? 'border-red-500 text-red-600'
                    : 'border-gray-300 text-blue-600'
                }`}
                
                data-testid="consent-checkbox"
              />
              <label htmlFor="consent" className="text-sm text-gray-700 text-right leading-5">
                * {TEXT_CONSTANTS.AUTH.CONSENT_TERMS}
              </label>
            </div>
          </div>

          {/* Create Account Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-2.5 px-4 font-semibold rounded-xl btn-press focus-ring
                     flex items-center justify-center gap-2 mt-4
                     transition-all duration-200 ${
              isFormValid && !isSubmitting
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            data-testid="create-account-button"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                יוצר חשבון...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M5 13l4 4L19 7" />
                </svg>
                צור חשבון
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}