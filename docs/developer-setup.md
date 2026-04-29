# 🛠️ Developer Setup Guide

## 📋 Quick Start Checklist

- [ ] Clone repository
- [ ] Install Node.js 18+ and npm
- [ ] Run `npm install`
- [ ] Set up environment variables
- [ ] Configure Firebase project
- [ ] Enable Firebase Phone Auth in console (for OTP)
- [ ] Run `npm run dev`

---

## 🚀 Step-by-Step Setup

### 1. **Prerequisites**

**Required Software:**

```bash
Node.js 18+ (recommended: 20+)
npm 9+ (comes with Node.js)
Git
```

**Check your versions:**

```bash
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
git --version   # Any recent version
```

### 2. **Clone & Install**

```bash
# Clone the repository
git clone https://github.com/MatanTal2/sayeret-givati.git
cd sayeret-givati

# Install all dependencies (this reads package.json automatically)
npm install

# This installs:
# - Next.js framework
# - React 19
# - Firebase SDK
# - TypeScript
# - Tailwind CSS
# - Testing libraries
# - All other dependencies
```

### 3. **Environment Configuration**

**Copy environment template:**

```bash
cp .env.example .env.local
```

**Edit `.env.local` with your values:**

#### 🔥 **Firebase Setup** (Required)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or select existing
3. Go to Project Settings > General
4. Copy configuration values to `.env.local`

#### 📱 **Firebase Phone Auth Setup** (Required for OTP)

1. Firebase Console → Authentication → Sign-in method → **Phone** → Enable
2. Upgrade project to Blaze plan if not already (Identity Platform requirement; 10K verifications/month are free)
3. Authentication → Settings → Authorized domains → add `localhost`, `*.vercel.app`, prod domain
4. Authentication → Phone → Phone numbers for testing → add a fixed test phone (e.g. `+972 50 123 4567` → `123456`) for local dev / CI
5. No env vars required — uses the existing `NEXT_PUBLIC_FIREBASE_*` values

#### 📊 **Google Sheets** (Optional)

Only needed for status reporting features:

1. Create Google Cloud Project
2. Enable Sheets API
3. Create Service Account
4. Generate key and encode to base64
5. Add to `.env.local`

### 4. **Firebase Project Setup**

**Required collections in Firestore:**

```bash
# Run this to set up database structure
npm run firebase:setup
```

**Manual setup if needed:**

1. Enable Firestore Database
2. Set up authentication (Email/Password)
3. Create collections:
   - `authorized_personnel`
   - `users`
   - `otp_sessions`
   - `otp_rate_limits`

### 5. **Development Server**

```bash
# Start development server
npm run dev

# Server starts at http://localhost:3000
```

**Available commands:**

```bash
npm run dev          # Development server with hot reload
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
npm run test         # Run Jest tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Coverage report
```

---

## 📦 **Dependency Management**

### **How Dependencies Work**

The project uses **`package.json`** as the "requirements file":

```json
{
  "dependencies": {
    "next": "15.3.4",           // Framework
    "react": "^19.0.0",         // UI library
    "firebase": "^12.0.0",      // Database & auth
    "tailwindcss": "^4.1.11"    // Styling
  },
  "devDependencies": {
    "typescript": "^5",         // Type checking
    "@testing-library/react": "^16.3.0"  // Testing
  }
}
```

### **Installing Dependencies**

```bash
# Install all dependencies (production + development)
npm install

# Install only production dependencies
npm install --production

# Add new dependency
npm install package-name

# Add development dependency
npm install -D package-name

# Update all dependencies
npm update
```

### **Lockfile Management**

- **`package-lock.json`** ensures consistent installs
- **Always commit** `package-lock.json` to git
- **Never** delete it manually

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **"Module not found" errors**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **TypeScript errors**

```bash
# Check types
npm run build
npx tsc --noEmit
```

#### **Environment variables not working**

- Ensure `.env.local` exists and is properly formatted
- Restart development server after changes
- Check that variables start with `NEXT_PUBLIC_` for client-side access

#### **Firebase connection issues**

- Verify project ID matches Firebase console
- Check Firestore rules allow read/write
- Ensure Firebase SDK is latest version

#### **Firebase Phone Auth not sending SMS**

- Confirm Phone provider is enabled in Firebase Console
- Confirm project is on Blaze plan
- Check phone number format (E.164: `+972XXXXXXXXX`)
- For local dev, use a registered test phone number with its fixed code
- Watch Authentication → Usage in Firebase Console for quota / errors

### **Getting Help**

1. **Check documentation** in `/docs` folder
2. **Run tests** to identify issues: `npm test`
3. **Check logs** in browser console and terminal
4. **Verify environment** variables are set correctly

---

## 📚 **Project Structure**

```ascii
sayeret-givati/
├── 📁 src/
│   ├── 📁 app/              # Next.js app router
│   │   ├── 📁 api/          # Backend API routes
│   │   │   └── 📁 auth/     # Authentication endpoints
│   │   └── 📄 page.tsx     # Homepage
│   ├── 📁 components/       # React components
│   │   └── 📁 registration/ # Registration flow
│   ├── 📁 lib/             # Utilities & services
│   │   ├── 📄 firebasePhoneAuth.ts # OTP wrapper (Firebase Phone Auth)
│   │   └── 📄 adminUtils.ts # Admin functions
│   └── 📁 types/           # TypeScript definitions
├── 📁 docs/                # Documentation
├── 📄 package.json         # Dependencies & scripts
├── 📄 .env.example         # Environment template
└── 📄 README.md           # Project overview
```

---

## 🚀 **Deployment**

### **Vercel (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### **Other Platforms**

The project is a standard Next.js app and can deploy to:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

---

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Watch mode during development
npm run test:watch

# Coverage report
npm run test:coverage

# Test specific file
npm test src/lib/__tests__/firebasePhoneAuth.test.ts
```

**Test Structure:**

- Unit tests: `src/**/__tests__/*.test.ts`
- Integration tests: `src/**/__tests__/*.integration.test.ts`
- Test utilities: `src/__tests__/utils/`

---

## 🔧 **Advanced Configuration**

### **TypeScript Configuration**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### **ESLint Configuration**

```javascript
// eslint.config.mjs
export default {
  extends: ["next/core-web-vitals"],
  rules: {
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### **Tailwind Configuration**

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        military: {
          green: "#2F5233",
          gold: "#DAA520"
        }
      }
    }
  }
}
```

---

## ✅ **Ready to Develop!**

Once setup is complete, you'll have:

- ✅ Full development environment
- ✅ Hot reload for instant feedback
- ✅ TypeScript for type safety
- ✅ Testing framework ready
- ✅ Firebase integration working
- ✅ OTP SMS functionality
- ✅ Military-themed UI components

## Happy coding! 🎖️
