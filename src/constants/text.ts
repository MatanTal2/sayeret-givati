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
    REGISTRATION_NOTE: 'מותר להירשם רק לחיילים מאושרים מראש',
    OTP_VERIFICATION: 'אימות טלפון',
    OTP_SENT_MESSAGE: 'קוד בן 6 ספרות נשלח למספר הטלפון שלך',
    OTP_INPUT_PLACEHOLDER: 'הזן קוד 6 ספרות',
    VERIFY_OTP_CODE: 'אמת קוד',
    RESEND_CODE: 'שלח קוד מחדש',
    OTP_INVALID: 'הקוד חייב להכיל 6 ספרות בדיוק',
    REGISTRATION_DETAILS: 'פרטי הרשמה',
    FIRST_NAME: 'שם פרטי',
    LAST_NAME: 'שם משפחה',
    PHONE_NUMBER: 'מספר טלפון',
    EMAIL_ADDRESS: 'כתובת אימייל',
    PASSWORD: 'סיסמה',
    GENDER: 'מין',
    GENDER_MALE: 'זכר',
    GENDER_FEMALE: 'נקבה',
    GENDER_OTHER: 'אחר',
    BIRTHDATE: 'תאריך לידה',
    CONSENT_TERMS: 'אני מסכים/ה לתנאי השימוש ומדיניות הפרטיות',
    CREATE_ACCOUNT: 'צור חשבון',
    EMAIL_PLACEHOLDER_REGISTRATION: 'example@email.com',
    PASSWORD_PLACEHOLDER_REGISTRATION: 'הזן סיסמה חזקה',
    BIRTHDATE_PLACEHOLDER: 'בחר תאריך לידה',
    REGISTRATION_SUCCESS: 'הרשמה בוצעה בהצלחה!',
    CONTINUE_TO_SYSTEM: 'המשך למערכת'
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

  // Settings Page
  SETTINGS: {
    PAGE_TITLE: 'הגדרות',
    PAGE_SUBTITLE: 'ניהול הגדרות אישיות ומערכת',
    
    // Profile Settings Section
    PROFILE_SETTINGS: 'הגדרות פרופיל',
    PROFILE_IMAGE: 'תמונת פרופיל',
    CHANGE_PROFILE_IMAGE: 'שנה תמונת פרופיל',
    UPDATE_PHONE: 'עדכן מספר טלפון',
    CHANGE_PASSWORD: 'שנה סיסמה',
    
    // Account Security Section
    ACCOUNT_SECURITY: 'אבטחת חשבון',
    LINKED_PHONE: 'טלפון מקושר',
    PHONE_NUMBER: 'מספר טלפון:',
    
    // Notifications Section
    NOTIFICATIONS: 'התראות',
    EMAIL_NOTIFICATIONS: 'התראות אימייל',
    EMAIL_NOTIFICATIONS_DESC: 'קבל עדכונים חשובים באימייל',
    EQUIPMENT_TRANSFER_ALERTS: 'התראות העברת ציוד',
    EQUIPMENT_TRANSFER_DESC: 'קבל התראות על בקשות והעברות ציוד',
    TRANSFER_REQUESTS: 'בקשות העברה',
    PENDING_TRANSFERS: 'העברות ממתינות',
    
    // Language & Display Section  
    LANGUAGE_DISPLAY: 'שפה ותצוגה',
    LANGUAGE_SELECTOR: 'בחירת שפה',
    LANGUAGE_HEBREW: 'עברית',
    LANGUAGE_ENGLISH: 'English',
    THEME_SWITCHER: 'מצב תצוגה',
    THEME_LIGHT: 'בהיר',
    THEME_DARK: 'כהה',
    
    // Privacy & Permissions Section
    PRIVACY_PERMISSIONS: 'פרטיות והרשאות',
    REQUEST_PERMISSION: 'בקש הרשאה',
    REQUEST_PERMISSION_DESC: 'שלח בקשה למנהל המערכת לקבלת הרשאות נוספות',
    DELETE_ACCOUNT: 'מחק חשבון',
    DELETE_ACCOUNT_WARNING: 'פעולה זו בלתי הפיכה',
    
    // Placeholders and labels
    COMING_SOON: 'בקרוב',
    NOT_CONFIGURED: 'לא מוגדר',
    SAVE_CHANGES: 'שמור שינויים',
    CANCEL: 'ביטול',
    ENABLED: 'מופעל',
    DISABLED: 'מבוטל'
  },

  // Management Page
  MANAGEMENT: {
    // Main Page
    PAGE_TITLE: 'ניהול מערכת',
    PAGE_SUBTITLE: 'כלי ניהול מתקדמים לסיירת גבעתי',
    ACCESS_DENIED_SUBTITLE: 'גישה מוגבלת',
    WELCOME_MESSAGE: 'שלום',
    DEFAULT_ADMIN_NAME: 'מנהל',
    WELCOME_DESCRIPTION: 'ברוך הבא למרכז הניהול של מערכת סיירת גבעתי. כאן תוכל לנהל משתמשים, הרשאות וביצועים מתקדמים.',
    FOOTER_TEXT: 'מערכת ניהול סיירת גבעתי • גרסה 1.0 • פותח ע"י מתן טל',
    
    // Access Control
    ACCESS_DENIED_TITLE: 'אין הרשאה לגישה',
    ACCESS_DENIED_MESSAGE: 'דף זה מיועד למשתמשים עם הרשאות ניהול בלבד (קצין, מפקד או מנהל מערכת).',
    CURRENT_ROLE_LABEL: 'התפקיד הנוכחי שלך:',
    ADMIN_ROLE_TEXT: 'מנהל מערכת',
    ROLE_NOT_IDENTIFIED: 'לא זוהה',
    ROLE_LABEL: 'תפקיד:',
    
    // Placeholder Content
    UNDER_DEVELOPMENT: 'בפיתוח',
    FEATURE_COMING_SOON: 'תכונה זו נמצאת כרגע בפיתוח ותהיה זמינה בקרוב.',
    
    // Management Tabs
    TABS: {
      USERS: {
        LABEL: 'ניהול משתמשים',
        DESCRIPTION: 'ניהול משתמשים, הרשאות ותפקידים'
      },
      PERMISSIONS: {
        LABEL: 'הרשאות',
        DESCRIPTION: 'ניהול הרשאות מערכת ובקרת גישה'
      },
      ENFORCE_TRANSFER: {
        LABEL: 'העברת ציוד כפויה',
        DESCRIPTION: 'ביצוע העברות ציוד בחירום וכפייה'
      },
      SYSTEM_CONFIG: {
        LABEL: 'הגדרות מערכת',
        DESCRIPTION: 'הגדרות כלליות ותצורת מערכת'
      },
      DATA_MANAGEMENT: {
        LABEL: 'ניהול נתונים',
        DESCRIPTION: 'גיבוי, שחזור ואחזקת נתונים'
      },
      AUDIT_LOGS: {
        LABEL: 'יומני ביקורת',
        DESCRIPTION: 'מעקב פעילות ויומני מערכת'
      },
      ITEM_TYPES: {
        LABEL: 'ניהול סוגי פריטים',
        DESCRIPTION: 'ניהול תבניות ציוד - הוספה, עריכה וארגון של סוגי פריטים'
      },
      SEND_EMAIL: {
        LABEL: 'שליחת אימייל למשתמשים',
        DESCRIPTION: 'שליחת הודעות אימייל לקבוצות משתמשים או משתמשים ספציפיים'
      }
    },
    
    // Email Tab
    EMAIL: {
      RECIPIENT_SELECTION: 'בחירת נמענים',
      ALL_USERS: 'כל המשתמשים במערכת',
      BY_ROLE: 'לפי תפקיד',
      SPECIFIC_USERS: 'משתמשים ספציפיים (בפיתוח)',
      
      MESSAGE_CONTENT: 'תוכן ההודעה',
      URGENT_MESSAGE: 'הודעה דחופה (עדיפות גבוהה)',
      SUBJECT_LABEL: 'נושא ההודעה',
      SUBJECT_PLACEHOLDER: 'הכנס נושא להודעה...',
      MESSAGE_LABEL: 'תוכן ההודעה',
      MESSAGE_PLACEHOLDER: 'כתוב את תוכן ההודעה כאן...',
      
      PREVIEW_AND_SEND: 'תצוגה מקדימה ושליחה',
      RECIPIENTS_PREVIEW: 'נמענים:',
      SUBJECT_PREVIEW: 'נושא:',
      MESSAGE_PREVIEW: 'הודעה:',
      ALL_USERS_TEXT: 'כל המשתמשים',
      SELECTED_ROLES_TEXT: 'תפקידים נבחרים:',
      SPECIFIC_USERS_TEXT: 'משתמשים ספציפיים',
      NO_SUBJECT: '(ללא נושא)',
      NO_CONTENT: '(ללא תוכן)',
      URGENT_INDICATOR: ' - דחוף!',
      
      DEMO_WARNING: '⚠️ זהו ממשק הדמייה בלבד. לא יישלחו אימיילים אמיתיים.',
      SEND_BUTTON: 'שלח הודעה',
      SUCCESS_MESSAGE: 'הודעת האימייל נשלחה בהצלחה! (זהו הדמייה בלבד)',
      
      // Role Options
      ROLES: {
        SOLDIERS: 'חיילים',
        OFFICERS: 'קצינים',
        COMMANDERS: 'מפקדים',
        EQUIPMENT_MANAGERS: 'מנהלי ציוד',
        ADMINS: 'מנהלי מערכת'
      }
    }
  },

  // Accessibility
  ARIA_LABELS: {
    CLOSE_MODAL: 'סגור חלון',
    SHOW_PASSWORD: 'הצג סיסמה',
    HIDE_PASSWORD: 'הסתר סיסמה',
    LOGO: 'לוגו סיירת גבעתי',
    MAIN_MENU: 'תפריט ראשי',
    NOTIFICATION_BUTTON: 'התראות',
    EQUIPMENT_NOTIFICATIONS: 'התראות ציוד'
  }
} as const;

// Export individual sections for easier imports
export const { BUTTONS, AUTH, FEATURES, ADMIN, ERRORS, SUCCESS, MANAGEMENT, ARIA_LABELS } = TEXT_CONSTANTS; 