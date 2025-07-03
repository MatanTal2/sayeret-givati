
# sayeret-givati Platoon/Class Status App  

## שבצ"ק מסייעת - סיירת גבעתי

---

## Features

- **Live Data from Google Sheets:**  
  View a table with names, platoon/class, status, and notes, loaded from a Google Sheet.

- **Filter by Platoon/Class:**  
  Dropdown lets you filter by any platoon/class (`מחלקה/צוות`) in the sheet.

- **Filter by Name with Autocomplete:**  
  Start typing in a search box and see live dropdown suggestions. Selecting a name shows only that person’s row.

- **Mark Attendance/Status:**  
  - Each person has three status options:
    - **משמר**
    - **בית** (default; also default in the sheet if empty)
    - **אחר** (user may enter any custom status)
  - Status can be changed by clicking the relevant button or entering custom text.

- **Edit Notes:**  
  - Notes field is editable for each person.
  - Any text entered is only stored locally (unless a future version syncs with Google Sheets).

- **Manual Row Add:**  
  - User can add a new row with Name, Platoon/Class, Status (defaults to בית if empty), and Notes.
  - Validation: Name and Platoon/Class required.

- **Select/Deselect for Reporting:**  
  - Each row has a checkbox for including/excluding in the generated report.

- **Generate Formatted Output:**  
  - Click “הפק טקסט” to generate a formatted, Hebrew text summary, including date/time and only selected people.

- **Copy to Clipboard:**  
  - Copy generated summary in one click.

- **Offline Robustness:**  
  - If Google Sheets cannot be loaded (network error, offline, or API issue):  
    - Show a clear error message:  
      **“לא ניתן לטעון את הנתונים כרגע. ניתן להוסיף רשומות ידנית.”**
    - The app remains usable: manual row adding, editing, and report generation all still work (data is only in memory until refresh).

- **RTL and Mobile-Friendly:**  
  - Interface and all controls are right-to-left (Hebrew) and look good on desktop or mobile.

- **Branding:**  
  - Includes Sayeret Givati logo and branded colors.
  - Date/time display at the top.
  - UI is modern and clean.

- **No User Authentication:**  
  - No sign-in or Google login required or present.

- **Styling Framework:**  
  - Any UI/CSS framework may be used (Tailwind CSS, Bootstrap, Material-UI, or custom).

---

## User Story

> As a platoon/class leader,  
> I want to view, filter, and update my team’s daily status using a simple web app,  
> So I can quickly track, edit, and report who is present, at home, or has a special status,  
> In Hebrew, from any device, and even when offline.

---

## Tech Stack

- **Frontend:** Next.js (React)
- **Styling:** Any (Tailwind CSS by default; can use Bootstrap, Material-UI, etc.)
- **Data:** Google Sheets (read-only; via API, secured via serverless function or API route)
- **Hosting:** Vercel

---

## Implementation Details

- **Google Sheets API key and sheet ID** are kept server-side (e.g., in Vercel environment variables, used in a Next.js API route to prevent exposing credentials in the client).
- **Offline/manual mode:**  
  - On data load failure, disable editing of loaded rows, but manual add/edit/filter/output works as a temporary session (not persisted).
- **Status column in the sheet:**  
  - If missing or empty, treated as **בית** (default).

---

## Optional/Future Features

- Persistent offline mode using local storage (not included by default).
- Export as CSV.
- Write-back to Google Sheets (would require Google Auth and is not included in this spec).

---
