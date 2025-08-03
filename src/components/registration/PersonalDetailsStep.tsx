import { useState, useEffect } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { validateGender, validateBirthdate } from '@/utils/validationUtils';
import { PersonalDetailsStepProps, PersonalDetailsData, PersonalDetailsValidationErrors } from '@/types/registration';

export default function PersonalDetailsStep({ 
  firstName, 
  lastName, 
  onSubmit
}: PersonalDetailsStepProps) {
  const [formData, setFormData] = useState<PersonalDetailsData>({
    firstName,
    lastName,
    gender: '',
    birthdate: ''
  });

  const [validationErrors, setValidationErrors] = useState<PersonalDetailsValidationErrors>({
    gender: null,
    birthdate: null
  });

  const [isFormValid, setIsFormValid] = useState(false);

  // Real-time validation
  useEffect(() => {
    const genderValidation = validateGender(formData.gender);
    const birthdateValidation = validateBirthdate(formData.birthdate);

    const errors: PersonalDetailsValidationErrors = {
      gender: genderValidation.errorMessage,
      birthdate: birthdateValidation.errorMessage
    };

    setValidationErrors(errors);

    // Check if form is valid (readonly fields don't need validation)
    const isValid = genderValidation.isValid && birthdateValidation.isValid;
    setIsFormValid(isValid);
  }, [formData]);

  const handleInputChange = (field: keyof PersonalDetailsData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (isFormValid && onSubmit) {
      console.log('Personal details submitted:', formData);
      onSubmit(formData);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="text-center px-6 pb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2">פרטים אישיים</h3>
        <p className="text-lg text-gray-600 mb-6">השלם את הפרטים האישיים שלך</p>
      </div>

      {/* Form */}
      <div className="px-6 pb-5">
        <form className="space-y-3">
          
          {/* First Name - Compact Row Layout */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <label className="block text-sm font-medium text-gray-700 w-20 text-right">
              {TEXT_CONSTANTS.AUTH.FIRST_NAME}:
            </label>
            <input
              type="text"
              value={firstName}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 
                       text-right text-gray-600 cursor-not-allowed text-sm"
              data-testid="first-name-readonly"
            />
          </div>

          {/* Last Name - Compact Row Layout */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <label className="block text-sm font-medium text-gray-700 w-20 text-right">
              {TEXT_CONSTANTS.AUTH.LAST_NAME}:
            </label>
            <input
              type="text"
              value={lastName}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 
                       text-right text-gray-600 cursor-not-allowed text-sm"
              data-testid="last-name-readonly"
            />
          </div>

          {/* Gender - Compact Row Layout */}
          <div className="space-y-1">
            <div className="flex items-center space-x-3 space-x-reverse">
              <label className="block text-sm font-medium text-gray-700 w-20 text-right">
                {TEXT_CONSTANTS.AUTH.GENDER}: *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className={`flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 outline-none transition-all
                         text-right text-gray-800 bg-white text-sm ${
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
            </div>
            
            {/* Gender Error Message */}
            {validationErrors.gender && formData.gender && (
              <p className="text-xs text-red-600 text-right px-1" data-testid="gender-error">
                {validationErrors.gender}
              </p>
            )}
          </div>

          {/* Birthdate - Compact Row Layout */}
          <div className="space-y-1">
            <div className="flex items-center space-x-3 space-x-reverse">
              <label className="block text-sm font-medium text-gray-700 w-20 text-right">
                {TEXT_CONSTANTS.AUTH.BIRTHDATE}: *
              </label>
              <input
                type="date"
                value={formData.birthdate}
                onChange={(e) => handleInputChange('birthdate', e.target.value)}
                className={`flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 outline-none transition-all
                         text-right text-gray-800 bg-white text-sm ${
                  validationErrors.birthdate && formData.birthdate
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
                data-testid="birthdate-input"
              />
            </div>
            
            {/* Birthdate Error Message */}
            {validationErrors.birthdate && formData.birthdate && (
              <p className="text-xs text-red-600 text-right px-1" data-testid="birthdate-error">
                {validationErrors.birthdate}
              </p>
            )}
          </div>

          {/* Continue Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`w-full py-3 px-4 font-semibold rounded-xl btn-press focus-ring
                     flex items-center justify-center gap-2 mt-4
                     transition-all duration-200 ${
              isFormValid
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            data-testid="continue-button"
          >
            המשך
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}