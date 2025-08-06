'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/app/components/Header';
import { TEXT_CONSTANTS } from '@/constants/text';
import ProfileImageUpload from '@/components/profile/ProfileImageUpload';
import { 
  UserIcon, 
  PhoneIcon, 
  KeyIcon, 
  ShieldCheckIcon, 
  BellIcon, 
  GlobeIcon, 
  PaletteIcon, 
  LockIcon, 
  TrashIcon,
  MailIcon,
  PackageIcon,
  ChevronRightIcon
} from 'lucide-react';

/**
 * Settings Page
 * Provides a comprehensive settings interface for user account management
 * All functionality is UI-only (placeholders) as requested
 */
export default function SettingsPage() {
  const { enhancedUser } = useAuth();
  
  // TODO: Replace with actual state management when backend is implemented
  const [settings, setSettings] = useState({
    emailNotifications: true,
    equipmentTransferAlerts: false,
    language: 'hebrew',
    theme: 'light'
  });

  // Profile image state
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(enhancedUser?.profileImage);

  // TODO: Replace with actual data when backend is implemented
  const mockPhoneNumber = enhancedUser?.phoneNumber || '+972-50-123-4567';
  const mockPendingTransfers = 3; // Placeholder for notification badge

  const handleToggle = (setting: string) => {
    // TODO: Implement actual toggle logic when backend is ready
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
    console.log(`Toggle ${setting} - UI only, no backend action`);
  };

  const handleButtonClick = (action: string) => {
    // TODO: Implement actual actions when backend is ready
    console.log(`${action} clicked - UI only, no backend action`);
  };

  // Handle profile image update
  const handleImageUpdate = (newImageUrl: string) => {
    setProfileImageUrl(newImageUrl);
    // TODO: Update image in Firestore
    console.log('Profile image updated in settings:', newImageUrl);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50" dir="rtl">
        {/* Header */}
        <Header 
          title={TEXT_CONSTANTS.SETTINGS.PAGE_TITLE}
          subtitle={TEXT_CONSTANTS.SETTINGS.PAGE_SUBTITLE}
          showAuth={true}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Settings Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {TEXT_CONSTANTS.SETTINGS.PROFILE_SETTINGS}
              </h2>
            </div>

            <div className="space-y-6">
              {/* Profile Image */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <ProfileImageUpload
                    currentImageUrl={profileImageUrl}
                    onImageUpdate={handleImageUpdate}
                    size="small"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {TEXT_CONSTANTS.SETTINGS.PROFILE_IMAGE}
                    </h3>
                    <p className="text-sm text-gray-500">
                      לחץ על התמונה להעלאת תמונה חדשה
                    </p>
                  </div>
                </div>
                <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  ✅ פעיל
                </div>
              </div>

              {/* Update Phone Number */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {TEXT_CONSTANTS.SETTINGS.UPDATE_PHONE}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {mockPhoneNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleButtonClick('updatePhone')}
                  disabled
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                >
                  עדכן
                </button>
              </div>

              {/* Change Password */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <KeyIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {TEXT_CONSTANTS.SETTINGS.CHANGE_PASSWORD}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {TEXT_CONSTANTS.SETTINGS.COMING_SOON}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleButtonClick('changePassword')}
                  disabled
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                >
                  {TEXT_CONSTANTS.SETTINGS.CHANGE_PASSWORD}
                </button>
              </div>
            </div>
          </div>

          {/* Account Security Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShieldCheckIcon className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {TEXT_CONSTANTS.SETTINGS.ACCOUNT_SECURITY}
              </h2>
            </div>

            <div className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-4">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {TEXT_CONSTANTS.SETTINGS.LINKED_PHONE}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {TEXT_CONSTANTS.SETTINGS.PHONE_NUMBER} {mockPhoneNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BellIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {TEXT_CONSTANTS.SETTINGS.NOTIFICATIONS}
              </h2>
            </div>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <MailIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {TEXT_CONSTANTS.SETTINGS.EMAIL_NOTIFICATIONS}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {TEXT_CONSTANTS.SETTINGS.EMAIL_NOTIFICATIONS_DESC}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  disabled
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-not-allowed
                    ${settings.emailNotifications ? 'bg-gray-300' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Equipment Transfer Alerts */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <PackageIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {TEXT_CONSTANTS.SETTINGS.EQUIPMENT_TRANSFER_ALERTS}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {TEXT_CONSTANTS.SETTINGS.EQUIPMENT_TRANSFER_DESC}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('equipmentTransferAlerts')}
                  disabled
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-not-allowed
                    ${settings.equipmentTransferAlerts ? 'bg-gray-300' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.equipmentTransferAlerts ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Language & Display Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <GlobeIcon className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {TEXT_CONSTANTS.SETTINGS.LANGUAGE_DISPLAY}
              </h2>
            </div>

            <div className="space-y-4">
              {/* Language Selector */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <GlobeIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {TEXT_CONSTANTS.SETTINGS.LANGUAGE_SELECTOR}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {settings.language === 'hebrew' ? TEXT_CONSTANTS.SETTINGS.LANGUAGE_HEBREW : TEXT_CONSTANTS.SETTINGS.LANGUAGE_ENGLISH}
                    </p>
                  </div>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  disabled
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  <option value="hebrew">{TEXT_CONSTANTS.SETTINGS.LANGUAGE_HEBREW}</option>
                  <option value="english">{TEXT_CONSTANTS.SETTINGS.LANGUAGE_ENGLISH}</option>
                </select>
              </div>

              {/* Theme Switcher */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <PaletteIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {TEXT_CONSTANTS.SETTINGS.THEME_SWITCHER}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {settings.theme === 'light' ? TEXT_CONSTANTS.SETTINGS.THEME_LIGHT : TEXT_CONSTANTS.SETTINGS.THEME_DARK}
                    </p>
                  </div>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                  disabled
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  <option value="light">{TEXT_CONSTANTS.SETTINGS.THEME_LIGHT}</option>
                  <option value="dark">{TEXT_CONSTANTS.SETTINGS.THEME_DARK}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy & Permissions Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <LockIcon className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {TEXT_CONSTANTS.SETTINGS.PRIVACY_PERMISSIONS}
              </h2>
            </div>

            <div className="space-y-4">
              {/* Request Permission */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <LockIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {TEXT_CONSTANTS.SETTINGS.REQUEST_PERMISSION}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {TEXT_CONSTANTS.SETTINGS.REQUEST_PERMISSION_DESC}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleButtonClick('requestPermission')}
                  disabled
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed flex items-center gap-2"
                >
                  {TEXT_CONSTANTS.SETTINGS.REQUEST_PERMISSION}
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Delete Account */}
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-xl bg-red-50">
                <div className="flex items-center gap-4">
                  <TrashIcon className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="font-medium text-red-900">
                      {TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT}
                    </h3>
                    <p className="text-sm text-red-600">
                      {TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_WARNING}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleButtonClick('deleteAccount')}
                  disabled
                  className="px-4 py-2 text-sm bg-red-200 text-red-400 rounded-lg cursor-not-allowed"
                >
                  {TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT}
                </button>
              </div>
            </div>
          </div>

          {/* TODO: Equipment Transfer Notifications Info Box */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PackageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-2">
                  {TEXT_CONSTANTS.SETTINGS.TRANSFER_REQUESTS}
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  כרגע יש {mockPendingTransfers} בקשות העברת ציוד ממתינות לטיפול. 
                  כאשר המערכת תהיה מוכנה, תוכל לקבל התראות אוטומטיות על בקשות אלו.
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <BellIcon className="w-4 h-4" />
                  <span>התראות יופעלו בעדכון עתידי</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}