# 📝 User Registration Specification

## מפרט הרשמת משתמשים - סיירת גבעתי

**תאריך יצירה:** ינואר 2025  
**סטטוס:** מפרט מלא 📋  
**גרסה:** 1.0

---

## 🎯 סקירה כללית

מערכת הרשמת משתמשים מאפשרת לחיילים מאושרים מראש להירשם למערכת באמצעות אימות מספר אישי ואימות טלפון דו-שלבי.

### עקרונות מנחים

- **🔐 אבטחה מקסימלית** - אימות מרובה שכבות
- **📱 נוחות שימוש** - תהליך פשוט וידידותי
- **📞 אימות טלפון** - MFA חובה לכל משתמש

---

## 📋 תהליך ההרשמה המלא

### שלב 1: מסך פתיחה, והכנסת מספר אישי

```ascii
┌─────────────────────────────────────┐
│          לוגו סיירת                │
│                                     │
│        ברוכים הבאים למערכת         │
│       מסייעת סיירת גבעתי           │
│                                     │
│  ┌─────────────────────────────┐     │
│  │      📝 הכנס מספר אישי    │     │
│  └─────────────────────────────┘     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

#### 1.1 ולידציות בזמן אמת

| שדה | ולידציה | הודעת שגיאה |
|-----|----------|-------------|
| מספר אישי | `^[0-9]{5,7}$` | "מספר אישי חייב להכיל 5-7 ספרות בלבד" |

#### 1.2 תהליך האימות

```ascii
┌─────────────────────────────────────┐
│         🔍 אימות מספר אישי         │
│                                     │
│  מאמת נגד רשימת מאושרים מראש...   │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    ⏳ מבצע בדיקה...         │   │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

#### 1.3 לוגיקת האימות

```typescript
// Server-side verification with collision handling
async function verifyMilitaryId(
  militaryId: string,
  salt: string
): Promise<AuthResult> {
  
  // 1. Hash the military ID
  const hashedId = await SecurityUtils.hashMilitaryId(militaryId);
  
  // 2. Check against authorized_personnel collection
  const authorized = await AdminFirestoreService
    .findAuthorizedPersonnel(hashedId,salt);
  
  if (!authorized) {
    return { 
      success: false, 
      error: "פרטים לא נמצאו ברשימת המאושרים" 
    };
  }
  
  if (userAreadyRegistered) {
    return {
      success: false, 
      error: "משתמש כבר רשום במערכת, יש לבצע התחברות למערכת" 
    };
  }

  return { 
    success: true, 
    authorizedData: authorized 
  };
}
```

#### 1.4 מצבי שגיאה אפשריים

| מצב | הודעה למשתמש | פעולה |
|-----|-------------|-------|
| מספר אישי לא נמצא | "מספר אישי זה לא נמצא ברשימת המאושרים" | חזרה לטופס |
| כבר רשום | "משתמש זה כבר רשום במערכת" | הפניה להתחברות |
| שגיאת שרת | "שגיאה זמנית במערכת, נסה שנית" | אפשרות חזרה |

### שלב 2: אימות טלפון (OTP)

#### 2.1 שליחת קוד אימות

```ascii
┌─────────────────────────────────────┐
│         📱 אימות מספר טלפון          │
│                                     │
│  שלחנו קוד אימות ל:                │
│  📞 0XX-XXX-XX67 ⭐                 │
│                                     │
│  ┌─┬─┬─┬─┬─┬─┐                      │
│  │ │ │ │ │ │ │  קוד 6 ספרות         │
│  └─┴─┴─┴─┴─┴─┘                      │
│                                     │
│  ⏱️ הקוד תקף למשך 5 דקות           │
│                                     │
│  שלח קוד חדש (זמין בעוד 60 שניות)   │
│                                     │
└─────────────────────────────────────┘
```

#### 2.2 הגדרות OTP

```typescript
const OTP_CONFIG = {
  LENGTH: 6,                    // אורך הקוד
  EXPIRY_MINUTES: 5,           // תוקף בדקות
  RESEND_COOLDOWN_SECONDS: 60, // זמן המתנה לשליחה חוזרת
  MAX_ATTEMPTS: 3,             // מספר ניסיונות מקסימלי
  MAX_DAILY_SENDS: 10          // מספר שליחות מקסימלי ביום
};
```

