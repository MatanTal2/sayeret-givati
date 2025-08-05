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
# 📱 TWILIO SMS CONFIGURATION (Required for OTP)
# ==============================================
# Get these from Twilio Console (https://console.twilio.com/)
TWILIO_ACCOUNT_SID=AC_your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here

# Messaging Service SID - Create in Twilio Console > Messaging > Services
MESSAGING_SERVICE_SID=MG_your_messaging_service_sid_here

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

### Twilio Configuration  

1. Sign up at [Twilio Console](https://console.twilio.com/)
2. **Account SID & Auth Token**: From main dashboard
3. **Messaging Service SID**:
   - Go to Messaging > Services
   - Create new Messaging Service
   - Copy the SID (starts with MG)

### Google Sheets (Optional)

1. Create Google Cloud Project
2. Enable Sheets API
3. Create Service Account
4. Download JSON key
5. Base64 encode the private key
