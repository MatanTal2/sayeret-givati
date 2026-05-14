'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import ProfileImageUpload from '@/components/profile/ProfileImageUpload';
import MilitaryInfoSection from '@/components/profile/MilitaryInfoSection';
import ContactInfoSection from '@/components/profile/ContactInfoSection';
import { TEXT_CONSTANTS } from '@/constants/text';
import { updateUserProfile } from '@/lib/userProfileService';
import { readProfileImageCache, writeProfileImageCache } from '@/lib/profileImageCache';

export default function ProfilePage() {
  const { enhancedUser, user, refreshEnhancedUser } = useAuth();
  // Seed from localStorage so the avatar paints instantly on reload, before
  // Firestore returns enhancedUser.profileImage. Stale-while-revalidate: the
  // effect below overwrites once the authoritative value arrives.
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(() =>
    readProfileImageCache(user?.uid)
  );
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  useEffect(() => {
    const img = enhancedUser?.profileImage;
    const resolved = img && /^https?:\/\//i.test(img) ? img : undefined;
    setProfileImageUrl(resolved);
    writeProfileImageCache(enhancedUser?.uid, resolved);
  }, [enhancedUser?.profileImage, enhancedUser?.uid]);

  useEffect(() => {
    setPhoneNumber(enhancedUser?.phoneNumber || '');
  }, [enhancedUser?.phoneNumber]);

  const formatDate = (date: Date | { toDate: () => Date } | string | null | undefined) => {
    if (!date) return TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE;
    try {
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

  const getDisplayValue = (value: string | undefined, fallback: string = TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE) => {
    return value || fallback;
  };

  const handleImageUpdate = async (newImageUrl: string) => {
    setProfileImageUrl(newImageUrl);
    if (!enhancedUser) return;
    writeProfileImageCache(enhancedUser.uid, newImageUrl);
    try {
      await updateUserProfile(enhancedUser.uid, { profileImage: newImageUrl });
      await refreshEnhancedUser();
    } catch (err) {
      console.error('[profile] failed to save image', err);
    }
  };

  const handlePhoneUpdate = async (newPhoneNumber: string) => {
    setPhoneNumber(newPhoneNumber);
    if (!enhancedUser) return;
    try {
      await updateUserProfile(enhancedUser.uid, { phoneNumber: newPhoneNumber });
      await refreshEnhancedUser();
    } catch (err) {
      console.error('[profile] failed to save phone', err);
    }
  };

  return (
    <AuthGuard>
      <AppShell
        title={TEXT_CONSTANTS.PROFILE.PAGE_TITLE}
        subtitle={TEXT_CONSTANTS.PROFILE.PAGE_SUBTITLE}
      >
        <div className="max-w-4xl mx-auto w-full">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {enhancedUser?.uid && (
                <div className="shrink-0">
                  <ProfileImageUpload
                    userId={enhancedUser.uid}
                    currentImageUrl={profileImageUrl}
                    onImageUpdate={handleImageUpdate}
                    size="medium"
                    showInstructions={false}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1 sm:mb-2 truncate">
                  {getDisplayValue(
                    enhancedUser?.firstName && enhancedUser?.lastName
                      ? `${enhancedUser.firstName} ${enhancedUser.lastName}`
                      : undefined,
                    user?.displayName || user?.email?.split('@')[0] || TEXT_CONSTANTS.PROFILE.DEFAULT_USER
                  )}
                </h1>
                <p className="text-base sm:text-lg text-neutral-600 mb-1 truncate">
                  {getDisplayValue(enhancedUser?.rank, TEXT_CONSTANTS.PROFILE.NO_RANK)}
                </p>
                <p className="text-sm text-neutral-500 truncate">
                  {getDisplayValue(enhancedUser?.email || user?.email)}
                </p>
              </div>

              {enhancedUser?.status && (
                <div className={`shrink-0 ms-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${
                  enhancedUser.status === 'active'
                    ? 'bg-success-100 text-success-800'
                    : 'bg-neutral-100 text-neutral-800'
                }`}>
                  {enhancedUser.status === 'active' ? TEXT_CONSTANTS.PROFILE.ACTIVE : TEXT_CONSTANTS.PROFILE.INACTIVE}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information (read-only) */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {TEXT_CONSTANTS.PROFILE.PERSONAL_INFO}
              </h2>

              <dl className="divide-y divide-neutral-100 -my-2">
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-3">
                  <dt className="text-sm font-medium text-neutral-600">{TEXT_CONSTANTS.PROFILE.FIRST_NAME}</dt>
                  <dd className="text-neutral-900 sm:col-span-2">{getDisplayValue(enhancedUser?.firstName)}</dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-3">
                  <dt className="text-sm font-medium text-neutral-600">{TEXT_CONSTANTS.PROFILE.LAST_NAME}</dt>
                  <dd className="text-neutral-900 sm:col-span-2">{getDisplayValue(enhancedUser?.lastName)}</dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-3">
                  <dt className="text-sm font-medium text-neutral-600">{TEXT_CONSTANTS.PROFILE.GENDER}</dt>
                  <dd className="text-neutral-900 sm:col-span-2">
                    {enhancedUser?.gender === 'male' ? TEXT_CONSTANTS.PROFILE.MALE :
                     enhancedUser?.gender === 'female' ? TEXT_CONSTANTS.PROFILE.FEMALE :
                     getDisplayValue(enhancedUser?.gender)}
                  </dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-3">
                  <dt className="text-sm font-medium text-neutral-600">{TEXT_CONSTANTS.PROFILE.BIRTH_DATE}</dt>
                  <dd className="text-neutral-900 sm:col-span-2">{formatDate(enhancedUser?.birthday)}</dd>
                </div>
              </dl>
            </div>

            {/* Military Information (editable: team, enlistment cycle) */}
            {enhancedUser && (
              <MilitaryInfoSection user={enhancedUser} onSaved={refreshEnhancedUser} />
            )}

            {/* Contact Information (editable: address; phone has its own component) */}
            {enhancedUser && (
              <ContactInfoSection
                user={enhancedUser}
                authEmail={user?.email}
                phoneNumber={phoneNumber}
                onPhoneUpdate={handlePhoneUpdate}
                onSaved={refreshEnhancedUser}
              />
            )}

            {/* System Information (read-only) */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4 flex flex-wrap items-center gap-2">
                <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {TEXT_CONSTANTS.PROFILE.SYSTEM_INFO}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{TEXT_CONSTANTS.PROFILE.UNIQUE_ID}</label>
                  <div className="text-neutral-900 font-mono text-sm">{getDisplayValue(enhancedUser?.uid || user?.uid)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{TEXT_CONSTANTS.PROFILE.USER_TYPE}</label>
                  <div className="text-neutral-900">
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                      {TEXT_CONSTANTS.PROFILE.TEST_ACCOUNT}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Source Info */}
          <div className="bg-info-50 border border-info-200 rounded-lg p-4 mt-8">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-info-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-info-900 mb-1">{TEXT_CONSTANTS.PROFILE.DATA_SOURCE_TITLE}</h3>
                <p className="text-sm text-info-700">
                  {enhancedUser?.firstName ?
                    TEXT_CONSTANTS.PROFILE.DATA_SOURCE_SYSTEM :
                    TEXT_CONSTANTS.PROFILE.DATA_SOURCE_AUTH
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