#### 2.3 ולידציית קוד

```typescript
async function verifyOTP(
  phoneNumber: string, 
  otpCode: string
): Promise<OTPResult> {
  
  // בדיקות ראשוניות
  if (!otpCode || otpCode.length !== 6) {
    return { success: false, error: "קוד חייב להכיל 6 ספרות" };
  }
  
  if (!/^\d{6}$/.test(otpCode)) {
    return { success: false, error: "קוד חייב להכיל ספרות בלבד" };
  }
  
  // אימות מול Firebase
  try {
    const result = await firebase.auth().signInWithCredential(
      firebase.auth.PhoneAuthProvider.credential(verificationId, otpCode)
    );
    
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: "קוד שגוי או פג תוקף" };
  }
}
```

### שלב 2: טופס הרשמה ראשוני

#### 2.1 שדות חובה

```typescript
interface RegistrationFormData {
  // פרטים אישיים קיימים ב DB
  firstName: string;           // שם פרטי (עברית בלבד)
  lastName: string;            // שם משפחה (עברית בלבד)
  militaryPersonalNumber: string; // מספר אישי (5-7 ספרות)
  
  // פרטי תקשורת - קיים ב DB
  phoneNumber: string;         // מספר טלפון (+972-XX-XXXXXXX)
  
  // פרטים צבאיים קיימים ב DB
  rank: MilitaryRank;          // דרגה מרשימה קבועה
  unit?: string;               // יחידה (אופציונלי)
}
```

```typescript
function isValidIsraeliMobile(phone) {
  // Remove spaces/hyphens
  const cleaned = phone.replace(/[\s-]/g, '');
  // Accept both +972 and 0 prefix
  return /^(?:\+972|0)5\d{8}$/.test(cleaned);
}
```

#### 2.2 רשימת דרגות

MILITARY_RANKS exist in code already

```typescript
const MILITARY_RANKS = [
  '...'
];
```

### שלב 5: יצירת פרופיל משתמש

#### 5.1 מבנה הנתונים הסופי

```typescript
interface UserProfile {
  // Firebase Auth
  uid: string;                 // User hash Id as Firebase documentId
  
  // פרטים אישיים
  firstName: string;
  lastName: string;
  
  // פרטים צבאיים
  rank: string;
  unit?: string;
  
  // אבטחה ותקשורת
  phoneNumber: string;        // מאומת
  phoneVerified: true;        // תמיד true אחרי הרשמה מוצלחת
  
  // מטא-דאטה
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  status: 'active';           // תמיד active אחרי הרשמה
  role: 'soldier';           // ברירת מחדל
  
  // הגדרות
  preferences: {
    language: 'he';
    notifications: true;
  };
}
```

#### 5.2 יצירת המשתמש

```typescript
async function createUserProfile(
  firebaseUser: User,
  registrationData: RegistrationFormData
): Promise<void> {
  
  const userProfile: UserProfile = {
    // The user's UID is the hash ID generated for the user and stored in authorized_personnel
    uid: firebaseUser.uid, // hash ID
    firstName: registrationData.firstName,
    lastName: registrationData.lastName,
    rank: registrationData.rank,
    unit: registrationData.unit,
    phoneNumber: firebaseUser.phoneNumber!,
    phoneVerified: true,
    createdAt: FieldValue.serverTimestamp(),
    lastLoginAt: FieldValue.serverTimestamp(),
    status: 'active',
    role: 'soldier',
    preferences: {
      language: 'he',
      notifications: true
    }
  };
  
  // שמירה ב-Firestore
  await db.collection('users').doc(firebaseUser.uid).set(userProfile);
  
  // עדכון ב-Firebase Auth
  await firebaseUser.updateProfile({
    displayName: userProfile.fullName
  });
}
```

---

## 🎨 UI/UX מפרטים

### עיצוב ומבנה

#### צבעים ובראנדינג

```css
:root {
  --primary-purple: #7C3AED;     /* סגול ראשי */
  --purple-hover: #6D28D9;       /* סגול כהה */
  --success-green: #10B981;      /* ירוק הצלחה */
  --error-red: #EF4444;          /* אדום שגיאה */
  --background: #F9FAFB;         /* רקע */
  --text-primary: #111827;       /* טקסט ראשי */
  --text-secondary: #6B7280;     /* טקסט משני */
}
```

