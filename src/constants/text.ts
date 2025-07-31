// Centralized Text Configuration
// All text content for the application in one place for easy maintenance

export const TEXT_CONSTANTS = {
  // App Branding
  APP_NAME: 'מערכת ניהול - מסייעת סיירת גבעתי',
  APP_SUBTITLE: 'פלטפורמה מרכזית לניהול פעילויות הסיירת - מעקב חיילים, ציוד ותכנון משימות',
  COMPANY_NAME: 'מערכת ניהול סיירת גבעתי',
  VERSION: 'גרסה 0.2.0-alpha',
  LAST_UPDATED: 'עודכן לאחרונה: דצמבר 2024',

  // Navigation & Buttons
  BUTTONS: {
    LOGIN: 'התחברות',
    LOGOUT: 'יציאה',
    REGISTER: 'הרשמה חדשה',
    CLOSE: 'סגור',
    LOADING: 'טוען...',
    CONNECTING: 'מתחבר...',
    CREATE: 'צור',
    SAVE: 'שמור',
    CANCEL: 'ביטול',
    SUBMIT: 'שלח',
    EDIT: 'ערוך',
    DELETE: 'מחק',
    FORGOT_PASSWORD: 'שכחת סיסמה?',
    GO_TO_ADMIN: 'מעבר לניהול'
  },

  // Authentication
  AUTH: {
    WELCOME_MESSAGE: 'שלום',
    LOGIN_TO_SYSTEM: 'התחברות למערכת',
    LOGIN_SUBTITLE: 'היכנס עם הפרטים שלך',
    EMAIL_LABEL: 'אימייל',
    PASSWORD_LABEL: 'סיסמה',
    EMAIL_PLACEHOLDER: 'אימייל',
    PASSWORD_PLACEHOLDER: 'סיסמה',
    NO_ACCOUNT: 'עדיין אין לך חשבון?',
    OR_DIVIDER: 'או',
    SHOW_PASSWORD: 'הצג סיסמה',
    HIDE_PASSWORD: 'הסתר סיסמה',
    REGISTER_TO_SYSTEM: 'הרשמה למערכת',
    WELCOME_TO_SYSTEM: 'ברוכים הבאים למערכת',
    SYSTEM_SUBTITLE: 'מסייעת סיירת גבעתי',
    IDENTITY_VERIFICATION: 'אימות זהות',
    PERSONAL_NUMBER_PLACEHOLDER: 'מספר אישי',
    PERSONAL_NUMBER_HELPER: 'הזן מספר אישי בין 5-7 ספרות',
    VERIFY_PERSONAL_NUMBER: 'אמת מספר אישי',
    REGISTRATION_NOTE: 'מותר להירשם רק לחיילים מאושרים מראש'
  },

  // User Profile Menu
  PROFILE: {
    MY_PROFILE: 'הפרופיל שלי',
    SETTINGS: 'הגדרות',
    DEFAULT_USER: 'משתמש'
  },

  // Features & Pages
  FEATURES: {
    SECTION_TITLE: 'כלים ומערכות',
    SOLDIER_MANAGEMENT: {
      TITLE: 'ניהול שבצ"ק',
      DESCRIPTION: 'מעקב וניהול סטטוס חיילים'
    },
    SOLDIER_TRACKING: {
      TITLE: 'מעקב לוחם',
      DESCRIPTION: 'מעקב כישורים והרשאות חיילים'
    },
    LOGISTICS: {
      TITLE: 'לוגיסטיקה',
      DESCRIPTION: 'ניהול ציוד ואספקה'
    },
    EQUIPMENT: {
      TITLE: 'צלם',
      DESCRIPTION: 'ניהול ציוד צבאי עם מספר סידורי'
    },
    CONVOYS: {
      TITLE: 'שיירות',
      DESCRIPTION: 'תכנון וניהול שיירות'
    },
    GUARD_SCHEDULER: {
      TITLE: 'מחולל שמירות',
      DESCRIPTION: 'יצירת לוחות שמירה אוטומטיים עם אילוצים'
    },
    ADDITIONAL_TOOLS: {
      TITLE: 'כלים נוספים',
      DESCRIPTION: 'כלים נוספים בפיתוח'
    }
  },

  // Status & Messages
  STATUS: {
    AVAILABLE: 'זמין',
    NOT_AVAILABLE: 'לא זמין',
    IN_DEVELOPMENT: 'בפיתוח',
    COMING_SOON: 'בקרוב',
    REQUIRES_AUTH: 'דרוש חיבור למערכת',
    REQUIRES_ADMIN: 'דרושות הרשאות ניהול',
    LOGIN_TO_ACCESS: 'התחבר לגישה'
  },

  // Footer Links
  FOOTER: {
    QUICK_LINKS: 'קישורים מהירים',
    SUPPORT: 'תמיכה',
    INFO: 'מידע',
    ADMIN_INTERFACE: 'ממשק ניהול',
    USER_GUIDE: 'מדריך למשתמש',
    CONTACT: 'צור קשר'
  },

  // Admin Panel
  ADMIN: {
    PANEL_TITLE: '🔧 System Admin Panel',
    PANEL_SUBTITLE: 'Sayeret Givati Equipment Management System',
    LOADING_MESSAGE: 'Loading...',
    SETUP_TITLE: '🔧 Admin User Setup',
    SETUP_INSTRUCTIONS: 'Setup Instructions:',
    ADMIN_PASSWORD_LABEL: 'Admin Password:',
    PASSWORD_PLACEHOLDER: 'Enter a secure password...',
    CREATE_ADMIN_USER: '🔧 Create Admin User',
    CREATING: '⏳ Creating...',
    CREATED: '✅ Created'
  },

  // Error Messages
  ERRORS: {
    FIELD_REQUIRED: 'שדה חובה',
    INVALID_EMAIL: 'כתובת אימייל לא חוקית',
    PASSWORD_TOO_SHORT: 'סיסמה קצרה מדי',
    LOGIN_FAILED: 'התחברות נכשלה',
    CONNECTION_ERROR: 'שגיאת חיבור'
  },

  // Success Messages
  SUCCESS: {
    LOGIN_SUCCESS: 'התחברות בוצעה בהצלחה',
    LOGOUT_SUCCESS: 'התנתקות בוצעה בהצלחה',
    SAVE_SUCCESS: 'השמירה בוצעה בהצלחה'
  },

  // Accessibility
  ARIA_LABELS: {
    CLOSE_MODAL: 'סגור חלון',
    SHOW_PASSWORD: 'הצג סיסמה',
    HIDE_PASSWORD: 'הסתר סיסמה',
    LOGO: 'לוגו סיירת גבעתי',
    MAIN_MENU: 'תפריט ראשי'
  }
} as const;

// Export individual sections for easier imports
export const { BUTTONS, AUTH, FEATURES, ADMIN, ERRORS, SUCCESS, ARIA_LABELS } = TEXT_CONSTANTS; 