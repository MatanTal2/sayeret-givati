'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/app/components/Header';
// Removed unused imports
import { UserRole } from '@/types/equipment';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import ProfileImageUpload from '@/components/profile/ProfileImageUpload';
import PhoneNumberUpdate from '@/components/profile/PhoneNumberUpdate';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * User Profile Page
 * Displays user information fetched from Firestore
 */
export default function ProfilePage() {
  const { enhancedUser, user } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(enhancedUser?.profileImage);
  const [phoneNumber, setPhoneNumber] = useState<string>(enhancedUser?.phoneNumber || '');

  // Format date helper
  const formatDate = (date: Date | { toDate: () => Date } | string | null | undefined) => {
    if (!date) return TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE;
    
    try {
      // Handle Firestore Timestamp
      let jsDate: Date;
      if (typeof date === 'object' && date !== null && 'toDate' in date) {
        jsDate = date.toDate();
      } else {
        jsDate = new Date(date);
      }
      return format(jsDate, 'dd/MM/yyyy', { locale: he });
    } catch (error) {
      console.error('Error formatting date:', error);
      return TEXT_CONSTANTS.PROFILE.INVALID_DATE;
    }
  };

  // Get display values with fallbacks
  const getDisplayValue = (value: string | undefined, fallback: string = TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE) => {
    return value || fallback;
  };

  // Handle profile image update
  const handleImageUpdate = (newImageUrl: string) => {
    setProfileImageUrl(newImageUrl);
    // TODO: Update image in Firestore
    console.log('Profile image updated:', newImageUrl);
  };

  // Handle phone number update
  const handlePhoneUpdate = (newPhoneNumber: string) => {
    setPhoneNumber(newPhoneNumber);
    // TODO: Update phone number in both users and authorized_personnel collections
    console.log('Phone number updated:', newPhoneNumber);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50" dir="rtl">
        {/* Header */}
        <Header 
          title={TEXT_CONSTANTS.PROFILE.PAGE_TITLE}
          subtitle={TEXT_CONSTANTS.PROFILE.PAGE_SUBTITLE}
          showAuth={true}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-6">
              {/* Profile Avatar with Upload */}
              <ProfileImageUpload
                currentImageUrl={profileImageUrl}
                onImageUpdate={handleImageUpdate}
                size="medium"
              />

              {/* Basic Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {getDisplayValue(
                    enhancedUser?.firstName && enhancedUser?.lastName 
                      ? `${enhancedUser.firstName} ${enhancedUser.lastName}`
                      : undefined,
                    user?.displayName || user?.email?.split('@')[0] || TEXT_CONSTANTS.PROFILE.DEFAULT_USER
                  )}
                </h1>
                <p className="text-lg text-gray-600 mb-1">
                  {getDisplayValue(enhancedUser?.rank, TEXT_CONSTANTS.PROFILE.NO_RANK)}
                </p>
                <p className="text-gray-500">
                  {getDisplayValue(enhancedUser?.email || user?.email)}
                </p>
              </div>

              {/* Status Badge */}
              {enhancedUser?.status && (
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  enhancedUser.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {enhancedUser.status === 'active' ? TEXT_CONSTANTS.PROFILE.ACTIVE : TEXT_CONSTANTS.PROFILE.INACTIVE}
                </div>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {TEXT_CONSTANTS.PROFILE.PERSONAL_INFO}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{TEXT_CONSTANTS.PROFILE.FIRST_NAME}</label>
                  <div className="text-gray-900">{getDisplayValue(enhancedUser?.firstName)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{TEXT_CONSTANTS.PROFILE.LAST_NAME}</label>
                  <div className="text-gray-900">{getDisplayValue(enhancedUser?.lastName)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{TEXT_CONSTANTS.PROFILE.GENDER}</label>
                  <div className="text-gray-900">
                    {enhancedUser?.gender === 'male' ? TEXT_CONSTANTS.PROFILE.MALE : 
                     enhancedUser?.gender === 'female' ? TEXT_CONSTANTS.PROFILE.FEMALE : 
                     getDisplayValue(enhancedUser?.gender)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{TEXT_CONSTANTS.PROFILE.BIRTH_DATE}</label>
                  <div className="text-gray-900">{formatDate(enhancedUser?.birthday)}</div>
                </div>
              </div>
            </div>

            {/* Military Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {TEXT_CONSTANTS.PROFILE.MILITARY_INFO}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{TEXT_CONSTANTS.PROFILE.RANK}</label>
                  <div className="text-gray-900">{getDisplayValue(enhancedUser?.rank)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{TEXT_CONSTANTS.PROFILE.ROLE}</label>
                  <div className="text-gray-900">
                    {enhancedUser?.role === UserRole.SOLDIER ? TEXT_CONSTANTS.PROFILE.SOLDIER : 
                     enhancedUser?.role === UserRole.COMMANDER ? TEXT_CONSTANTS.PROFILE.COMMANDER : 
                     enhancedUser?.role === UserRole.OFFICER ? TEXT_CONSTANTS.PROFILE.OFFICER :
                     enhancedUser?.role === UserRole.EQUIPMENT_MANAGER ? TEXT_CONSTANTS.PROFILE.EQUIPMENT_MANAGER :
                     getDisplayValue(enhancedUser?.role ? String(enhancedUser.role) : undefined)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{TEXT_CONSTANTS.PROFILE.JOIN_DATE}</label>
                  <div className="text-gray-900">{formatDate(enhancedUser?.joinDate)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{TEXT_CONSTANTS.PROFILE.STATUS}</label>
                  <div className="text-gray-900">
                    {enhancedUser?.status === 'active' ? TEXT_CONSTANTS.PROFILE.ACTIVE : 
                     enhancedUser?.status === 'inactive' ? TEXT_CONSTANTS.PROFILE.INACTIVE : 
                     enhancedUser?.status === 'transferred' ? TEXT_CONSTANTS.PROFILE.TRANSFERRED : 
                     enhancedUser?.status === 'discharged' ? TEXT_CONSTANTS.PROFILE.DISCHARGED : 
                     getDisplayValue(enhancedUser?.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {TEXT_CONSTANTS.PROFILE.CONTACT_INFO}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{TEXT_CONSTANTS.PROFILE.EMAIL}</label>
                  <div className="text-gray-900">{getDisplayValue(enhancedUser?.email || user?.email)}</div>
                </div>
                
                {/* Phone Number Update Component */}
                <PhoneNumberUpdate
                  currentPhoneNumber={phoneNumber}
                  onPhoneUpdate={handlePhoneUpdate}
                />
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {TEXT_CONSTANTS.PROFILE.SYSTEM_INFO}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{TEXT_CONSTANTS.PROFILE.UNIQUE_ID}</label>
                  <div className="text-gray-900 font-mono text-sm">{getDisplayValue(enhancedUser?.uid || user?.uid)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{TEXT_CONSTANTS.PROFILE.USER_TYPE}</label>
                  <div className="text-gray-900">
                    {user?.userType === 'admin' ? TEXT_CONSTANTS.PROFILE.ADMIN :
                     user?.userType === 'system_manager' ? TEXT_CONSTANTS.PROFILE.SYSTEM_MANAGER :
                     user?.userType === 'manager' ? TEXT_CONSTANTS.PROFILE.MANAGER :
                     user?.userType === 'team_leader' ? TEXT_CONSTANTS.PROFILE.TEAM_LEADER :
                     user?.userType === 'user' ? TEXT_CONSTANTS.PROFILE.USER : 
                     getDisplayValue(user?.userType ? String(user.userType) : undefined)}
                  </div>
                </div>
                
                {enhancedUser?.testUser && (
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {TEXT_CONSTANTS.PROFILE.TEST_ACCOUNT}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Source Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">{TEXT_CONSTANTS.PROFILE.DATA_SOURCE_TITLE}</h3>
                <p className="text-sm text-blue-700">
                  {enhancedUser?.firstName ? 
                    TEXT_CONSTANTS.PROFILE.DATA_SOURCE_SYSTEM :
                    TEXT_CONSTANTS.PROFILE.DATA_SOURCE_AUTH
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}