#### רספונסיביות

- **Mobile-first design** - מתחיל ממובייל
- **Breakpoints:**
  - Mobile: `< 768px`
  - Tablet: `768px - 1024px`
  - Desktop: `> 1024px`

#### אנימציות ומעברים

```css
/* מעברים חלקים */
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* טעינה */
.loading-spinner {
  animation: spin 1s linear infinite;
}

/* הודעות */
.message-slide-in {
  animation: slideIn 0.3s ease-out;
}
```

### רכיבי UI ספציפיים

#### 1. Input Fields

```tsx
<div className="form-group">
  <label htmlFor="firstName" className="required">
    שם פרטי *
  </label>
  <input
    id="firstName"
    type="text"
    className="form-input rtl"
    placeholder="הקלד שם פרטי"
    maxLength={20}
    pattern="[\u0590-\u05FF\s]{2,20}"
    required
  />
  <div className="error-message" role="alert">
    {/* הודעת שגיאה */}
  </div>
</div>
```

#### 2. OTP Input

```tsx
<div className="otp-container">
  {[0, 1, 2, 3, 4, 5].map(index => (
    <input
      key={index}
      className="otp-digit"
      type="text"
      maxLength={1}
      pattern="\d"
      onInput={handleOTPInput}
    />
  ))}
</div>
```

#### 3. Progress Indicator

```tsx
<div className="progress-bar">
  <div className="step completed">
    <span>1</span> פרטים אישיים
  </div>
  <div className="step active">
    <span>2</span> אימות טלפון
  </div>
  <div className="step">
    <span>3</span> השלמת הרשמה
  </div>
</div>
```

---

## ⚠️ טיפול בשגיאות

### סוגי שגיאות וטיפול

#### 1. שגיאות ולידציה

```typescript
interface ValidationError {
  field: string;
  message: string;
  type: 'validation';
}

const VALIDATION_MESSAGES = {
  firstName: {
    required: "שם פרטי הוא שדה חובה",
    pattern: "השם חייב להכיל אותיות עבריות בלבד",
    minLength: "השם חייב להכיל לפחות 2 תווים",
    maxLength: "השם חייב להכיל עד 20 תווים"
  },
  militaryPersonalNumber: {
    required: "מספר אישי הוא שדה חובה",
    pattern: "מספר אישי חייב להכיל 7-8 ספרות בלבד",
    unauthorized: "מספר אישי זה לא מאושר במערכת"
  },
  phoneNumber: {
    required: "מספר טלפון הוא שדה חובה",
    pattern: "פורמט מספר הטלפון שגוי",
    duplicate: "מספר טלפון זה כבר רשום במערכת"
  }
};
```

#### 2. שגיאות רשת ושרת

```typescript
const NETWORK_ERRORS = {
  OFFLINE: {
    title: "אין חיבור לאינטרנט",
    message: "בדוק את החיבור שלך ונסה שנית",
    action: "נסה שנית"
  },
  SERVER_ERROR: {
    title: "שגיאה במערכת",
    message: "אירעה שגיאה זמנית, אנא נסה שנית",
    action: "חזור לדף הבית"
  },
  TIMEOUT: {
    title: "הפעולה ארכה יותר מדי",
    message: "בדוק את החיבור ונסה שנית",
    action: "נסה שנית"
  }
};
```

#### 3. Toast Messages

```tsx
interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // milliseconds
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// דוגמאות
const TOAST_EXAMPLES = {
  success: {
    type: 'success',
    title: "הרשמה הושלמה בהצלחה!",
    message: "ברוך הבא למערכת סיירת גבעתי",
    duration: 5000
  },
  error: {
    type: 'error',
    title: "שגיאה בהרשמה",
    message: "מספר אישי לא נמצא ברשימת המאושרים",
    actions: [{
      label: "צור קשר עם מנהל",
      action: () => openContactForm()
    }]
  }
};
```

---

## 🔐 אבטחה וביטחון

### הצפנה ואחסון

#### 1. הצפנת מספר אישי

