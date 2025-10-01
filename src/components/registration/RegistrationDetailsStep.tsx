import { useState, useEffect } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { 
  validateEmail, 
  validatePassword, 
  validateGender, 
  validateBirthdate, 
  validateConsent 
} from '@/utils/validationUtils';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface RegistrationDetailsStepProps {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  onSubmit?: (data: RegistrationData) => void;
}

interface RegistrationData {
  email: string;
  password: string;
  gender: string;
  birthdate: string;
  consent: boolean;
}

interface ValidationErrors {
  email: string | null;
  password: string | null;
  gender: string | null;
  birthdate: string | null;
  consent: string | null;
}

export default function RegistrationDetailsStep({ 
  firstName, 
  lastName, 
  phoneNumber, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSubmit 
}: RegistrationDetailsStepProps) {
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    gender: '',
    birthdate: '',
    consent: false
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    email: null,
    password: null,
    gender: null,
    birthdate: null,
    consent: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Real-time validation
  useEffect(() => {
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);
    const genderValidation = validateGender(formData.gender);
    const birthdateValidation = validateBirthdate(formData.birthdate);
    const consentValidation = validateConsent(formData.consent);

    const errors: ValidationErrors = {
      email: emailValidation.errorMessage,
      password: passwordValidation.errorMessage,
      gender: genderValidation.errorMessage,
      birthdate: birthdateValidation.errorMessage,
      consent: consentValidation.errorMessage
    };

    setValidationErrors(errors);

    // Check if form is valid
    const isValid = emailValidation.isValid && 
                   passwordValidation.isValid && 
                   genderValidation.isValid && 
                   birthdateValidation.isValid && 
                   consentValidation.isValid;

    setIsFormValid(isValid);
  }, [formData]);

  const handleInputChange = (field: keyof RegistrationData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (isFormValid && onSubmit) {
      console.log('TODO: register user in Firebase Auth and Firestore');
      onSubmit(formData);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="text-center px-6 pb-4">
        {/* User Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{TEXT_CONSTANTS.AUTH.REGISTRATION_DETAILS}</h3>
      </div>

      {/* Registration Details Form */}
      <div className="px-6 pb-5">
        <form className="space-y-4">
          
          {/* Read-only Pre-filled Fields */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">פרטים אישיים</h4>
            
            {/* First Name - Read Only */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {TEXT_CONSTANTS.AUTH.FIRST_NAME}
              </label>
              <input
                type="text"
                value={firstName}
                readOnly
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 
                         text-right text-gray-600 cursor-not-allowed"
                data-testid="first-name-readonly"
              />
            </div>

            {/* Last Name - Read Only */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {TEXT_CONSTANTS.AUTH.LAST_NAME}
              </label>
              <input
                type="text"
                value={lastName}
                readOnly
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 
                         text-right text-gray-600 cursor-not-allowed"
                data-testid="last-name-readonly"
              />
            </div>


          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {TEXT_CONSTANTS.AUTH.EMAIL_ADDRESS} *
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 outline-none transition-all
                         text-right text-gray-800 bg-gray-50 focus:bg-white placeholder-gray-500 ${
                  validationErrors.email && formData.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder={TEXT_CONSTANTS.AUTH.EMAIL_PLACEHOLDER_REGISTRATION}
                data-testid="email-input"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
            {validationErrors.email && formData.email && (
              <p className="text-sm text-red-600 text-right px-1" data-testid="email-error">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {TEXT_CONSTANTS.AUTH.PASSWORD} *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 outline-none transition-all
                         text-right text-gray-800 bg-gray-50 focus:bg-white pr-12 placeholder-gray-500 ${
                  validationErrors.password && formData.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder={TEXT_CONSTANTS.AUTH.PASSWORD_PLACEHOLDER_REGISTRATION}
                data-testid="password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 
                         text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-blue-300"
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
            </div>
            {validationErrors.password && formData.password && (
              <p className="text-sm text-red-600 text-right px-1" data-testid="password-error">
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Gender Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {TEXT_CONSTANTS.AUTH.GENDER} *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 outline-none transition-all
                       text-right text-gray-800 bg-gray-50 focus:bg-white ${
                validationErrors.gender && formData.gender
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
              }`}
              data-testid="gender-select"
            >
              <option value="">בחר מין</option>
              <option value="male">{TEXT_CONSTANTS.AUTH.GENDER_MALE}</option>
              <option value="female">{TEXT_CONSTANTS.AUTH.GENDER_FEMALE}</option>
              <option value="other">{TEXT_CONSTANTS.AUTH.GENDER_OTHER}</option>
            </select>
            {validationErrors.gender && (
              <p className="text-sm text-red-600 text-right px-1" data-testid="gender-error">
                {validationErrors.gender}
              </p>
            )}
          </div>

          {/* Birthdate Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {TEXT_CONSTANTS.AUTH.BIRTHDATE} *
            </label>
            <input
              type="date"
              value={formData.birthdate}
              onChange={(e) => handleInputChange('birthdate', e.target.value)}
              className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 outline-none transition-all
                       text-right text-gray-800 bg-gray-50 focus:bg-white ${
                validationErrors.birthdate && formData.birthdate
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
              }`}
              data-testid="birthdate-input"
            />
            {validationErrors.birthdate && formData.birthdate && (
              <p className="text-sm text-red-600 text-right px-1" data-testid="birthdate-error">
                {validationErrors.birthdate}
              </p>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.consent}
                onChange={(e) => handleInputChange('consent', e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                data-testid="consent-checkbox"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                אני מסכים/ה ל
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(true)}
                  className="text-blue-600 hover:text-blue-800 underline mx-1"
                >
                  תנאי השימוש ומדיניות הפרטיות
                </button>
                *
              </span>
            </label>
            {validationErrors.consent && (
              <p className="text-sm text-red-600 text-right px-1" data-testid="consent-error">
                {validationErrors.consent}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`w-full py-3 px-4 font-semibold rounded-xl btn-press focus-ring
                     flex items-center justify-center gap-2
                     transition-all duration-200 ${
              isFormValid
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            data-testid="create-account-button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            {TEXT_CONSTANTS.AUTH.CREATE_ACCOUNT}
          </button>
        </form>
      </div>

      {/* System Policy Modal */}
      <ConfirmationModal
        isOpen={showPolicyModal}
        title={TEXT_CONSTANTS.AUTH.SYSTEM_POLICY_TITLE}
        message={TEXT_CONSTANTS.AUTH.SYSTEM_POLICY_CONTENT}
        confirmText={TEXT_CONSTANTS.CONFIRMATIONS.OK}
        cancelText={TEXT_CONSTANTS.CONFIRMATIONS.CLOSE}
        onConfirm={() => setShowPolicyModal(false)}
        onCancel={() => setShowPolicyModal(false)}
        variant="info"
        icon="📋"
        singleButton={true}
        useHomePageStyle={true}
      />
    </>
  );
}