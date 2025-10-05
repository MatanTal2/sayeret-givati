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
      STATUS_SECURITY: 'בביטחונית',
      STATUS_REPAIR: 'בתיקון',
      STATUS_LOST: 'אבוד',
      STATUS_PENDING_TRANSFER: 'בהעברה',
      
      // Condition Text
      CONDITION_GOOD: 'טוב',
      CONDITION_NEEDS_REPAIR: 'דרוש תיקון',
      CONDITION_WORN: 'בלאי',
      
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
      RESTRICTED_ACCESS: 'גישה מוגבלת',
      CREDIT_EQUIPMENT: 'זיכוי',
      
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
      
      // Update Mode
      UPDATE: {
        TITLE: 'עדכון ציוד',
        SUBTITLE: 'עדכן פרטי ציוד קיים במערכת',
        SUBMIT_BUTTON: 'עדכן ציוד',
        SUCCESS_MESSAGE: 'הציוד עודכן בהצלחה',
        ERROR_MESSAGE: 'שגיאה בעדכון הציוד',
        READONLY_FIELD: 'שדה לקריאה בלבד',
        EDITABLE_FIELDS_NOTE: 'ניתן לערוך רק: סטטוס, מצב, מיקום והערות',
        UPDATING: 'מעדכן...',
        CREATE_SUBTITLE: 'הוסף פריט ציוד חדש למערכת',
        CREATE_SUBMIT: 'הוסף ציוד',
        CREATE_ERROR: 'שגיאה ביצירת הציוד. נסה שוב.',
        CANCEL: 'ביטול',
        SYSTEM_USER: 'מערכת',
      },
      
      // Form Labels
      FORM_LABELS: {
        STATUS: 'סטטוס',
        CONDITION: 'מצב',
      },
      
      // Status Options
      STATUS_OPTIONS: {
        AVAILABLE: 'זמין',
        SECURITY: 'בביטחונית',
        REPAIR: 'בתיקון',
        LOST: 'אבוד',
        PENDING_TRANSFER: 'בהעברה',
      },
      
      // Condition Options
      CONDITION_OPTIONS: {
        GOOD: 'טוב',
        NEEDS_REPAIR: 'דרוש תיקון',
        WORN: 'בלאי',
      },
      
      // Validation Messages
      VALIDATION: {
        SERIAL_REQUIRED: 'מספר סידורי הוא שדה חובה',
        PRODUCT_NAME_REQUIRED: 'שם המוצר הוא שדה חובה',
        CURRENT_HOLDER_REQUIRED: 'מחזיק נוכחי הוא שדה חובה',
        LOCATION_REQUIRED: 'מיקום הוא שדה חובה',
      },
      
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
      
      // Transfer System
      TRANSFER: {
        TITLE: 'העברת ציוד',
        REQUEST_TITLE: 'בקשת העברת ציוד',
        APPROVE_TITLE: 'אישור העברת ציוד',
        REJECT_TITLE: 'דחיית העברת ציוד',
        
        // Form Labels
        TO_USER: 'העבר אל',
        TO_USER_PLACEHOLDER: 'חפש משתמש...',
        REASON: 'סיבת ההעברה',
        REASON_PLACEHOLDER: 'הזן סיבת ההעברה',
        NOTE: 'הערות נוספות',
        NOTE_PLACEHOLDER: 'הערות אופציונליות',
        
        // Buttons
        SUBMIT_REQUEST: 'שלח בקשת העברה',
        APPROVE: 'אשר העברה',
        REJECT: 'דחה העברה',
        CANCEL: 'ביטול',
        
        // Status Messages
        REQUEST_CREATED: 'בקשת ההעברה נשלחה בהצלחה',
        REQUEST_APPROVED: 'ההעברה אושרה בהצלחה',
        REQUEST_REJECTED: 'ההעברה נדחתה',
        
        // Validation
        TO_USER_REQUIRED: 'יש לבחור משתמש יעד',
        REASON_REQUIRED: 'יש להזין סיבת העברה',
        CANNOT_TRANSFER_TO_SELF: 'לא ניתן להעביר ציוד לעצמך',
        
        // Status Labels
        STATUS_PENDING: 'ממתין לאישור',
        STATUS_APPROVED: 'אושר',
        STATUS_REJECTED: 'נדחה',
        
        // History
        HISTORY_TITLE: 'היסטוריית העברות',
        NO_TRANSFERS: 'אין העברות עבור ציוד זה',
        
        // Notifications
        NEW_REQUEST_NOTIFICATION: 'בקשת העברת ציוד חדשה',
        REQUEST_APPROVED_NOTIFICATION: 'בקשת ההעברה שלך אושרה',
        REQUEST_REJECTED_NOTIFICATION: 'בקשת ההעברה שלך נדחתה'
      },
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

  // Status Page
  STATUS_PAGE: {
    // Page Elements
    LOADING_DATA: 'טוען נתונים...',
    UNIT_NAME: 'סיירת גבעתי',
    BACK_TO_HOME: 'חזרה לעמוד הבית',
    BACK_TO_HOME_SHORT: '← חזרה לעמוד הבית',
    ERROR_LOADING_DATA: 'שגיאה בטעינת הנתונים',
    
    // Buttons and Actions
    REFRESH_SHORT: 'רענן...',
    REFRESH_DATA: '↻ רענן נתונים',
    UPDATE_SHORT: 'עדכן...',
    UPDATE_DATA: 'עדכן נתונים',
    ADD_NEW: 'הוסף חדש',
    ADD_NEW_SOLDIER: 'הוסף חייל חדש',
    
    // Form Labels and Placeholders
    SEARCH_BY_NAME: 'חיפוש לפי שם...',
    FULL_NAME: 'שם מלא',
    PERSONAL_NUMBER: 'מספר אישי',
    CUSTOM_STATUS_PLACEHOLDER: 'הכנס סטטוס מותאם',
    ADDITIONAL_NOTES: 'הערות נוספות (אופציונלי)',
    PASSWORD_PLACEHOLDER: 'סיסמה',
    NOTES_PLACEHOLDER: 'הערות...',
    CUSTOM_STATUS_INPUT: 'סטטוס מותאם...',
    
    // Status Options
    STATUS_HOME: 'בית',
    STATUS_GUARD: 'משמר', 
    STATUS_OTHER: 'אחר',
    
    // Team Selection
    SELECT_TEAM: 'בחר צוות',
    TEAM_LABEL: 'צוות:',
    STATUS_LABEL: 'סטטוס:',
    ALL: 'הכל',
    
    // Table Headers
    SELECTION: 'בחירה',
    NAME: 'שם',
    TEAM: 'צוות',
    STATUS: 'סטטוס',
    NOTES: 'הערות',
    
    // Report Features
    REPORT_PREVIEW_TITLE: 'תצוגה מקדימה של הדוח',
    SEND_TO_WHATSAPP: 'שלח ל-WhatsApp',
    DOWNLOAD_REPORT: 'הורד דוח',
    
    // Alert Messages
    NO_NEW_SOLDIERS_SERVER: 'אין חיילים חדשים לעדכון בשרת',
    DATA_UPDATED_SUCCESS: 'הנתונים עודכנו בהצלחה בשרת!',
    NO_CHANGES_TO_UPDATE: 'אין שינויים לעדכון',
    NO_SOLDIERS_SELECTED: 'לא נבחרו חיילים לדוח',
    REPORT_CREATION_ERROR: 'שגיאה ביצירת הדוח. אנא נסה שוב.',
    REPORT_COPIED: 'הדוח הועתק ללוח',
    COPY_ERROR: 'שגיאה בהעתקה. אנא העתק ידנית.',
    WHATSAPP_NOT_SUPPORTED: 'פונקציית הודעת WhatsApp עדיין לא תמיכה בדפדפן זה. אנא נסה בדפדפן אחר.',
    WRONG_PASSWORD: 'סיסמה שגויה',
    
    // Update Messages
    UPDATE_SERVER_BUTTON: (count: number) => count > 0 ? `עדכן בשרת (${count})` : 'עדכן בשרת',
    UPDATE_DATA_BUTTON: (count: number) => count > 0 ? `עדכן נתונים (${count})` : 'עדכן נתונים',
    NO_CHANGES_TOOLTIP: 'אין שינויים לעדכון',
    UPDATE_CHANGES_TOOLTIP: (count: number) => `עדכן ${count} שינויים`,
    UPDATE_NEW_SOLDIERS_TOOLTIP: (count: number) => count > 0 ? `עדכן ${count} חיילים חדשים בשרת` : 'אין חיילים חדשים לעדכון'
  },

  // Test Dashboard
  TEST_DASHBOARD: {
    PAGE_TITLE: '🧪 מרכז בדיקות מערכת',
    PAGE_SUBTITLE: 'ממשק מאוחד לכל בדיקות המערכת',
    ACTIVITY_LOG: 'יומן פעילות',
    ACTIVITY_SUBTITLE: 'תוצאות בדיקות בזמן אמת',
    NO_ACTIVITY: 'אין פעילות עדיין',
    RUN_ALL_TESTS: 'הרץ כל הבדיקות',
    RUNNING_ALL_TESTS: 'מריץ כל הבדיקות...',
    
    // Test Status
    STATUS_RUNNING: 'רץ',
    STATUS_PASSED: 'עבר',
    STATUS_FAILED: 'נכשל',
    STATUS_WAITING: 'ממתין',
    
    // Test Data
    WEAPON_CATEGORY: 'נשק אישי',
    TEST_RIFLE_NAME: 'רובה M4A1 - בדיקה'
  },

  // Equipment Page
  EQUIPMENT_PAGE: {
    DEV_TOOLS_TITLE: '🧪 כלי פיתוח',
    DEVELOPMENT_STATUS: 'Development Status:',
    
    // Add Equipment Modal
    EXAMPLE_RIFLE: 'לדוגמה: רובה M4A1',
    SELECT_CATEGORY: 'בחר קטגוריה',
    SEARCH_OR_TYPE_NAME: 'חפש או הקלד שם',
    EXAMPLE_HOLDER: 'לדוגמה: רב״ט דוד כהן',
    SEARCH_OR_TYPE_UNIT: 'חפש או הקלד יחידה',
    EXAMPLE_UNIT: 'לדוגמה: פלוגה א\'',
    EXAMPLE_LOCATION: 'לדוגמה: מחסן נשק - בסיס (אופציונלי)',
    ADDITIONAL_NOTES: 'הערות נוספות על הציוד...',
    
    // Search Placeholders
    SEARCH_BY_SERIAL: 'חיפוש לפי מספר סידורי...',
    SEARCH_BY_PRODUCT: 'חיפוש לפי שם מוצר...',
    CURRENT_HOLDER_FILTER: 'מחזיק נוכחי...',
    EQUIPMENT_TYPE_FILTER: 'סוג ציוד...',
    CATEGORY_FILTER: 'קטגוריה...',
    SUBCATEGORY_FILTER: 'תת-קטגוריה...',
    ADVANCED_SERIAL_FILTER: 'מספר סידורי מתקדם...'
  },

  // Settings Page
  SETTINGS_PAGE: {
    NOTIFICATIONS_FUTURE: 'התראות יופעלו בעדכון עתידי'
  },

  // Management Page
  MANAGEMENT_PAGE: {
    LOADING: 'טוען...'
  },

  // Profile Page
  PROFILE_PAGE: {
    DATE_NOT_AVAILABLE: 'תאריך לא זמין'
  },

  // Admin Components
  ADMIN_COMPONENTS: {
    // Admin Login
    EMAIL_PLACEHOLDER: 'Email',
    ADMIN_PASSWORD_PLACEHOLDER: 'Enter admin password',
    
    // Personnel Management
    SEARCH_BY_NAME_PHONE: 'חיפוש לפי שם או טלפון',
    FIRST_NAME_PLACEHOLDER: 'שם פרטי',
    LAST_NAME_PLACEHOLDER: 'שם משפחה',
    PHONE_NUMBER_PLACEHOLDER: 'מספר טלפון',
    PERSONAL_ID_PLACEHOLDER: 'מספר אישי',
    PHONE_PLACEHOLDER_ADMIN: 'מספר פלאפון',
    
    // System Stats
    REFRESH_NOW: 'רענן עכשיו',
    REFRESHING: 'מרענן...',
    UPDATE_PERSONNEL_TOOLTIP: 'עדכן רשימת כוח אדם מהמאגר',
    
    // Bulk Upload Sample
    BULK_UPLOAD_SAMPLE: `1234567,"מתן","טל","רס״ל","0501234567","user"
2345678,"אברהם","כהן","סמל","0527654321","team_leader"
3456789,"דוד","לוי","רב״ט","0546789012","manager"`,
    
    // View Personnel
    CONFIRM_DELETION_TITLE: 'Confirm Deletion'
  },

  // Registration Components
  REGISTRATION_COMPONENTS: {
    BACK_TO_LOGIN: 'חזרה להתחברות',
    ENTER_FIRST_NAME: 'הזן שם פרטי',
    ENTER_LAST_NAME: 'הזן שם משפחה',
    
    // Registration Form
    CONNECTION_ERROR: 'שגיאת חיבור. אנא בדוק את החיבור לאינטרנט ונסה שוב.',
    EMAIL_ALREADY_REGISTERED: 'כתובת האימייל כבר רשומה במערכת. אנא השתמש בעמוד ההתחברות או אפס את הסיסמה.',
    SENDING_CODE: 'שולח קוד...',
    VERIFYING: 'מאמת...'
  },

  // Profile Components  
  PROFILE_COMPONENTS: {
    // Profile Image Upload
    INVALID_FILE_ERROR: 'אנא בחר קובץ תמונה חוקי',
    FILE_SIZE_ERROR: 'גודל הקובץ חייב להיות קטן מ-5MB',
    UPLOAD_ERROR: 'שגיאה בהעלאת התמונה',
    SERVER_UPLOAD_ERROR: 'שגיאה בהעלאת התמונה לשרת',
    UPLOAD_IMAGE_TITLE: 'העלה תמונה',
    PROFILE_ALT: 'Profile',
    
    // Phone Number Update
    INVALID_PHONE_ERROR: 'מספר טלפון לא חוקי. אנא הזן מספר ישראלי תקין',
    OTP_SEND_ERROR: 'שגיאה בשליחת קוד אימות',
    INVALID_OTP_LENGTH: 'אנא הזן קוד אימות בן 6 ספרות',
    INVALID_OTP_ERROR: 'קוד אימות שגוי',
    SMS_SEND_ERROR: 'שגיאה בשליחת SMS',
    INVALID_OTP_SERVER_ERROR: 'קוד אימות שגוי',
    SEND_CODE: 'שלח קוד',
    SEND_CODE_AGAIN: 'שלח קוד שוב',
    PHONE_PLACEHOLDER: '05X-XXX-XXXX',
    OTP_PLACEHOLDER: '000000'
  },

  // Management Components
  MANAGEMENT_COMPONENTS: {
    // Template Management
    SEARCH_TEMPLATES: 'חפש תבניות...',
    
    // Enforce Transfer
    TRANSFER_REASON_PLACEHOLDER: 'הסבר מפורט לסיבת ההעברה הכפויה...',
    
    // Email Tab
    MESSAGE_SUBJECT_PLACEHOLDER: 'נושא ההודעה...',
    MESSAGE_CONTENT_PLACEHOLDER: 'תוכן ההודעה...',
    MESSAGE_SENT_SUCCESS_TITLE: 'הודעה נשלחה בהצלחה!',
    SEND_MESSAGE_BUTTON: '📧 שלח הודעה',
    CLEAR_FORM: 'נקה טופס',
    
    // Custom User Selection
    TYPE_TO_SEARCH: 'הקלד כדי לחפש...'
  },

  // Equipment Components
  EQUIPMENT_COMPONENTS: {
    // Template Form
    TEMPLATE_EXAMPLE_PREFIX: 'M4, RAD, etc.'
  },

  // Form Validation Messages
  FORM_VALIDATION: {
    // Status Page Validation
    SOLDIER_NAME_REQUIRED: 'שם החייל חובה',
    NAME_HEBREW_ONLY: 'השם חייב להכיל רק אותיות עבריות',
    PERSONAL_ID_REQUIRED: 'מספר אישי חובה',
    PERSONAL_ID_FORMAT: 'מספר אישי חייב להכיל בין 5-7 ספרות ורק ספרות',
    PERSONAL_ID_EXISTS: 'מספר אישי זה כבר קיים במערכת',
    TEAM_SELECTION_REQUIRED: 'בחירת צוות חובה',
    
    // Data Validation
    INVALID_DATA_RECEIVED: 'המידע שהתקבל אינו תקין',
    INSUFFICIENT_DATA: 'אין מספיק נתונים בגיליון',
    UNEXPECTED_LOADING_ERROR: 'שגיאה לא צפויה בטעינת הנתונים. אנא נסה שוב מאוחר יותר.',
    SERVER_UPDATE_ERROR: 'שגיאה בעדכון השרת',
    DATA_UPDATE_ERROR: 'שגיאה בעדכון הנתונים'
  },

  // Default Values and Fallbacks
  DEFAULTS: {
    DEFAULT_TEAM: 'מסייעת',
    DEFAULT_STATUS: 'בית',
    SYSTEM_MANAGER_SIGNATURE: 'מנהל-מערכת',
    
    // Test User Data
    TEST_RANK: 'רב סמל',
    TEST_UNIT: 'שייטת גבעתי'
  },

  // Notifications System
  NOTIFICATIONS: {
    // Main UI
    TITLE: 'התראות',
    NO_NOTIFICATIONS: 'אין התראות חדשות',
    MARK_ALL_READ: 'סמן הכל כנקרא',
    MARK_AS_READ: 'סמן כנקרא',
    DELETE_NOTIFICATION: 'מחק התראה',
    REFRESH_NOTIFICATIONS: 'רענן התראות',
    
    // Notification Types
    TRANSFER_REQUEST: 'בקשת העברה חדשה',
    TRANSFER_APPROVED: 'בקשת העברה אושרה',
    TRANSFER_REJECTED: 'בקשת העברה נדחתה',
    TRANSFER_COMPLETED: 'העברת ציוד הושלמה',
    EQUIPMENT_UPDATE: 'עדכון ציוד',
    EQUIPMENT_STATUS_CHANGE: 'שינוי סטטוס ציוד',
    SYSTEM_MESSAGE: 'הודעת מערכת',
    MAINTENANCE_DUE: 'תחזוקה נדרשת',
    COMMANDER_MESSAGE: 'הודעה ממפקד',
    DAILY_CHECK_REMINDER: 'תזכורת בדיקה יומית',
    
    // Status Messages
    LOADING: 'טוען התראות...',
    ERROR_LOADING: 'שגיאה בטעינת התראות',
    MARKED_AS_READ: 'ההתראה סומנה כנקראה',
    ALL_MARKED_READ: 'כל ההתראות סומנו כנקראות',
    NOTIFICATION_DELETED: 'ההתראה נמחקה',
    
    // Time Display
    NOW: 'עכשיו',
    MINUTES_AGO: (minutes: number) => `לפני ${minutes} דקות`,
    HOURS_AGO: (hours: number) => `לפני ${hours} שעות`,
    DAYS_AGO: (days: number) => `לפני ${days} ימים`,
    
    // Badge
    UNREAD_COUNT: (count: number) => count > 99 ? '99+' : count.toString(),
    
    // Empty State
    EMPTY_TITLE: 'אין התראות',
    EMPTY_MESSAGE: 'כל ההתראות שלך יופיעו כאן',
    
    // Settings
    NOTIFICATION_SETTINGS: 'הגדרות התראות',
    EMAIL_NOTIFICATIONS: 'התראות אימייל',
    TRANSFER_ALERTS: 'התראות העברת ציוד',
    SYSTEM_ALERTS: 'התראות מערכת',
    MAINTENANCE_REMINDERS: 'תזכורות תחזוקה',
    DAILY_CHECK_REMINDERS: 'תזכורות בדיקה יומית',
    
    // Actions
    VIEW_EQUIPMENT: 'צפה בציוד',
    VIEW_TRANSFER: 'צפה בהעברה',
    DISMISS: 'התעלם',
    
    // Templates
    TEMPLATES: {
      TRANSFER_REQUEST: (fromUser: string, equipment: string) => 
        `${fromUser} העביר לך את הציוד ${equipment}`,
      TRANSFER_APPROVED: (toUser: string, equipment: string) => 
        `${toUser} אישר את העברת הציוד ${equipment}`,
      TRANSFER_REJECTED: (toUser: string, equipment: string) => 
        `${toUser} דחה את העברת הציוד ${equipment}`,
      TRANSFER_COMPLETED: (equipment: string) => 
        `העברת הציוד ${equipment} הושלמה בהצלחה`,
      EQUIPMENT_STATUS_CHANGED: (equipment: string, status: string) => 
        `סטטוס הציוד ${equipment} עודכן ל: ${status}`,
      MAINTENANCE_DUE: (equipment: string) => 
        `הציוד ${equipment} דורש תחזוקה`,
      DAILY_CHECK_REMINDER: (equipment: string) => 
        `נדרש לבצע בדיקה יומית עבור ${equipment}`
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
    EQUIPMENT_NOTIFICATIONS: 'התראות ציוד',
    BACK_TO_LOGIN: 'חזרה להתחברות',
    REGISTRATION_PROGRESS: 'Registration progress',
    CLOSE_MENU: 'סגור תפריט',
    OPEN_MANAGEMENT_MENU: 'פתח תפריט ניהול',
    BACK_TO_HOME: 'חזור לדף הבית',
    LOADING_STATUS: 'טוען...',
    NOTIFICATION_DROPDOWN: 'תפריט התראות',
    UNREAD_NOTIFICATIONS: 'התראות שלא נקראו',
    NOTIFICATION_BELL: 'פעמון התראות'
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
export const { BUTTONS, AUTH, FEATURES, ADMIN, ERRORS, SUCCESS, MANAGEMENT, CONFIRMATIONS, NOTIFICATIONS, ARIA_LABELS } = TEXT_CONSTANTS; 