```typescript
class SecurityUtils {
  static async hashMilitaryId(militaryId: string): Promise<{hash: string, salt: string}> {
    // יצירת salt אקראי
    const salt = crypto.randomBytes(32).toString('hex');
    
    // יצירת hash עם SHA-256
    const hash = crypto
      .createHash('sha256')
      .update(militaryId + salt)
      .digest('hex');
    
    return { hash, salt };
  }
  
  static async verifyMilitaryId(
    militaryId: string, 
    hash: string, 
    salt: string
  ): Promise<boolean> {
    const newHash = crypto
      .createHash('sha256')
      .update(militaryId + salt)
      .digest('hex');
    
    return newHash === hash;
  }
}
```

#### 2. אבטחת OTP

```typescript
const OTP_SECURITY = {
  // הגבלת ניסיונות
  MAX_ATTEMPTS: 3,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 דקות
  
  // הגבלת שליחות
  MAX_DAILY_SENDS: 10,
  SEND_COOLDOWN: 60 * 1000, // דקה
  
  // תוקף הקוד
  EXPIRY_TIME: 5 * 60 * 1000, // 5 דקות
  
  // אורך הקוד
  CODE_LENGTH: 6,
  NUMERIC_ONLY: true
};
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - only authenticated users can access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
      
      // Allow reading other users for UI (limited fields)
      allow read: if request.auth != null 
        && request.auth.uid != userId;
    }
    
    // Authorized personnel - server-side only
    match /authorized_personnel/{document} {
      allow read, write: if false; // No client access
    }
    
    // Admin operations - admin only
    match /admin_config/{document} {
      allow read, write: if request.auth != null 
        && request.auth.token.admin == true;
    }
  }
}
```

---

## 📱 רספונסיביות ונגישות

### Mobile-First Design

#### Breakpoints

```scss
$mobile: 320px;
$mobile-large: 480px;
$tablet: 768px;
$desktop: 1024px;
$desktop-large: 1440px;

// Media queries
@mixin mobile {
  @media (max-width: #{$tablet - 1px}) { @content; }
}

@mixin tablet {
  @media (min-width: #{$tablet}) and (max-width: #{$desktop - 1px}) { @content; }
}

@mixin desktop {
  @media (min-width: #{$desktop}) { @content; }
}
```

#### Touch-Friendly Design

```css
/* כפתורים גדולים יותר במובייל */
.btn {
  min-height: 48px; /* מינימום לגגע נוח */
  padding: 12px 24px;
  touch-action: manipulation; /* מונע זום כפול */
}

/* שדות קלט נוחים */
.form-input {
  min-height: 48px;
  font-size: 16px; /* מונע זום אוטומטי ב-iOS */
  padding: 12px 16px;
}

/* רווחים נוחים לגעה */
.form-group {
  margin-bottom: 24px;
}
```

### נגישות (A11y)

#### ARIA Labels

```tsx
// Form accessibility
<form role="form" aria-labelledby="registration-title">
  <h1 id="registration-title">הרשמה למערכת</h1>
  
  <div className="form-group">
    <label htmlFor="military-id" className="required">
      מספר אישי *
    </label>
    <input
      id="military-id"
      type="text"
      aria-required="true"
      aria-describedby="military-id-error"
      aria-invalid={hasError ? "true" : "false"}
    />
    <div 
      id="military-id-error" 
      role="alert" 
      aria-live="polite"
    >
      {errorMessage}
    </div>
  </div>
</form>
```

#### Keyboard Navigation

```typescript
// טיפול בניווט מקלדת
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
      if (e.currentTarget.tagName === 'BUTTON') {
        e.currentTarget.click();
      }
      break;
    case 'Escape':
      closeModal();
      break;
    case 'Tab':
      // ניווט טבעי - אין צורך בטיפול מיוחד
      break;
  }
};
```

#### Screen Reader Support

```tsx
// הודעות לקוראי מסך
<div 
  role="status" 
  aria-live="polite" 
  className="sr-only"
>
  {loadingMessage}
</div>

// Progress indicators
<div 
  role="progressbar" 
  aria-valuenow={currentStep} 
  aria-valuemin={1} 
  aria-valuemax={totalSteps}
  aria-label={`שלב ${currentStep} מתוך ${totalSteps}`}
>
  <div className="progress-fill" style={{width: `${progress}%`}} />
</div>
```

---

## 🚀 הטמעה טכנית

### רכיבי React

