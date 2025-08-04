# 🚀 Developer Quick Start

## ⚡ 3-Minute Setup

```bash
# 1. Clone and install
git clone https://github.com/MatanTal2/sayeret-givati.git
cd sayeret-givati
npm install

# 2. Environment setup
cp ENV_SETUP.md .env.local
# Edit .env.local with your values (see ENV_SETUP.md)

# 3. Start development
npm run dev
```

## 📦 Dependencies: Automatic

**✅ Zero manual dependency management needed!**

When you run `npm install`, it automatically installs everything from `package.json`:

```json
{
  "dependencies": {
    "next": "15.3.4",        // Framework
    "react": "^19.0.0",      // UI Library  
    "firebase": "^12.0.0",   // Database & Auth
    "tailwindcss": "^4.1.11" // Styling
  },
  "devDependencies": {
    "typescript": "^5",      // Type checking
    "jest": "^29.7.0"        // Testing
  }
}
```

## 🛠️ What Gets Installed

| Package | Purpose | Auto-installed? |
|---------|---------|-----------------|
| **Next.js** | Web framework | ✅ Yes |
| **React 19** | UI components | ✅ Yes |
| **Firebase** | Database/Auth | ✅ Yes |
| **TypeScript** | Type safety | ✅ Yes |
| **Tailwind CSS** | Styling | ✅ Yes |
| **Jest** | Testing | ✅ Yes |
| **ESLint** | Code quality | ✅ Yes |

**No pip, requirements.txt, or manual installs needed!**

## 🔧 Available Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Run tests
npm run lint         # Check code quality
```

## 🌍 Environment Requirements

**Required accounts/services:**

- 🔥 **Firebase**: Database & authentication
- 📱 **Twilio**: SMS for OTP verification
- 📊 **Google Sheets**: Status reporting (optional)

## 📋 Pre-commit Checklist

- [ ] `npm install` completed successfully
- [ ] `.env.local` configured with real values
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` passes
- [ ] `npm test` passes

## 🆘 Common Issues

**"Module not found":**

```bash
rm -rf node_modules package-lock.json
npm install
```

**Environment variables not working:**

- Restart dev server after .env.local changes
- Check variable names match exactly

**Build fails:**

```bash
npm run lint  # Check for errors
npm test      # Run tests
```

## 📚 More Details

- **Full setup guide**: [docs/developer-setup.md](docs/developer-setup.md)
- **OTP implementation**: [docs/otp-implementation.md](docs/otp-implementation.md)  
- **API documentation**: [docs/](docs/)

---

## You're ready to code! 🎖️
