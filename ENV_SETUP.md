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
# 📊 GOOGLE SHEETS INTEGRATION (Optional)
# ==============================================
# For status reporting functionality
GOOGLE_SHEETS_PRIVATE_KEY_BASE64=your_base64_encoded_private_key
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_SHEET_ID=your_google_sheet_id

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

### Google Sheets (Optional)

1. Create Google Cloud Project
2. Enable Sheets API
3. Create Service Account
4. Download JSON key
5. Base64 encode the private key
