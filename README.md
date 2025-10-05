# שבצ"ק מסייעת - סיירת גבעתי

מערכת ווב לניהול שבצ"ק (שבץ צבאי קבוע) של יחידות בסיירת גבעתי.

## 🎖️ גרסה 1.0 - הושלמה! ✅

## תכונות

- **📊 אינטגרציה עם Google Sheets**: צפייה בנתונים בזמן אמת
- **🔍 סינון מתקדם**: לפי צוות, שם וסטטוס עם ספירה דינמית
- **✅ בחירה חכמה**: בחירת הכל, לפי סטטוס או לפי צוות
- **🏠 ניהול סטטוסים**: בית, משמר או סטטוס מותאם אישית
- **📋 דוחות מעוצבים**: יצירת דוחות רב-מחלקתיים או מסוננים
- **🎨 ממשק עברי RTL**: עיצוב מלא מימין לשמאל
- **📱 מותאם מובייל**: עובד בצורה מושלמת על כל המכשירים
- **⚡ עמידות אופליין**: ממשיך לעבוד גם ללא חיבור לאינטרנט
- **🎖️ ברנדינג רשמי**: לוגו וצבעי סיירת גבעתי

## מסמכים

- [📋 מפרט גרסה 1.0](docs/spec-v1.md) - מפרט מפורט של התכונות המומשות
- [📖 מדריך למשתמש](docs/user-manual.md) - הוראות שימוש מפורטות בעברית
- [🚀 מפרט גרסה 2.0](docs/spec-v2.md) - תכנון לגרסה הבאה

## התחלה מהירה

```bash
# התקנת חבילות
npm install

# הרצה במצב פיתוח
npm run dev

# פתח http://localhost:3000
```

## קונפיגורציה

יש ליצור קובץ `.env.local` עם המשתנים הבאים:

```env
GOOGLE_SHEETS_PRIVATE_KEY_BASE64=...
GOOGLE_SHEETS_CLIENT_EMAIL=...
GOOGLE_SHEET_ID=...
```

## מבנה Google Sheets

```ascii
עמודה A: מספר אישי
עמודה B: שם פרטי  
עמודה C: שם משפחה
עמודה D: צוות
עמודה E: סטטוס
```

## טכנולוגיות

- **Frontend**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS עם Design Tokens מותאמים אישית
- **API**: Google Sheets API v4
- **Hosting**: Vercel

## 🎨 Design Tokens

הפרויקט משתמש במערכת Design Tokens מרכזית ב-`tailwind.config.js` לניהול עקבי של צבעים, גופנים ועיצוב.

### צבעים

#### צבעי מותג עיקריים
- **Primary**: `primary-50` עד `primary-950` - סגול סיירת גבעתי (#7c3aed)
- **Secondary**: `secondary-50` עד `secondary-900` - אפור כהה לטקסט משני

#### צבעי מצב (State Colors)
- **Success**: `success-50` עד `success-900` - ירוק להצלחה ואישור
- **Warning**: `warning-50` עד `warning-900` - כתום לאזהרות
- **Danger**: `danger-50` עד `danger-900` - אדום לשגיאות ומחיקה
- **Info**: `info-50` עד `info-900` - כחול למידע כללי

#### צבעי נייטרל
- **Neutral**: `neutral-50` עד `neutral-950` - אפור לטקסט ורקעים

### שימוש בצבעים

```jsx
// במקום צבעים קשיחים
<div className="bg-purple-600 text-white">

// השתמש ב-Design Tokens
<div className="bg-primary-600 text-white">
```

### גדלי גופן

```jsx
// גדלי גופן סטנדרטיים עם line-height מותאם
text-xs    // 12px
text-sm    // 14px  
text-base  // 16px (ברירת מחדל)
text-lg    // 18px
text-xl    // 20px
text-2xl   // 24px
text-3xl   // 30px
text-4xl   // 36px
```

### צללים מותאמים אישית

```jsx
shadow-soft      // צל עדין
shadow-medium    // צל בינוני
shadow-strong    // צל חזק
shadow-primary   // צל בצבע המותג
shadow-primary-lg // צל גדול בצבע המותג
```

### אנימציות מותאמות

```jsx
animate-fade-in      // הופעה עדינה
animate-modal-enter  // כניסת מודל
animate-wave-slide   // אפקט גל לכותרות
animate-shimmer      // אפקט טעינה
```

### הוספת/עדכון Design Tokens

1. **הוספת צבע חדש**: ערוך את `tailwind.config.js` בקטע `colors`
2. **הוספת גודל גופן**: ערוך את קטע `fontSize`
3. **הוספת אנימציה**: הוסף ל-`animation` ו-`keyframes`

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-new': {
          500: '#your-color',
          // ... גוונים נוספים
        }
      }
    }
  }
}
```

### עקרונות שימוש

1. **אל תשתמש בצבעים קשיחים** - תמיד השתמש ב-Design Tokens
2. **עקביות** - השתמש באותם צבעים לאותן פונקציות
3. **נגישות** - הקפד על ניגודיות מספקת
4. **תחזוקה** - עדכון אחד ב-config משפיע על כל האפליקציה

### דוגמאות שימוש

```jsx
// כפתורים
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  כפתור עיקרי
</button>

<button className="bg-success-600 hover:bg-success-700 text-white">
  כפתור הצלחה
</button>

// טקסט
<h1 className="text-neutral-900 text-2xl font-bold">כותרת</h1>
<p className="text-neutral-600 text-base">טקסט רגיל</p>

// רקעים
<div className="bg-neutral-50 border border-neutral-200">
  תוכן עם רקע עדין
</div>
```

## פריסה

הפרויקט מוכן לפריסה על Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/sayeret-givati)

---

## פותח עבור סיירת גבעתי 🇮🇱
