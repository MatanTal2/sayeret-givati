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
  ADMIN_CONFIG: 'admin_config',
  ANNOUNCEMENTS: 'announcements',
  USEFUL_LINKS: 'useful_links',
  UNIT_MEDIA: 'unit_media',
  RETIREMENT_REQUESTS: 'retirementRequests',
  EXCHANGE_REQUESTS: 'exchangeRequests',
  REPORT_REQUESTS: 'reportRequests',
  EQUIPMENT_DRAFTS: 'equipmentDrafts',
  AMMUNITION_TEMPLATES: 'ammunitionTemplates',
  AMMUNITION: 'ammunition',
  AMMUNITION_INVENTORY: 'ammunitionInventory',
  AMMUNITION_REPORTS: 'ammunitionReports',
  AMMUNITION_REPORT_REQUESTS: 'ammunitionReportRequests',
  SYSTEM_CONFIG: 'systemConfig',
  PERMISSION_GRANTS: 'permissionGrants',
  SOLDIER_STATUS: 'soldierStatus',
  TRAINING_PLANS: 'trainingPlans',
  PHONE_BOOK: 'phoneBook',
  GUARD_SCHEDULES: 'guardSchedules',
  CREDENTIAL_AUDIT_LOG: 'credentialAuditLog',
  PHONE_CHANGE_PENDING: 'phoneChangePending',
  PHONE_CHANGE_RATE_LIMIT: 'phoneChangeRateLimit',
  LOGISTICS_TEMPLATES: 'logisticsTemplates',
  LOGISTICS_ITEMS: 'logisticsItems',
  IDEMPOTENCY: '_idempotency',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