#### 1. Registration Wizard

```tsx
interface RegistrationWizardProps {
  onComplete: (userData: UserProfile) => void;
  onCancel: () => void;
}

const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    militaryPersonalNumber: '',
    phoneNumber: '',
    rank: '',
    unit: ''
  });

  const steps = [
    { id: 1, title: 'פרטים אישיים', component: PersonalDetailsStep },
    { id: 2, title: 'אימות טלפון', component: PhoneVerificationStep },
    { id: 3, title: 'השלמת הרשמה', component: CompletionStep }
  ];

  return (
    <div className="registration-wizard">
      <ProgressIndicator currentStep={currentStep} totalSteps={steps.length} />
      
      {steps.map(step => (
        <StepComponent
          key={step.id}
          isActive={currentStep === step.id}
          formData={formData}
          onNext={() => setCurrentStep(step.id + 1)}
          onBack={() => setCurrentStep(step.id - 1)}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
};
```

#### 2. OTP Input Component

```tsx
const OTPInput: React.FC<{
  length: number;
  onComplete: (code: string) => void;
  onResend: () => void;
  resendCooldown: number;
}> = ({ length, onComplete, onResend, resendCooldown }) => {
  const [code, setCode] = useState<string[]>(new Array(length).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (value: string, index: number) => {
    if (!/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // עבור לשדה הבא
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
    
    // בדוק אם הקוד הושלם
    if (newCode.every(digit => digit !== '') && newCode.length === length) {
      onComplete(newCode.join(''));
    }
  };

  return (
    <div className="otp-input-container">
      <div className="otp-inputs" dir="ltr">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            className={`otp-digit ${index === activeIndex ? 'active' : ''}`}
            value={digit}
            maxLength={1}
            onChange={(e) => handleInputChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={() => setActiveIndex(index)}
          />
        ))}
      </div>
      
      <ResendButton onResend={onResend} cooldown={resendCooldown} />
    </div>
  );
};
```

### Custom Hooks

#### 1. useRegistration Hook

```typescript
const useRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRegistration = async (data: RegistrationFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. אימות מספר אישי
      const militaryVerification = await verifyMilitaryId(
        data.militaryPersonalNumber,
        data.firstName,
        data.lastName
      );
      
      if (!militaryVerification.success) {
        throw new Error(militaryVerification.error);
      }
      
      // 2. אימות טלפון ויצירת חשבון Firebase
      const phoneVerification = await verifyPhoneAndCreateAccount(
        data.phoneNumber
      );
      
      if (!phoneVerification.success) {
        throw new Error(phoneVerification.error);
      }
      
      // 3. יצירת פרופיל משתמש
      const userProfile = await createUserProfile(
        phoneVerification.user,
        data
      );
      
      return { success: true, user: userProfile };
      
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    isLoading,
    error,
    submitRegistration
  };
};
```

#### 2. useOTPVerification Hook

```typescript
const useOTPVerification = (phoneNumber: string) => {
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const sendOTP = async () => {
    if (resendCooldown > 0) return;
    
    try {
      const confirmation = await firebase.auth().signInWithPhoneNumber(
        phoneNumber,
        window.recaptchaVerifier
      );
      
      setVerificationId(confirmation.verificationId);
      setResendCooldown(60); // 60 seconds cooldown
      
      // Start cooldown timer
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      throw new Error('שליחת קוד אימות נכשלה');
    }
  };

  const verifyOTP = async (otpCode: string) => {
    if (!verificationId || isLocked) return;
    
    try {
      const credential = firebase.auth.PhoneAuthProvider.credential(
        verificationId,
        otpCode
      );
      
      const result = await firebase.auth().signInWithCredential(credential);
      return { success: true, user: result.user };
      
    } catch (error) {
      setAttempts(prev => prev + 1);
      
      if (attempts >= 2) { // 3 attempts total
        setIsLocked(true);
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
        }, 15 * 60 * 1000); // 15 minutes lockout
      }
      
      throw new Error('קוד אימות שגוי');
    }
  };

  return {
    sendOTP,
    verifyOTP,
    resendCooldown,
    attempts,
    maxAttempts: 3,
    isLocked
  };
};
```

---

## 📊 מטריקות ומעקב

### אנליטיקה ומדידות

#### Events לעקיבה

