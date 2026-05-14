'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { TEXT_CONSTANTS } from '@/constants/text';
import ProfileImageUpload from '@/components/profile/ProfileImageUpload';
import ChangePasswordModal from '@/components/settings/ChangePasswordModal';
import ChangePhoneModal from '@/components/settings/ChangePhoneModal';
import DeleteAccountModal from '@/components/settings/DeleteAccountModal';
import AccountActivitySection from '@/components/settings/AccountActivitySection';
import RevokeSessionsRow from '@/components/settings/RevokeSessionsRow';
import NotificationToggleRow from '@/components/settings/NotificationToggleRow';
import { cancelAccountDeletion } from '@/lib/accountDeletionClient';
import { readProfileImageCache, writeProfileImageCache } from '@/lib/profileImageCache';
import { computeDaysLeft } from '@/components/settings/PendingDeletionBanner';
import { useToast } from '@/components/ui/Toast';
import { updateUserProfile } from '@/lib/userProfileService';
import { formatPhoneForDisplay } from '@/utils/validationUtils';
import type { Timestamp } from 'firebase/firestore';

type NotifPrefKey = 'emailNotifications' | 'equipmentTransferAlerts';
const NOTIF_DEFAULTS: Record<NotifPrefKey, boolean> = {
  emailNotifications: true,
  equipmentTransferAlerts: true,
};
import {
  UserIcon,
  PhoneIcon,
  KeyIcon,
  ShieldCheckIcon,
  BellIcon,
  LockIcon,
  TrashIcon,
  MailIcon,
  PackageIcon,
  AlertTriangleIcon,
  ChevronRightIcon
} from 'lucide-react';

function daysUntilHardDelete(requestedAt: Timestamp | undefined): number {
  if (!requestedAt) return 0;
  return computeDaysLeft(requestedAt);
}

/**
 * Settings Page
 * Provides a comprehensive settings interface for user account management
 * All functionality is UI-only (placeholders) as requested
 */
