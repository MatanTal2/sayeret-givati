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
    ALREADY_REGISTERED: 'משתמש זה כבר רשום במערכת. אנא השתמש בעמוד ההתחברות.',
    OTP_VERIFICATION: 'אימות טלפון',
    OTP_SENT_MESSAGE: 'קוד בן 6 ספרות נשלח למספר הטלפון שלך',
    OTP_INPUT_PLACEHOLDER: 'הזן קוד 6 ספרות',
    VERIFY_OTP_CODE: 'אמת קוד',
    RESEND_CODE: 'שלח קוד מחדש',
    OTP_INVALID: 'הקוד חייב להכיל 6 ספרות בדיוק',
    
    // OTP Error Messages
    OTP_WRONG_CODE: 'קוד האימות שגוי',
    OTP_CONNECTION_ERROR: 'שגיאת חיבור. אנא בדוק את החיבור לאינטרנט ונסה שוב.',
    OTP_RESEND_FAILED: 'שליחת הקוד מחדש נכשלה',
    OTP_VERIFYING: 'מאמת קוד...',
    
    // OTP API Messages
    OTP_PHONE_REQUIRED: 'Phone number is required and must be a string',
    OTP_INVALID_PHONE_FORMAT: 'Invalid phone number format',
    OTP_RATE_LIMITED: 'יותר מדי ניסיונות. נסה שוב ב-{resetTime}',
    OTP_RATE_LIMITED_FALLBACK: 'יותר מדי ניסיונות. נסה שוב במספר דקות',
    OTP_SMS_SEND_ERROR: 'שגיאה בשליחת הודעה. אנא נסה שוב מאוחר יותר.',
    OTP_SENT_SUCCESS: 'קוד אימות נשלח בהצלחה',
    OTP_INTERNAL_ERROR: 'שגיאה פנימית במערכת. אנא נסה שוב מאוחר יותר.',
    OTP_METHOD_NOT_ALLOWED: 'Method not allowed. Use POST to send OTP.',
    
    // System Policy Content
    SYSTEM_POLICY_TITLE: 'תנאי השימוש ומדיניות הפרטיות',
    SYSTEM_POLICY_CONTENT: `מערכת ניהול סיירת גבעתי

תנאי השימוש:

1. השימוש במערכת מיועד אך ורק לחיילים מאושרים בסיירת גבעתי.

2. אין לחלוק פרטי התחברות או מידע רגיש מהמערכת עם גורמים לא מורשים.

3. כל פעילות במערכת מתועדת ומנוטרת למטרות אבטחה וביקורת.

4. השימוש במערכת מחייב שמירה על חיסיון וסודיות מידע צבאי.

מדיניות פרטיות:

1. המערכת אוספת מידע אישי וצבאי הנדרש לתפעול היחידה.

2. המידע מאוחסן באופן מאובטח ומוגן בהתאם לתקנות הצבא.

3. המידע משמש אך ורק למטרות תפעוליות ולא יועבר לגורמים חיצוניים ללא אישור.

4. ניתן לפנות למנהל המערכת לבקשת עדכון או מחיקת מידע אישי.

על ידי הסכמתך, אתה מאשר כי קראת והבנת את התנאים לעיל.`,
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
    TERMS_AND_CONDITIONS: 'תנאי השימוש ומדיניות הפרטיות',
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
    DEFAULT_USER: 'משתמש',
    
    // Profile Page
    PAGE_TITLE: 'הפרופיל שלי',
    PAGE_SUBTITLE: 'צפייה ועריכת פרטים אישיים',
    
    // Fallback Values
    NOT_AVAILABLE: 'לא זמין',
    NO_RANK: 'ללא דרגה',
    INVALID_DATE: 'תאריך לא חוקי',
    
    // Status Labels
    ACTIVE: 'פעיל',
    INACTIVE: 'לא פעיל',
    TRANSFERRED: 'הועבר',
    DISCHARGED: 'שוחרר',
    
    // Gender Labels
    MALE: 'זכר',
    FEMALE: 'נקבה',
    
    // Role Labels
    SOLDIER: 'חייל',
    COMMANDER: 'מפקד',
    OFFICER: 'קצין',
    EQUIPMENT_MANAGER: 'מנהל ציוד',
    
    // User Type Labels
    ADMIN: 'מנהל מערכת',
    SYSTEM_MANAGER: 'מנהל מערכת',
    MANAGER: 'מנהל',
    TEAM_LEADER: 'מפקד צוות',
    USER: 'חייל',
    
    // Section Titles
    PERSONAL_INFO: 'פרטים אישיים',
    MILITARY_INFO: 'פרטים צבאיים',
    CONTACT_INFO: 'פרטי קשר',
    SYSTEM_INFO: 'מידע מערכת',
    
    // Field Labels
    FIRST_NAME: 'שם פרטי',
    LAST_NAME: 'שם משפחה',
    GENDER: 'מין',
    BIRTH_DATE: 'תאריך לידה',
    RANK: 'דרגה',
    ROLE: 'תפקיד',
    JOIN_DATE: 'תאריך כניסה ליחידה',
    STATUS: 'סטטוס',
    EMAIL: 'אימייל',
    UNIQUE_ID: 'מזהה ייחודי',
    USER_TYPE: 'סוג משתמש',
    TEST_ACCOUNT: 'חשבון בדיקה',
    
    // Data Source Info
    DATA_SOURCE_TITLE: 'מקור הנתונים',
    DATA_SOURCE_SYSTEM: 'הנתונים מגיעים ממסד הנתונים של המערכת ומתעדכנים אוטומטית.',
    DATA_SOURCE_AUTH: 'חלק מהנתונים מגיעים מחשבון האימות. להשלמת הפרטים, פנה למנהל המערכת.'
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
      DESCRIPTION: 'ניהול ציוד צבאי עם מספר סידורי',
      ADD_NEW: 'הוסף ציוד',
      
      // Status Text
      STATUS_AVAILABLE: 'זמין',
      STATUS_IN_USE: 'בשימוש',
      STATUS_MAINTENANCE: 'בתחזוקה',
      STATUS_REPAIR: 'בתיקון',
      STATUS_LOST: 'אבוד',
      STATUS_RETIRED: 'הוחזר',
      
      // Condition Text
      CONDITION_NEW: 'חדש',
      CONDITION_EXCELLENT: 'מצוין',
      CONDITION_GOOD: 'טוב',
      CONDITION_FAIR: 'בסדר',
      CONDITION_POOR: 'גרוע',
      CONDITION_NEEDS_REPAIR: 'דורש תיקון',
      
      // UI Labels
      SERIAL_NUMBER: 'מספר סידורי',
      PRODUCT_NAME: 'שם פריט',
      CATEGORY: 'קטגוריה',
      CURRENT_HOLDER: 'מחזיק נוכחי',
      ASSIGNED_UNIT: 'יחידה משובצת',
      LOCATION: 'מיקום',
      LAST_CHECK: 'בדיקה אחרונה',
      DATE_SIGNED: 'תאריך קבלה',
      NOTES: 'הערות',
      
      // Actions
      TRANSFER_EQUIPMENT: 'העבר ציוד',
      UPDATE_STATUS: 'עדכן סטטוס',
      UPDATE_CONDITION: 'עדכן מצב',
      DAILY_CHECK: 'בדיקה יומית',
      VIEW_HISTORY: 'הצג היסטוריה',
      SHOW_MORE_DETAILS: 'הצג עוד פרטים',
      
      // Tabs
      MY_EQUIPMENT: 'הציוד שלי',
      ADDITIONAL_EQUIPMENT: 'ציוד נוסף',
      
      // Advanced Filters
      SHOW_ADVANCED_FILTERS: 'הצג סינון מתקדם',
      HIDE_ADVANCED_FILTERS: 'הסתר סינון מתקדם',
      
      // Messages
      NO_EQUIPMENT: 'אין ציוד רשום במערכת',
      LOADING_EQUIPMENT: 'טוען ציוד...',
      ERROR_LOADING: 'שגיאה בטעינת הציוד',
      REFRESHING: 'מרענן...',
      REFRESH: 'רענן',
      TRY_AGAIN: 'נסה שוב',
      REFRESH_PAGE: 'רענן דף',
      
      // Empty State Messages
      NO_ITEMS_FOUND: 'לא נמצאו פריטים התואמים לחיפוש',
      CHANGE_SEARCH_PARAMS: 'נסה לשנות את פרמטרי החיפוש או הסינון',
      ADD_EQUIPMENT_TO_START: 'הוסף פריטי ציוד למערכת כדי להתחיל בניהול',
      SEARCH_TIP: 'טיפ: נסה חיפוש רחב יותר או בדוק את הפילטרים',
      
      // Error Messages
      UNEXPECTED_ERROR: 'אירעה שגיאה לא צפויה בטעינת רכיב הציוד',
      TECHNICAL_DETAILS: 'פרטים טכניים',
      CONTACT_ADMIN: 'אם הבעיה נמשכת, פנה למנהל המערכת',
      
      // Search and Filters
      SEARCH_PLACEHOLDER: 'חיפוש לפי מספר סידורי, שם פריט, מחזיק...',
      ALL_STATUSES: 'כל הסטטוסים',
      ALL_CONDITIONS: 'כל המצבים',
      SHOWING_RESULTS: 'מציג {count} מתוך {total} פריטי ציוד',
      NO_EQUIPMENT_FILTERED: 'טרם נוסף ציוד למערכת',
      
      // Time Formatting
      HOURS_AGO: 'לפני {hours} שעות',
      DAYS_AGO: 'לפני {days} ימים',
      SIGNED_BY: 'על ידי {name}',
      
      // Development Status
      STEP_INTERFACE_DEV: 'Step 1.2 - Interface Development',
      STATUS_UI_COMPLETED: 'Step 1.2 - Basic Equipment Interface (UI Components Completed)',
      NEXT_FORMS_ACTIONS: 'Next: Forms & Actions Implementation',
      
      // Table Headers
      TABLE_SERIAL: 'מס\' סידורי',
      TABLE_ITEM: 'פריט',
      TABLE_HOLDER: 'מחזיק',
      TABLE_STATUS: 'סטטוס',
      TABLE_CONDITION: 'מצב',
      TABLE_LOCATION: 'מיקום',
      TABLE_ACTIONS: 'פעולות',
      TABLE_LAST_CHECK: 'בדיקה אחרונה',
      
      // Equipment Service Messages
      EQUIPMENT_TYPE_EXISTS: 'סוג ציוד זה כבר קיים במערכת',
      EQUIPMENT_TYPE_CREATED: 'סוג הציוד נוצר בהצלחה',
      EQUIPMENT_TYPE_NOT_FOUND: 'סוג הציוד לא נמצא',
      EQUIPMENT_TYPE_UPDATED: 'סוג הציוד עודכן בהצלחה',
      EQUIPMENT_EXISTS: 'ציוד עם מספר סידורי זה כבר קיים',
      EQUIPMENT_CREATED: 'הציוד נוצר בהצלחה',
      EQUIPMENT_NOT_FOUND: 'הציוד לא נמצא',
      EQUIPMENT_UPDATED: 'הציוד עודכן בהצלחה',
      EQUIPMENT_TRANSFERRED: 'הציוד הועבר בהצלחה',
      TRANSFER_SUCCESS: 'העברת הציוד הושלמה בהצלחה',
      INITIAL_SIGN_IN: 'קבלה ראשונית של הציוד',
      
      // Equipment Types and Collections
      EQUIPMENT_TYPES_TITLE: 'סוגי ציוד',
      EQUIPMENT_ITEMS_TITLE: 'פריטי ציוד',
      CREATE_EQUIPMENT_TYPE: 'צור סוג ציוד חדש',
      MANAGE_EQUIPMENT_TYPES: 'ניהול סוגי ציוד',
      EQUIPMENT_CATALOG: 'קטלוג ציוד',
      
      // Database Operations
      LOADING_EQUIPMENT_TYPES: 'טוען סוגי ציוד...',
      SEEDING_EQUIPMENT_TYPES: 'מאתחל סוגי ציוד במערכת...',
      SEED_COMPLETE: 'אתחול הושלם בהצלחה',
      
      // Validation Messages
      INVALID_SERIAL_NUMBER: 'מספר סידורי לא תקין',
      SERIAL_NUMBER_REQUIRED: 'מספר סידורי חובה',
      EQUIPMENT_TYPE_REQUIRED: 'סוג ציוד חובה',
      HOLDER_REQUIRED: 'מחזיק חובה',
      UNIT_REQUIRED: 'יחידה חובה',
      LOCATION_REQUIRED: 'מיקום חובה',
      
      // Daily Status Check
      REQUIRES_DAILY_CHECK: 'נדרש דיווח יומי',
      DAILY_STATUS_CHECK: 'דיווח יומי',
      REQUIRES_DAILY_STATUS_CHECK: 'דרוש דיווח יומי',
      DAILY_STATUS_TOGGLE_LABEL: 'דרוש דיווח יומי',
      
      // Template Form
      TEMPLATE_FORM: {
        TITLE: 'יצירת תבנית ציוד חדשה',
        BASIC_INFO: 'מידע בסיסי',
        CATEGORIES: 'קטגוריות',
        DEFAULT_VALUES: 'ערכי ברירת מחדל',
        
        // Fields
        NAME: 'שם התבנית',
        NAME_PLACEHOLDER: 'לדוגמה: רובה M4A1',
        NAME_REQUIRED: 'שם התבנית חובה',
        
        DESCRIPTION: 'תיאור',
        DESCRIPTION_PLACEHOLDER: 'תיאור מפורט של הציוד',
        
        PRODUCT_NAME: 'שם המוצר',
        PRODUCT_NAME_PLACEHOLDER: 'שם המוצר כפי שיופיע במערכת',
        PRODUCT_NAME_REQUIRED: 'שם המוצר חובה',
        
        ID_PREFIX: 'קידומת מזהה',
        ID_PREFIX_REQUIRED: 'קידומת מזהה חובה',
        ID_PREFIX_INVALID: 'קידומת מזהה חייבת להכיל 2-6 תווים באנגלית ומספרים בלבד',
        
        CATEGORY: 'קטגוריה',
        CATEGORY_REQUIRED: 'קטגוריה חובה',
        SELECT_CATEGORY: 'בחר קטגוריה',
        
        SUBCATEGORY: 'תת-קטגוריה',
        SUBCATEGORY_REQUIRED: 'תת-קטגוריה חובה',
        SELECT_SUBCATEGORY: 'בחר תת-קטגוריה',
        
        LOCATION: 'מיקום ברירת מחדל',
        LOCATION_PLACEHOLDER: 'מיקום אחסון ברירת מחדל',
        
        COMMON_NOTES: 'הערות כלליות',
        COMMON_NOTES_PLACEHOLDER: 'הערות שיופיעו כברירת מחדל',
        
        DEFAULT_STATUS: 'סטטוס ברירת מחדל',
        DEFAULT_CONDITION: 'מצב ברירת מחדל',
        
        REQUIRES_DAILY_CHECK: 'דרוש דיווח יומי',
        
        // Actions
        CREATE_TEMPLATE: 'צור תבנית',
        REFRESH: 'רענן',
        
        // Categories Management
        ADD_NEW_CATEGORY: 'הוסף קטגוריה חדשה',
        ADD_NEW_SUBCATEGORY: 'הוסף תת-קטגוריה חדשה',
        ENTER_CATEGORY_NAME: 'הזן שם קטגוריה חדשה:',
        ENTER_SUBCATEGORY_NAME: 'הזן שם תת-קטגוריה חדשה:',
        CATEGORY_NAME_PLACEHOLDER: 'שם הקטגוריה',
        SUBCATEGORY_NAME_PLACEHOLDER: 'שם התת-קטגוריה',
        ADD: 'הוסף',
        
        // Success Messages
        TEMPLATE_CREATED: 'התבנית נוצרה בהצלחה',
        CATEGORY_CREATED: 'הקטגוריה נוצרה בהצלחה',
        SUBCATEGORY_CREATED: 'התת-קטגוריה נוצרה בהצלחה'
      }
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
    CONNECTION_ERROR: 'שגיאת חיבור',
    UNEXPECTED_ERROR: 'אירעה שגיאה לא צפויה'
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
    // Page Headers
    PAGE_TITLE: 'ניהול מערכת',
    PAGE_SUBTITLE: 'כלי ניהול מתקדמים לסיירת גבעתי',
    PAGE_SUBTITLE_LIMITED: 'גישה מוגבלת',
    
    // Welcome Messages
    WELCOME_GREETING: 'שלום',
    DEFAULT_MANAGER: 'מנהל',
    ROLE_LABEL: 'תפקיד',
    ROLE_NOT_IDENTIFIED: 'לא זוהה',
    WELCOME_MESSAGE: 'ברוך הבא למרכז הניהול של מערכת סיירת גבעתי. כאן תוכל לנהל משתמשים, הרשאות וביצועים מתקדמים.',
    
    // Tab Labels
    TABS: {
      USERS: 'ניהול משתמשים',
      PERMISSIONS: 'הרשאות',
      TEMPLATE_MANAGEMENT: 'ניהול תבניות ציוד',
      EQUIPMENT_CREATION: 'יצירת ציוד חדש',
      ENFORCE_TRANSFER: 'העברת ציוד כפויה',
      SYSTEM_CONFIG: 'הגדרות מערכת',
      DATA_MANAGEMENT: 'ניהול נתונים',
      AUDIT_LOGS: 'יומני ביקורת',
      SEND_EMAIL: 'שליחת אימייל'
    },
    
    // Tab Descriptions
    TAB_DESCRIPTIONS: {
      USERS: 'ניהול משתמשים, הרשאות ותפקידים',
      PERMISSIONS: 'ניהול הרשאות מערכת ובקרת גישה',
      TEMPLATE_MANAGEMENT: 'יצירה ועריכה של תבניות ציוד, ניהול קטגוריות ותת-קטגוריות',
      EQUIPMENT_CREATION: 'הוספת ציוד חדש למערכת מתבניות או באופן ידני',
      ENFORCE_TRANSFER: 'ביצוע העברות ציוד בחירום וכפייה',
      SYSTEM_CONFIG: 'הגדרות כלליות ותצורת מערכת',
      DATA_MANAGEMENT: 'גיבוי, שחזור ואחזקת נתונים',
      AUDIT_LOGS: 'מעקב פעילות ויומני מערכת',
      SEND_EMAIL: 'שליחת הודעות אימייל לקבוצות משתמשים או משתמשים ספציפיים'
    },
    
    // Access Denied
    ACCESS_DENIED: {
      TITLE: 'אין הרשאה לגישה',
      MESSAGE: 'דף זה מיועד למשתמשים עם הרשאות ניהול בלבד (קצין, מפקד או מנהל מערכת).',
      CURRENT_ROLE: 'התפקיד הנוכחי שלך:',
      CONTACT_ADMIN: 'לקבלת הרשאות נוספות, אנא פנה למנהל המערכת.'
    },
    
    // Email Component
    EMAIL: {
      // Recipients Section
      RECIPIENTS_TITLE: 'בחירת נמענים',
      ALL_USERS: 'כל המשתמשים במערכת',
      BY_ROLE: 'לפי תפקיד',
      SPECIFIC_USERS: 'משתמשים ספציפיים (בפיתוח)',
      
      // Role Options
      ROLE_SOLDIERS: 'חיילים',
      ROLE_OFFICERS: 'קצינים',
      ROLE_COMMANDERS: 'מפקדים',
      ROLE_EQUIPMENT_MANAGERS: 'מנהלי ציוד',
      ROLE_ADMINS: 'מנהלי מערכת',
      
      // Message Content
      MESSAGE_CONTENT_TITLE: 'תוכן ההודעה',
      URGENT_MESSAGE: 'הודעה דחופה (עדיפות גבוהה)',
      SUBJECT_LABEL: 'נושא ההודעה',
      SUBJECT_PLACEHOLDER: 'הכנס נושא להודעה...',
      MESSAGE_LABEL: 'תוכן ההודעה',
      MESSAGE_PLACEHOLDER: 'כתוב את תוכן ההודעה כאן...',
      
      // Preview & Send
      PREVIEW_TITLE: 'תצוגה מקדימה ושליחה',
      RECIPIENTS_PREVIEW: 'נמענים:',
      ALL_USERS_PREVIEW: 'כל המשתמשים',
      SELECTED_ROLES_PREVIEW: 'תפקידים נבחרים:',
      SPECIFIC_USERS_PREVIEW: 'משתמשים ספציפיים',
      SUBJECT_PREVIEW: 'נושא:',
      NO_SUBJECT: '(ללא נושא)',
      URGENT_INDICATOR: ' - דחוף!',
      MESSAGE_PREVIEW: 'הודעה:',
      NO_CONTENT: '(ללא תוכן)',
      DEMO_WARNING: '⚠️ זהו ממשק הדמייה בלבד. לא יישלחו אימיילים אמיתיים.',
      SEND_BUTTON: 'שלח הודעה',
      SEND_SUCCESS: 'הודעת האימייל נשלחה בהצלחה! (זהו הדמייה בלבד)'
    },
    
    // User Management
    USERS: {
      // Table Headers
      USER_COLUMN: 'משתמש',
      ROLE_COLUMN: 'תפקיד',
      RANK_COLUMN: 'דרגה',
      TEAM_COLUMN: 'צוות',
      STATUS_COLUMN: 'סטטוס',
      ACTIONS_COLUMN: 'פעולות',
      
      // Filters
      SEARCH_PLACEHOLDER: 'חפש לפי שם או אימייל...',
      ALL_ROLES: 'כל התפקידים',
      ALL_STATUSES: 'כל הסטטוסים',
      
      // Status Labels
      STATUS_ACTIVE: 'פעיל',
      STATUS_INACTIVE: 'לא פעיל',
      STATUS_TRANSFERRED: 'הועבר',
      STATUS_DISCHARGED: 'שוחרר',
      
      // Role Labels
      ROLE_ADMIN: 'מנהל מערכת',
      ROLE_MANAGER: 'מנהל',
      ROLE_USER: 'משתמש',
      ROLE_TEAM_LEADER: 'מפקד צוות',
      ROLE_SQUAD_LEADER: 'מפקד כיתה',
      ROLE_SERGEANT: 'סמל',
      ROLE_OFFICER: 'קצין',
      ROLE_COMMANDER: 'מפקד',
      ROLE_EQUIPMENT_MANAGER: 'מנהל ציוד',
      
      // Actions
      EDIT_ACTION: 'ערוך',
      DELETE_ACTION: 'מחק',
      ADD_USER_BUTTON: '+ הוסף משתמש חדש',
      REFRESH_BUTTON: 'רענן',
      
      // Statistics
      TOTAL_USERS: 'סך המשתמשים',
      ACTIVE_USERS: 'פעילים',
      INACTIVE_USERS: 'לא פעילים',
      TRANSFERRED_USERS: 'הועברו',
      
      // Loading & Error States
      LOADING_USERS: 'טוען משתמשים...',
      ERROR_LOADING_TITLE: 'שגיאה בטעינת המשתמשים',
      TRY_AGAIN_BUTTON: 'נסה שוב',
      NO_USERS_FOUND: 'לא נמצאו משתמשים התואמים לחיפוש',
      NO_USERS_SYSTEM: 'אין משתמשים במערכת',
      
      // Results
      SHOWING_RESULTS: (filtered: number, total: number) => `מציג ${filtered} מתוך ${total} משתמשים`
    },

    // Development Placeholders
    DEVELOPMENT: {
      IN_DEVELOPMENT: 'בפיתוח',
      FEATURE_COMING_SOON: 'תכונה זו נמצאת כרגע בפיתוח ותהיה זמינה בקרוב.'
    },
    
    // Footer
    FOOTER_TEXT: 'מערכת ניהול סיירת גבעתי • גרסה 1.0 • פותח ע"י מתן טל'
  },

  // Confirmation Dialogs & Alerts
  CONFIRMATIONS: {
    // Admin Confirmations
    LOGOUT_TITLE: 'אישור יציאה',
    LOGOUT_MESSAGE: 'האם אתה בטוח שברצונך להתנתק?',
    LOGOUT_CONFIRM: 'התנתק',
    LOGOUT_CANCEL: 'ביטול',
    
    // Status Page Operations
    NO_NEW_SOLDIERS_TITLE: 'אין עדכונים חדשים',
    NO_NEW_SOLDIERS_MESSAGE: 'אין חיילים חדשים לעדכון בשרת',
    
    SERVER_UPDATE_SUCCESS_TITLE: 'עדכון הושלם',
    SERVER_UPDATE_SUCCESS_MESSAGE: 'הנתונים עודכנו בהצלחה בשרת!',
    
    SERVER_UPDATE_ERROR_TITLE: 'שגיאה בעדכון',
    SERVER_UPDATE_ERROR_MESSAGE: 'שגיאה בעדכון השרת',
    
    NO_CHANGES_TITLE: 'אין שינויים',
    NO_CHANGES_MESSAGE: 'אין שינויים לעדכון',
    
    CHANGES_UPDATED_TITLE: 'עדכון הושלם',
    CHANGES_UPDATED_MESSAGE: (count: number) => `עודכנו ${count} רשומות בהצלחה!`,
    
    CHANGES_ERROR_TITLE: 'שגיאה בעדכון',
    CHANGES_ERROR_MESSAGE: 'שגיאה בעדכון השינויים',
    
    NO_SOLDIERS_SELECTED_TITLE: 'לא נבחרו חיילים',
    NO_SOLDIERS_SELECTED_MESSAGE: 'לא נבחרו חיילים לדוח',
    
    REPORT_ERROR_TITLE: 'שגיאה ביצירת דוח',
    REPORT_ERROR_MESSAGE: 'שגיאה ביצירת הדוח. אנא נסה שוב.',
    
    COPY_SUCCESS_TITLE: 'הועתק בהצלחה',
    COPY_SUCCESS_MESSAGE: 'הדוח הועתק ללוח',
    
    COPY_ERROR_TITLE: 'שגיאה בהעתקה',
    COPY_ERROR_MESSAGE: 'שגיאה בהעתקה. אנא העתק ידנית.',
    
    WHATSAPP_NOT_SUPPORTED_TITLE: 'תכונה לא נתמכת',
    WHATSAPP_NOT_SUPPORTED_MESSAGE: 'פונקציית הודעת WhatsApp עדיין לא תמיכה בדפדפן זה. אנא נסה בדפדפן אחר.',
    
    // Management Page
    EMAIL_SEND_SUCCESS_TITLE: 'אימייל נשלח',
    EMAIL_SEND_SUCCESS_MESSAGE: 'האימייל נשלח בהצלחה',
    
    // AuthButton
    NOTIFICATIONS_COMING_SOON_TITLE: 'תכונה בפיתוח',
    NOTIFICATIONS_COMING_SOON_MESSAGE: 'התראות העברת ציוד - תכונה זו תהיה זמינה בקרוב',
    
    // Admin Personnel Data Refresh
    PERSONNEL_DATA_CACHED_TITLE: 'נתונים מוכנים',
    PERSONNEL_DATA_CACHED_MESSAGE: 'הנתונים נטענו מהמטמון המקומי',
    PERSONNEL_DATA_REFRESHED_TITLE: 'נתונים עודכנו',
    PERSONNEL_DATA_REFRESHED_MESSAGE: 'רשימת הכוח אדם עודכנה מהמאגר',
    PERSONNEL_CACHE_EXPIRED_TITLE: 'נתונים עודכנו',
    PERSONNEL_CACHE_EXPIRED_MESSAGE: 'המטמון פג תוקף - הנתונים נטענו מחדש',
    
    // Common buttons
    OK: 'אישור',
    CANCEL: 'ביטול',
    CLOSE: 'סגור'
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

export const TEXT_FMT = {
  GREETING: (name: string) => `שלום, ${name}!`,
  ITEMS_COUNT: (n: number) => `יש ${n} פריטים`,
  HOURS_AGO: (hours: number) => `לפני ${hours} שעות`,
  DAYS_AGO: (days: number) => `לפני ${days} ימים`,
  SIGNED_BY: (name: string) => `על ידי ${name}`,
  SHOWING_RESULTS: (count: number, total: number) => `מציג ${count} מתוך ${total} פריטי ציוד`,
};

// Export individual sections for easier imports
export const { BUTTONS, AUTH, FEATURES, ADMIN, ERRORS, SUCCESS, MANAGEMENT, CONFIRMATIONS, ARIA_LABELS } = TEXT_CONSTANTS; 