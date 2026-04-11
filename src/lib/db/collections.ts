/**
 * Central collection name constants.
 * All Firestore collection references must use these — never raw strings.
 */
export const COLLECTIONS = {
  USERS: 'users',
  AUTHORIZED_PERSONNEL: 'authorized_personnel',
  EQUIPMENT: 'equipment',
  EQUIPMENT_TEMPLATES: 'equipmentTemplates',
  TRANSFER_REQUESTS: 'transferRequests',
  ACTIONS_LOG: 'actionsLog',
  NOTIFICATIONS: 'notifications',
  CATEGORIES: 'categories',
  SUBCATEGORIES: 'subcategories',
  OTP_SESSIONS: 'otp_sessions',
  OTP_RATE_LIMITS: 'otp_rate_limits',
  ADMIN_CONFIG: 'admin_config',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
