'use client';

import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';
import { RANK_OPTIONS, FORM_CONSTRAINTS } from '@/constants/admin';

export default function AddPersonnel() {
  const {
    formData,
    isLoading,
    message,
    updateFormField,
    addPersonnel,
    clearMessage
  } = usePersonnelManagement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPersonnel();
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    updateFormField(field, value);
    // Clear message when user types
    if (message) {
      clearMessage();
    }
  };

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Military Personal Number */}
          <div className="md:col-span-2">
            <label htmlFor="militaryPersonalNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Military Personal Number (מספר אישי) *
            </label>
            <input
              type="text"
              id="militaryPersonalNumber"
              value={formData.militaryPersonalNumber}
              onChange={(e) => handleInputChange('militaryPersonalNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         disabled:opacity-50"
              placeholder="מספר אישי"
              maxLength={FORM_CONSTRAINTS.MILITARY_ID_MAX_LENGTH}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              🔒 Will be securely hashed and stored
            </p>
          </div>

          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         disabled:opacity-50"
              placeholder="שם פרטי"
              maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
              disabled={isLoading}
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         disabled:opacity-50"
              placeholder="שם משפחה"
              maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
              disabled={isLoading}
            />
          </div>

          {/* Rank */}
          <div>
            <label htmlFor="rank" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Military Rank *
            </label>
            <select
              id="rank"
              value={formData.rank}
              onChange={(e) => handleInputChange('rank', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">Select Rank</option>
              {RANK_OPTIONS.map((rank) => (
                <option key={rank.value} value={rank.value}>
                  {rank.label}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         disabled:opacity-50"
              placeholder="מספר פלאפון"
              maxLength={FORM_CONSTRAINTS.PHONE_MAX_LENGTH}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              📱 Used for MFA during registration
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-md p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm ${
              message.type === 'success' 
                ? 'text-green-700 dark:text-green-400' 
                : 'text-red-700 dark:text-red-400'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                       text-white font-medium py-2 px-6 rounded-md
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding Personnel...
              </div>
            ) : (
              '✅ Add Authorized Personnel'
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="text-blue-400 text-lg mr-3">ℹ️</div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              Authorized Personnel Information
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Same data requirements as CSV bulk upload for consistency</li>
              <li>• Military Personal Numbers are hashed with SHA-256 + salt</li>
              <li>• Phone numbers are used for MFA during user registration</li>
              <li>• No email required - this creates pre-authorization records only</li>
              <li>• Personnel register separately with personal email for Firebase Auth</li>
              <li>• All users start with &apos;soldier&apos; role by default</li>
              <li>• Status defaults to &apos;active&apos; and joinDate is set automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 