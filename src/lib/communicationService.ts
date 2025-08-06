/**
 * Service for managing user communication preferences
 */

import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { CommunicationPreferences } from '@/types/user';
import { ADMIN_CONFIG } from '@/constants/admin';

export interface UpdatePreferencesRequest {
  uid: string;
  preferences: Partial<CommunicationPreferences>;
  updatedBy: string;
}

export interface UpdatePreferencesResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Service class for managing communication preferences
 */
export class CommunicationService {
  /**
   * Get default communication preferences for new users
   */
  static getDefaultPreferences(uid: string): CommunicationPreferences {
    return {
      emailNotifications: true, // Default to enabled for important system notifications
      equipmentTransferAlerts: true, // Default to enabled for equipment-related alerts
      systemUpdates: false, // Default to disabled for non-critical updates
      schedulingAlerts: true, // Default to enabled for scheduling notifications
      emergencyNotifications: true, // Always default to enabled for emergency alerts
      lastUpdated: serverTimestamp() as Timestamp,
      updatedBy: uid // Self-created during registration
    };
  }

  /**
   * Update communication preferences for a user
   */
  static async updatePreferences(request: UpdatePreferencesRequest): Promise<UpdatePreferencesResult> {
    try {
      console.log('📝 Updating communication preferences for user:', request.uid);

      // Build the update object with dot notation (Firestore supports this)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: { [key: string]: any } = {
        'communicationPreferences.lastUpdated': serverTimestamp(),
        'communicationPreferences.updatedBy': request.updatedBy,
        updatedAt: serverTimestamp()
      };

      // Add each preference field to the update object
      if (request.preferences.emailNotifications !== undefined) {
        updateData['communicationPreferences.emailNotifications'] = request.preferences.emailNotifications;
      }
      if (request.preferences.equipmentTransferAlerts !== undefined) {
        updateData['communicationPreferences.equipmentTransferAlerts'] = request.preferences.equipmentTransferAlerts;
      }
      if (request.preferences.systemUpdates !== undefined) {
        updateData['communicationPreferences.systemUpdates'] = request.preferences.systemUpdates;
      }
      if (request.preferences.schedulingAlerts !== undefined) {
        updateData['communicationPreferences.schedulingAlerts'] = request.preferences.schedulingAlerts;
      }
      if (request.preferences.emergencyNotifications !== undefined) {
        updateData['communicationPreferences.emergencyNotifications'] = request.preferences.emergencyNotifications;
      }

      // Update the user document in Firestore
      const userDocRef = doc(db, ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION, request.uid);
      await updateDoc(userDocRef, updateData);

      console.log('✅ Communication preferences updated successfully');

      return {
        success: true,
        message: 'Communication preferences updated successfully'
      };

    } catch (error) {
      console.error('❌ Error updating communication preferences:', error);
      
      return {
        success: false,
        error: 'Failed to update communication preferences. Please try again.'
      };
    }
  }

  /**
   * Validate communication preferences object
   */
  static validatePreferences(preferences: Partial<CommunicationPreferences>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for valid boolean values
    const booleanFields = [
      'emailNotifications',
      'equipmentTransferAlerts', 
      'systemUpdates',
      'schedulingAlerts',
      'emergencyNotifications'
    ];

    booleanFields.forEach(field => {
      if (field in preferences && typeof preferences[field as keyof CommunicationPreferences] !== 'boolean') {
        errors.push(`${field} must be a boolean value`);
      }
    });

    // Emergency notifications should always be enabled (business rule)
    if ('emergencyNotifications' in preferences && !preferences.emergencyNotifications) {
      errors.push('Emergency notifications cannot be disabled');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user should receive a specific type of notification
   */
  static shouldReceiveNotification(
    preferences: CommunicationPreferences | undefined,
    notificationType: keyof Omit<CommunicationPreferences, 'lastUpdated' | 'updatedBy'>
  ): boolean {
    if (!preferences) {
      // If preferences not set, use safe defaults
      const defaults = this.getDefaultPreferences('unknown');
      return defaults[notificationType];
    }

    return preferences[notificationType];
  }

  /**
   * Get preference labels for UI display
   */
  static getPreferenceLabels(): Record<keyof Omit<CommunicationPreferences, 'lastUpdated' | 'updatedBy'>, { label: string; description: string }> {
    return {
      emailNotifications: {
        label: 'התראות אימייל',
        description: 'קבל עדכונים חשובים באימייל'
      },
      equipmentTransferAlerts: {
        label: 'התראות העברת ציוד', 
        description: 'קבל התראות על בקשות והעברות ציוד'
      },
      systemUpdates: {
        label: 'עדכוני מערכת',
        description: 'קבל הודעות על עדכונים ושיפורים במערכת'
      },
      schedulingAlerts: {
        label: 'התראות שמירות',
        description: 'קבל התראות על שיבוצי שמירות ושינויים'
      },
      emergencyNotifications: {
        label: 'התראות חירום',
        description: 'התראות חירום קריטיות (לא ניתן לבטל)'
      }
    };
  }
}