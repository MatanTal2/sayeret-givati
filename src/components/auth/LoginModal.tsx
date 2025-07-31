import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT_CONSTANTS } from '@/constants/text';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitch: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitch }: LoginModalProps) {
  const { login, isLoading, message, clearMessage } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessage();
    
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await login(formData);
      // Modal will close automatically on successful login via AuthContext
    } catch {
      // Error handling is done in AuthContext
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClose = () => {
    // Reset form state when closing
    setFormData({ email: '', password: '' });
    setShowPassword(false);
    clearMessage();
    onClose();
  };

  const handleSwitchToRegister = () => {
    // Reset form state when switching
    setFormData({ email: '', password: '' });
    setShowPassword(false);
    clearMessage();
    onSwitch();
  };

  return (
    <>
      {/* Backdrop - Blur Only */}
      <div 
        className="fixed inset-0 z-50 backdrop-enter backdrop-blur-sm bg-black/20"
        onClick={handleClose}
      />
      
      {/* Modal Container - Centered for all screen sizes */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm modal-enter pointer-events-auto 
                        my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
          
          {/* Close Button - Top Right */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full btn-press focus-ring
                       text-gray-400 hover:text-gray-600 transition-all duration-200"
            disabled={isLoading}
            aria-label={TEXT_CONSTANTS.ARIA_LABELS.CLOSE_MODAL}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Login Header with Icon */}
          <div className="text-center pt-6 pb-4 px-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{TEXT_CONSTANTS.AUTH.LOGIN_TO_SYSTEM}</h2>
            <p className="text-gray-600 text-xs">{TEXT_CONSTANTS.AUTH.LOGIN_SUBTITLE}</p>
          </div>

          {/* Login Form Content */}
          <div className="px-6 pb-5">
            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  {TEXT_CONSTANTS.AUTH.EMAIL_LABEL}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 
                             focus:ring-purple-500 focus:border-purple-500 outline-none transition-all
                             text-right text-gray-800 bg-gray-50 focus:bg-white placeholder-gray-500"
                    placeholder={TEXT_CONSTANTS.AUTH.EMAIL_PLACEHOLDER}
                    disabled={isLoading}
                    required
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  {TEXT_CONSTANTS.AUTH.PASSWORD_LABEL}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 
                             focus:ring-purple-500 focus:border-purple-500 outline-none transition-all
                             text-right text-gray-800 bg-gray-50 focus:bg-white pr-12 placeholder-gray-500"
                    placeholder={TEXT_CONSTANTS.AUTH.PASSWORD_PLACEHOLDER}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 
                             text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md
                             focus:outline-none focus:ring-2 focus:ring-purple-300"
                    disabled={isLoading}
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
                </div>
              </div>

              {/* Message Display */}
              {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${
                  message.type === 'error' 
                    ? 'bg-red-50 text-red-800 border border-red-200' 
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 
                         hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-400
                         text-white font-semibold rounded-lg btn-press focus-ring
                         disabled:cursor-not-allowed flex items-center justify-center gap-2
                         transition-all duration-200 hover:shadow-lg disabled:hover:shadow-none"
              >
               {isLoading ? (
                 <>
                   <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                     <path className="opacity-75" fill="currentColor" 
                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                   </svg>
                   {TEXT_CONSTANTS.BUTTONS.CONNECTING}
                 </>
               ) : (
                 <>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                           d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                   </svg>
                   {TEXT_CONSTANTS.BUTTONS.LOGIN}
                 </>
               )}
             </button>

             {/* Additional Auth Options */}
             <div className="space-y-2 mt-3">
               {/* Forgot Password Link */}
               <button
                  type="button"
                  onClick={() => {
                    // TODO: Implement forgot password functionality
                    console.log('Forgot password clicked');
                  }}
                  className="w-full text-center text-sm text-purple-600 hover:text-purple-800 
                           transition-all duration-200 underline-offset-2 hover:underline focus-ring rounded-md"
                  disabled={isLoading}
                >
                  {TEXT_CONSTANTS.BUTTONS.FORGOT_PASSWORD}
               </button>

               {/* Divider */}
               <div className="relative">
                 <div className="absolute inset-0 flex items-center">
                   <div className="w-full border-t border-gray-200"></div>
                 </div>
                 <div className="relative flex justify-center text-sm">
                   <span className="px-2 bg-white text-gray-500">{TEXT_CONSTANTS.AUTH.OR_DIVIDER}</span>
                 </div>
               </div>

               {/* Register Button */}
               <button
                 type="button"
                 onClick={handleSwitchToRegister}
                 className="w-full py-3 px-4 border-2 border-purple-600 text-purple-600 
                          font-semibold rounded-xl btn-press focus-ring
                          hover:bg-purple-50 flex items-center justify-center gap-2
                          transition-all duration-200"
                 disabled={isLoading}
               >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {TEXT_CONSTANTS.BUTTONS.REGISTER}
              </button>
             </div>
          </form>
        </div>

        {/* Login Footer */}
        <div className="px-6 pb-4 text-center border-t border-gray-100 pt-2">
          <p className="text-xs text-gray-500">
            {TEXT_CONSTANTS.COMPANY_NAME}
          </p>
        </div>
        </div>
      </div>
    </>
  );
}