```typescript
const REGISTRATION_EVENTS = {
  // התחלת תהליך
  REGISTRATION_STARTED: 'registration_started',
  
  // שלבים
  STEP_COMPLETED: 'registration_step_completed',
  STEP_ABANDONED: 'registration_step_abandoned',
  
  // אימותים
  MILITARY_ID_VERIFIED: 'military_id_verified',
  MILITARY_ID_FAILED: 'military_id_verification_failed',
  PHONE_VERIFICATION_STARTED: 'phone_verification_started',
  PHONE_VERIFICATION_COMPLETED: 'phone_verification_completed',
  OTP_SENT: 'otp_sent',
  OTP_VERIFIED: 'otp_verified',
  OTP_FAILED: 'otp_verification_failed',
  
  // השלמה
  REGISTRATION_COMPLETED: 'registration_completed',
  REGISTRATION_FAILED: 'registration_failed',
  
  // שגיאות
  NETWORK_ERROR: 'registration_network_error',
  VALIDATION_ERROR: 'registration_validation_error'
};

// דוגמת שימוש
const trackRegistrationEvent = (event: string, properties?: object) => {
  analytics.track(event, {
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent,
    referrer: document.referrer,
    ...properties
  });
};
```

#### KPIs למעקב

| מטריקה | תיאור | יעד |
|---------|-------|-----|
| **Completion Rate** | אחוז השלמת הרשמה מתחילת תהליך | > 85% |
| **Time to Complete** | זמן ממוצע להשלמת הרשמה | < 5 דקות |
| **Drop-off Rate** | אחוז נשירה בכל שלב | < 15% |
| **OTP Success Rate** | אחוז הצלחת אימות טלפון | > 95% |
| **Error Rate** | אחוז שגיאות מכלל הניסיונות | < 5% |
| **Mobile vs Desktop** | התפלגות מכשירים | 70% Mobile |

---

## 🔄 בדיקות איכות

### Unit Tests

```typescript
describe('SecurityUtils', () => {
  describe('hashMilitaryId', () => {
    it('should generate different hashes for the same input', async () => {
      const militaryId = '1234567';
      const hash1 = await SecurityUtils.hashMilitaryId(militaryId);
      const hash2 = await SecurityUtils.hashMilitaryId(militaryId);
      
      expect(hash1.hash).not.toBe(hash2.hash);
      expect(hash1.salt).not.toBe(hash2.salt);
    });
    
    it('should verify correct military ID', async () => {
      const militaryId = '1234567';
      const { hash, salt } = await SecurityUtils.hashMilitaryId(militaryId);
      
      const isValid = await SecurityUtils.verifyMilitaryId(
        militaryId, hash, salt
      );
      
      expect(isValid).toBe(true);
    });
  });
});

describe('ValidationUtils', () => {
  describe('validatePersonnelForm', () => {
    it('should validate correct form data', () => {
      const formData: RegistrationFormData = {
        firstName: 'יוסי',
        lastName: 'כהן',
        militaryPersonalNumber: '1234567',
        phoneNumber: '0501234567',
        rank: 'טוראי'
      };
      
      const result = ValidationUtils.validatePersonnelForm(formData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
    
    it('should fail on invalid Hebrew name', () => {
      const formData: RegistrationFormData = {
        firstName: 'John', // English name
        lastName: 'כהן',
        militaryPersonalNumber: '1234567',
        phoneNumber: '0501234567',
        rank: 'טוראי'
      };
      
      const result = ValidationUtils.validatePersonnelForm(formData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBeDefined();
    });
  });
});
```

### Integration Tests

```typescript
describe('Registration Flow', () => {
  it('should complete full registration flow', async () => {
    // Setup mock data
    const mockFormData = {
      firstName: 'דוד',
      lastName: 'לוי',
      militaryPersonalNumber: '1234567',
      phoneNumber: '+972501234567',
      rank: 'סמל'
    };
    
    // Mock Firebase Auth
    const mockUser = { uid: 'test-uid', phoneNumber: '+972501234567' };
    jest.spyOn(firebase.auth(), 'signInWithCredential')
        .mockResolvedValue({ user: mockUser });
    
    // Mock Firestore
    jest.spyOn(AdminFirestoreService, 'findAuthorizedPersonnel')
        .mockResolvedValue({ authorized: true });
    
    // Execute registration
    const result = await submitRegistration(mockFormData);
    
    // Verify success
    expect(result.success).toBe(true);
    expect(result.user.uid).toBe('test-uid');
    
    // Verify user profile was created
    const userDoc = await db.collection('users').doc('test-uid').get();
    expect(userDoc.exists).toBe(true);
    expect(userDoc.data()?.firstName).toBe('דוד');
  });
});
```

