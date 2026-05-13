# 🔧 Environment Variables Setup

Copy the content below to create your `.env.local` file:

```bash
# 🚀 Sayeret Givati - Environment Configuration
# Copy this content to .env.local and fill in your actual values

# ==============================================
# 🔥 FIREBASE CONFIGURATION (Required)
# ==============================================
# Get these from Firebase Console > Project Settings > General
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# ==============================================
# 📱 OTP via Firebase Phone Auth
# ==============================================
# No env vars required — phone auth is enabled in Firebase Console
# (Authentication → Sign-in method → Phone). Project must be on
# Blaze (pay-as-you-go) plan; 10K verifications/month are free.
# Add localhost + production domains to Authorized Domains.
# Add a test phone (with fixed OTP code) for local dev / CI.

# ==============================================
# 🛡️ Firebase App Check (Optional but recommended)
# ==============================================
# When set, the client attaches a reCAPTCHA v3 attestation token to every
# Firebase request — Firestore, Storage, Phone Auth. Mitigates the SMS-cost
# amplification vector flagged by the Council on PR-C.
#
# 1. Firebase Console → Project → App Check → Apps → Web → reCAPTCHA v3
# 2. Provision a site key (Google Cloud reCAPTCHA Admin → v3 → "I'm not a robot")
# 3. Paste below. Leaving this empty disables App Check (a warning logs once).
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
# Optional: set to `true` to print a debug token on dev (paste into Firebase
# Console → App Check → Debug tokens to whitelist localhost).
# NEXT_PUBLIC_APP_CHECK_DEBUG=true

# ==============================================
# 🛠️ DEVELOPMENT SETTINGS
# ==============================================
NODE_ENV=development

# Optional: Custom base URL for API calls
# NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 🔑 How to Get Each Value

### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ Settings > Project Settings
4. Scroll to "Your apps" section
5. Copy the config values

### Firebase Phone Auth

1. [Firebase Console](https://console.firebase.google.com/) → Project `sayeret-givati-1983`
2. Authentication → Sign-in method → Phone → Enable
3. Settings → Authorized domains → add `localhost`, `*.vercel.app`, prod domain
4. Phone numbers for testing → add test phone (e.g. `+972 50 123 4567` → fixed code `123456`) for local dev / CI
5. Upgrade project to Blaze plan if not already (Identity Platform features require it)