export default function SettingsPage() {
  const { enhancedUser, refreshEnhancedUser } = useAuth();
  const { showToast } = useToast();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePhoneOpen, setChangePhoneOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);

  const hasPendingDeletion = !!enhancedUser?.deletionRequestedAt;

  const handleCancelDeletion = async () => {
    if (cancellingDeletion) return;
    setCancellingDeletion(true);
    const result = await cancelAccountDeletion();
    if (result.success) {
      showToast(TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_CANCEL_SUCCESS, 'success');
      await refreshEnhancedUser();
    } else if (result.code === 'no_pending_request') {
      showToast(TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_CANCEL_NO_PENDING, 'info');
      await refreshEnhancedUser();
    } else {
      showToast(TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_CANCEL_ERROR, 'danger');
    }
    setCancellingDeletion(false);
  };

  // Notification toggles persist via PATCH /api/users/profile. Language and
  // theme are still UI-only placeholders (PR-F i18n + theming pending).
  const [notifPrefs, setNotifPrefs] = useState<Record<NotifPrefKey, boolean>>(() => ({
    emailNotifications:
      enhancedUser?.communicationPreferences?.emailNotifications ??
      NOTIF_DEFAULTS.emailNotifications,
    equipmentTransferAlerts:
      enhancedUser?.communicationPreferences?.equipmentTransferAlerts ??
      NOTIF_DEFAULTS.equipmentTransferAlerts,
  }));
  const [savingPref, setSavingPref] = useState<NotifPrefKey | null>(null);

  // Profile image state. Drop legacy blob: URLs from the old mock — they error on render.
  // Seed from localStorage so the avatar paints instantly on reload (Firestore
  // fetch is async). Effect below revalidates from enhancedUser.profileImage.
  const initialProfileImage =
    enhancedUser?.profileImage && /^https?:\/\//i.test(enhancedUser.profileImage)
      ? enhancedUser.profileImage
      : readProfileImageCache(enhancedUser?.uid);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(initialProfileImage);

  useEffect(() => {
    const img = enhancedUser?.profileImage;
    const resolved = img && /^https?:\/\//i.test(img) ? img : undefined;
    setProfileImageUrl(resolved);
    writeProfileImageCache(enhancedUser?.uid, resolved);
  }, [enhancedUser?.profileImage, enhancedUser?.uid]);

  // Resync notification prefs from server data whenever the auth context
  // refreshes (e.g. AuthContext finishes its initial Firestore fetch).
  useEffect(() => {
    setNotifPrefs({
      emailNotifications:
        enhancedUser?.communicationPreferences?.emailNotifications ??
        NOTIF_DEFAULTS.emailNotifications,
      equipmentTransferAlerts:
        enhancedUser?.communicationPreferences?.equipmentTransferAlerts ??
        NOTIF_DEFAULTS.equipmentTransferAlerts,
    });
  }, [
    enhancedUser?.communicationPreferences?.emailNotifications,
    enhancedUser?.communicationPreferences?.equipmentTransferAlerts,
  ]);

  const userPhoneNumber = enhancedUser?.phoneNumber
    ? formatPhoneForDisplay(enhancedUser.phoneNumber)
    : '—';

  const handleNotifToggle = async (key: NotifPrefKey) => {
    if (savingPref || !enhancedUser?.uid) return;
    const previous = notifPrefs[key];
    const next = !previous;
    setNotifPrefs(prev => ({ ...prev, [key]: next }));
    setSavingPref(key);
    try {
      await updateUserProfile(enhancedUser.uid, {
        communicationPreferences: { [key]: next },
      });
      await refreshEnhancedUser();
      showToast(TEXT_CONSTANTS.SETTINGS.NOTIFICATION_PREFS_SAVED, 'success');
    } catch (error) {
      setNotifPrefs(prev => ({ ...prev, [key]: previous }));
      console.error('[settings] notification toggle failed:', error);
      showToast(TEXT_CONSTANTS.SETTINGS.NOTIFICATION_PREFS_ERROR, 'danger');
    } finally {
      setSavingPref(null);
    }
  };

  // Handle profile image update — Firestore persistence already happens inside
  // ProfileImageUpload's own upload pipeline; we just sync local + cache.
  const handleImageUpdate = (newImageUrl: string) => {
    setProfileImageUrl(newImageUrl);
    writeProfileImageCache(enhancedUser?.uid, newImageUrl);
  };

  return (
    <AuthGuard>
      <AppShell
        title={TEXT_CONSTANTS.SETTINGS.PAGE_TITLE}
        subtitle={TEXT_CONSTANTS.SETTINGS.PAGE_SUBTITLE}
      >
        <div className="max-w-4xl mx-auto w-full">
          {/* Profile Settings Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-100 rounded-lg">
                <UserIcon className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900">
                {TEXT_CONSTANTS.SETTINGS.PROFILE_SETTINGS}
              </h2>
            </div>

            <div className="space-y-6">
              {/* Profile Image */}
              <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                <div className="flex items-center gap-4">
                  {enhancedUser?.uid && (
                    <ProfileImageUpload
                      userId={enhancedUser.uid}
                      currentImageUrl={profileImageUrl}
                      onImageUpdate={handleImageUpdate}
                      size="small"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-neutral-900">
                      {TEXT_CONSTANTS.SETTINGS.PROFILE_IMAGE}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      לחץ על התמונה להעלאת תמונה חדשה
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-success-700 bg-success-50 border border-success-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                  <span aria-hidden>✓</span>
                  <span>פעיל</span>
                </span>
              </div>

              {/* Update Phone Number — single canonical edit surface for the
                  user's phone. The duplicated read-only "Linked Phone" row
                  that used to live in Account Security was removed, since
                  the phone value is already shown right here. */}
              <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-4">
                  <PhoneIcon className="w-5 h-5 text-neutral-400" />
                  <div>
                    <h3 className="font-medium text-neutral-900">
                      {TEXT_CONSTANTS.SETTINGS.UPDATE_PHONE}
                    </h3>
                    <p className="text-sm text-neutral-500" dir="ltr">
                      {userPhoneNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setChangePhoneOpen(true)}
                  className="btn-primary text-sm min-w-[5rem]"
                >
                  עדכן
                </button>
              </div>

              {/* Change Password */}
              <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-4">
                  <KeyIcon className="w-5 h-5 text-neutral-400" />
                  <h3 className="font-medium text-neutral-900">
                    {TEXT_CONSTANTS.SETTINGS.CHANGE_PASSWORD}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(true)}
                  className="btn-primary text-sm min-w-[5rem]"
                >
                  {TEXT_CONSTANTS.SETTINGS.CHANGE_PASSWORD_BTN_SHORT}
                </button>
              </div>
            </div>
          </div>

          {/* Account Security Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-success-100 rounded-lg">
                <ShieldCheckIcon className="w-5 h-5 text-success-600" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900">
                {TEXT_CONSTANTS.SETTINGS.ACCOUNT_SECURITY}
              </h2>
            </div>

            <div className="space-y-4">
              <RevokeSessionsRow />
            </div>
          </div>

          {/* Account Activity (credential audit log) */}
          <AccountActivitySection />

          {/* Notifications Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-info-100 rounded-lg">
                <BellIcon className="w-5 h-5 text-info-600" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900">
                {TEXT_CONSTANTS.SETTINGS.NOTIFICATIONS}
              </h2>
            </div>

            <div className="space-y-4">
              <NotificationToggleRow
                icon={<MailIcon className="w-5 h-5 text-neutral-400" />}
                title={TEXT_CONSTANTS.SETTINGS.EMAIL_NOTIFICATIONS}
                description={TEXT_CONSTANTS.SETTINGS.EMAIL_NOTIFICATIONS_DESC}
                enabled={notifPrefs.emailNotifications}
                saving={savingPref === 'emailNotifications'}
                onToggle={() => handleNotifToggle('emailNotifications')}
              />
              <NotificationToggleRow
                icon={<PackageIcon className="w-5 h-5 text-neutral-400" />}
                title={TEXT_CONSTANTS.SETTINGS.EQUIPMENT_TRANSFER_ALERTS}
                description={TEXT_CONSTANTS.SETTINGS.EQUIPMENT_TRANSFER_DESC}
                enabled={notifPrefs.equipmentTransferAlerts}
                saving={savingPref === 'equipmentTransferAlerts'}
                onToggle={() => handleNotifToggle('equipmentTransferAlerts')}
              />
            </div>
          </div>

          {/* Language & Display section removed — i18n + theming (PR-F) is
              still pending. Both selects were `disabled` and gave the wrong
              signal that a choice was possible. Section will return once
              the language toggle is wired. */}

          {/* Permissions — keep request-permission entry. Delete-account
              moves into its own "איזור מסוכן" section below. */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-100 rounded-lg">
                <LockIcon className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900">
                {TEXT_CONSTANTS.SETTINGS.PRIVACY_PERMISSIONS}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <LockIcon className="w-5 h-5 text-neutral-400" />
                  <h3 className="font-medium text-neutral-900">
                    {TEXT_CONSTANTS.SETTINGS.REQUEST_PERMISSION}
                  </h3>
                </div>
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 text-sm bg-neutral-100 text-neutral-400 rounded-lg cursor-not-allowed flex items-center gap-2 min-w-[5rem]"
                >
                  {TEXT_CONSTANTS.SETTINGS.REQUEST_PERMISSION}
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone — destructive, irreversible actions. Visually
              separated from the rest of the settings to make accidental
              clicks less likely. */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-danger-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-danger-100 rounded-lg">
                <AlertTriangleIcon className="w-5 h-5 text-danger-600" />
              </div>
              <h2 className="text-xl font-bold text-danger-700">
                {TEXT_CONSTANTS.SETTINGS.DANGER_ZONE}
              </h2>
            </div>

            <div className="flex items-center justify-between p-4 border border-danger-200 rounded-xl bg-danger-50">
              <div className="flex items-center gap-4">
                <TrashIcon className="w-5 h-5 text-danger-500" />
                <div>
                  <h3 className="font-medium text-danger-900">
                    {hasPendingDeletion
                      ? TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_PENDING_TITLE
                      : TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT}
                  </h3>
                  <p className="text-sm text-danger-600">
                    {hasPendingDeletion
                      ? TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_PENDING_DAYS_LEFT(
                          daysUntilHardDelete(enhancedUser?.deletionRequestedAt),
                        )
                      : TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_WARNING}
                  </p>
                </div>
              </div>
              {hasPendingDeletion ? (
                <button
                  type="button"
                  onClick={handleCancelDeletion}
                  disabled={cancellingDeletion}
                  className="btn-ghost text-sm border border-danger-300 text-danger-700 min-w-[5rem]"
                >
                  {cancellingDeletion
                    ? TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_CANCELLING
                    : TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_CANCEL_BUTTON}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteAccountOpen(true)}
                  className="btn-danger text-sm min-w-[5rem]"
                >
                  {TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_BTN_SHORT}
                </button>
              )}
            </div>
          </div>
        </div>

        <ChangePasswordModal
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          onSuccess={() => showToast(TEXT_CONSTANTS.SETTINGS.CHANGE_PASSWORD_SUCCESS, 'success')}
        />
        <ChangePhoneModal
          open={changePhoneOpen}
          onClose={() => setChangePhoneOpen(false)}
          onSuccess={() => showToast(TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_SUCCESS, 'success')}
        />
        <DeleteAccountModal
          open={deleteAccountOpen}
          onClose={() => setDeleteAccountOpen(false)}
          onSuccess={() => showToast(TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_SUCCESS, 'success')}
        />
      </AppShell>
    </AuthGuard>
  );
}