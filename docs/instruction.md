# Setup & Deployment Instructions for sayeret-givati Platoon/Class Status App

## 1. Project Initialization

1. Install Node.js (v18+ recommended) if not already installed.
2. Open a terminal in your project directory.
3. Run:

   ```bash
   npx create-next-app@latest .
   ```

   - Choose TypeScript if you want type safety (recommended).
   - When prompted, select "No" for the example app.
4. Install Tailwind CSS:

   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

5. Configure Tailwind by editing `tailwind.config.js` and adding paths to your files (see Tailwind docs).
6. Add Tailwind directives to `styles/globals.css`:

   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

## 2. Google Sheets API Setup

1. Create a Google Cloud project and enable the Google Sheets API.
2. Create a service account and generate a JSON key file.
3. Share your Google Sheet with the service account email.
4. Note your Sheet ID (from the URL).

## 3. Next.js API Route for Google Sheets

1. Create a folder: `pages/api/` (if not present).
2. Add a file (e.g., `sheets.ts`) to handle requests to Google Sheets using the service account credentials.
3. Store your service account JSON and Sheet ID as environment variables (see below).
4. Use a library like `googleapis` to fetch data from the sheet.

## 4. Environment Variables

- In development, create a `.env.local` file:

  ```env
  GOOGLE_SERVICE_ACCOUNT_JSON=...   # Paste the JSON string or use base64 encoding
  GOOGLE_SHEET_ID=...               # Your sheet ID
  ```

- In Vercel, add these as environment variables in the dashboard (Project Settings > Environment Variables).

## 5. Frontend Implementation

- Build the UI as described in the README:
  - Table with names, platoon/class, status, notes
  - Filters (dropdown, autocomplete)
  - Status buttons and custom status
  - Editable notes
  - Manual row add (with validation)
  - Select/deselect for reporting
  - Generate/copy formatted output
  - Offline/manual mode logic
  - RTL and mobile-friendly design
  - Branding (logo, colors, date/time)

## 6. Offline/Manual Mode

- If the API route fails to load data, show an error and allow manual row add/edit/report as a temporary session (in-memory only).

## 7. Testing Locally

- Run the app locally:

  ```bash
  npm run dev
  ```

- Visit <http://localhost:3000> to test.

## 8. Deploying to Vercel

1. Push your code to GitHub (or another git provider).
2. Go to <https://vercel.com> and import your repository.
3. Set the environment variables in the Vercel dashboard.
4. Deploy the project.

## 9. After Deployment

- Test the live app.
- If you need to update environment variables, redeploy the project.

---

**Tip:** For more details on any step, see the official docs for Next.js, Tailwind CSS, Google Sheets API, and Vercel.
