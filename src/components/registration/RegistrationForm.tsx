import { TEXT_CONSTANTS } from '@/constants/text';

interface RegistrationFormProps {
  personalNumber: string;
  setPersonalNumber: (value: string) => void;
  onSwitchToLogin?: () => void;
}

export default function RegistrationForm({ personalNumber, setPersonalNumber, onSwitchToLogin }: RegistrationFormProps) {
  return (
    <>
      {/* Registration Content */}
      <div className="text-center px-6 pb-4">
        {/* Medal Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        
        {/* Main Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{TEXT_CONSTANTS.AUTH.WELCOME_TO_SYSTEM}</h3>
        
        {/* Subtitle */}
        <p className="text-lg text-gray-600 mb-6">{TEXT_CONSTANTS.AUTH.SYSTEM_SUBTITLE}</p>
      </div>

      {/* Registration Form */}
      <div className="px-6 pb-5">
        <form className="space-y-4">
          {/* Section Title */}
          <h4 className="text-lg font-semibold text-gray-800 text-center mb-4">
            {TEXT_CONSTANTS.AUTH.IDENTITY_VERIFICATION}
          </h4>
          
          {/* Personal Number Field */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={personalNumber}
                onChange={(e) => setPersonalNumber(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 
                         focus:ring-purple-500 focus:border-purple-500 outline-none transition-all
                         text-right text-gray-800 bg-gray-50 focus:bg-white placeholder-gray-500"
                placeholder={TEXT_CONSTANTS.AUTH.PERSONAL_NUMBER_PLACEHOLDER}
                maxLength={7}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={() => {
              console.log('Verify personal number:', personalNumber);
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 
                     hover:from-green-700 hover:to-green-800
                     text-white font-semibold rounded-xl btn-press focus-ring
                     flex items-center justify-center gap-2
                     transition-all duration-200 hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {TEXT_CONSTANTS.AUTH.VERIFY_PERSONAL_NUMBER}
          </button>

          {/* Switch to Login */}
          {onSwitchToLogin && (
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-sm text-purple-600 hover:text-purple-800 
                         transition-all duration-200 underline-offset-2 hover:underline focus-ring rounded-md"
              >
                כבר יש לך חשבון? התחבר כאן
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}