### E2E Tests

```typescript
describe('Registration E2E', () => {
  it('should complete registration with valid data', async () => {
    await page.goto('/register');
    
    // Fill personal details
    await page.fill('[data-testid="firstName"]', 'משה');
    await page.fill('[data-testid="lastName"]', 'אברהם');
    await page.fill('[data-testid="militaryId"]', '1234567');
    await page.selectOption('[data-testid="rank"]', 'רב טוראי');
    await page.fill('[data-testid="phoneNumber"]', '0501234567');
    
    // Submit form
    await page.click('[data-testid="submit-personal-details"]');
    
    // Wait for phone verification screen
    await page.waitForSelector('[data-testid="otp-input"]');
    
    // Enter OTP (mock for testing)
    await page.fill('[data-testid="otp-input-0"]', '1');
    await page.fill('[data-testid="otp-input-1"]', '2');
    await page.fill('[data-testid="otp-input-2"]', '3');
    await page.fill('[data-testid="otp-input-3"]', '4');
    await page.fill('[data-testid="otp-input-4"]', '5');
    await page.fill('[data-testid="otp-input-5"]', '6');
    
    // Wait for completion
    await page.waitForSelector('[data-testid="registration-success"]');
    
    // Verify success message
    const successMessage = await page.textContent('[data-testid="success-title"]');
    expect(successMessage).toContain('הרשמה הושלמה בהצלחה');
  });
});
```

---

## 📚 מסמכים קשורים

### קישורים למסמכים אחרים

- [`database-schema.md`](./database-schema.md) - מבנה מסד הנתונים
- [`admin-system-architecture.md`](./admin-system-architecture.md) - מערכת ניהול
- [`equipment-system.md`](./equipment-system.md) - מערכת ציוד
- [`style.md`](./style.md) - מדריך עיצוב

### תלויות טכניות

- **Firebase Auth** - אימות טלפון
- **Firestore** - מסד נתונים
- **Next.js** - פרונט-אנד
- **TypeScript** - Type safety
- **Tailwind CSS** - עיצוב

---

## 🎯 לוח זמנים משוער

| שלב | משימות | זמן משוער |
|------|---------|-----------|
| **שלב א'** | עיצוב UI/UX, רכיבי React בסיסיים | 1-2 שבועות |
| **שלב ב'** | לוגיקת אימות, אינטגרציה Firebase | 2-3 שבועות |
| **שלב ג'** | בדיקות, ביצועים, נגישות | 1-2 שבועות |
| **שלב ד'** | בדיקות משתמשים, שיפולים | 1 שבוע |
| **שלב ה'** | העלאה לפרודקשן | 3-5 ימים |

**סה"כ משוער:** 5-8 שבועות

---

## ✅ רשימת משימות להטמעה

### שלב הכנה

- [ ] הגדרת Firebase project
- [ ] קונפיגורציית Firestore collections
- [ ] הגדרת Security Rules
- [ ] הכנת authorized_personnel data

### שלב פיתוח

- [ ] יצירת רכיבי UI בסיסיים
- [ ] הטמעת ולידציות טופס
- [ ] אינטגרציה Firebase Auth
- [ ] מימוש אימות OTP
- [ ] יצירת custom hooks
- [ ] הוספת error handling

### שלב בדיקות

- [ ] Unit tests לכל הרכיבים
- [ ] Integration tests לתהליך מלא
- [ ] E2E tests עם Playwright
- [ ] בדיקות נגישות
- [ ] בדיקות ביצועים

### שלב הטמעה

- [ ] קונפיגורציית production environment
- [ ] העלאה ראשונית
- [ ] בדיקות smoke testing
- [ ] הטמעת analytics
- [ ] הכשרת משתמשים

---

**מסמך זה יתעדכן בהתאם לדרישות ולמשוב מהשטח.** 📝
