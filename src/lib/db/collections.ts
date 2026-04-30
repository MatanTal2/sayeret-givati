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
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
