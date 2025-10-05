'use client';

import React from 'react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';
import { RANK_OPTIONS, USER_TYPE_OPTIONS, FORM_CONSTRAINTS } from '@/constants/admin';
import { UserType } from '@/types/user';
import { TEXT_CONSTANTS } from '@/constants/text';


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
            <label htmlFor="militaryPersonalNumber" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Military Personal Number (מספר אישי) *
            </label>
            <input
              type="text"
              id="militaryPersonalNumber"
              value={formData.militaryPersonalNumber}
              onChange={(e) => handleInputChange('militaryPersonalNumber', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500
                         disabled:opacity-50"
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.PERSONAL_ID_PLACEHOLDER}
              maxLength={FORM_CONSTRAINTS.MILITARY_ID_MAX_LENGTH}
              disabled={isLoading}
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              🔒 Will be securely hashed and stored
            </p>
          </div>

          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500
                         disabled:opacity-50"
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.FIRST_NAME_PLACEHOLDER}
              maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
              disabled={isLoading}
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500
                         disabled:opacity-50"
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.LAST_NAME_PLACEHOLDER}
              maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
              disabled={isLoading}
            />
          </div>

          {/* Rank */}
          <div>
            <label htmlFor="rank" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Military Rank *
            </label>
            <select
              id="rank"
              value={formData.rank}
              onChange={(e) => handleInputChange('rank', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500
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

          {/* User Type */}
          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              User Type *
            </label>
            <select
              id="userType"
              value={formData.userType || UserType.USER}
              onChange={(e) => handleInputChange('userType', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500
                         disabled:opacity-50"
              disabled={isLoading}
            >
              {USER_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              🔑 Determines system access level
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500
                         disabled:opacity-50"
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.PHONE_PLACEHOLDER_ADMIN}
              maxLength={FORM_CONSTRAINTS.PHONE_MAX_LENGTH}
              disabled={isLoading}
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              📱 Used for MFA during registration
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-info-600 hover:bg-info-700 disabled:bg-neutral-400 
                       text-white font-medium py-2 px-6 rounded-md
                       focus:ring-2 focus:ring-info-500 focus:ring-offset-2
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

        {/* Message - Positioned below button for better visibility */}
        {message && (
          <div className={`rounded-lg p-4 border-2 transition-all duration-300 ${
            message.type === 'success' 
              ? 'bg-success-50 dark:bg-success-900/20 border-success-300 dark:border-success-700 shadow-lg' 
              : 'bg-danger-50 dark:bg-danger-900/20 border-danger-300 dark:border-danger-700 shadow-lg'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <div className="w-6 h-6 rounded-full bg-success-100 dark:bg-success-800 flex items-center justify-center">
                    <span className="text-success-600 dark:text-success-400 text-lg">✅</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-danger-100 dark:bg-danger-800 flex items-center justify-center">
                    <span className="text-danger-600 dark:text-danger-400 text-lg">❌</span>
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  message.type === 'success' 
                    ? 'text-success-800 dark:text-success-300' 
                    : 'text-danger-800 dark:text-danger-300'
                }`}>
                  {message.type === 'success' ? 'Success!' : 'Error'}
                </p>
                <p className={`text-sm mt-1 ${
                  message.type === 'success' 
                    ? 'text-success-700 dark:text-success-400' 
                    : 'text-danger-700 dark:text-danger-400'
                }`}>
                  {message.text}
                </p>
                {message.type === 'success' && (
                  <p className="text-xs text-success-600 dark:text-success-500 mt-2">
                    💡 The personnel can now register using their military ID and phone number
                  </p>
                )}
              </div>
              <button
                onClick={clearMessage}
                className={`ml-2 flex-shrink-0 p-1 rounded-md hover:bg-opacity-20 ${
                  message.type === 'success' 
                    ? 'text-success-500 hover:bg-success-200 dark:hover:bg-success-800' 
                    : 'text-danger-500 hover:bg-danger-200 dark:hover:bg-danger-800'
                }`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Info Box */}
      <div className="mt-8 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-4">
        <div className="flex">
          <div className="text-info-400 text-lg mr-3">ℹ️</div>
          <div>
            <h4 className="text-sm font-medium text-info-800 dark:text-info-300 mb-2">
              Authorized Personnel Information
            </h4>
            <ul className="text-xs text-info-700 dark:text-info-400 space-y-1">
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