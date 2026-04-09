# ReportPreview.tsx

**File:** `src/app/components/ReportPreview.tsx`
**Lines:** 71
**Status:** Active

## Purpose

Report preview panel. Renders the generated report text in a `<pre>` block with copy-to-clipboard, WhatsApp share, and file download action buttons.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `reportText` | `string` | ✅ | Generated report text |
| `onClose` | `() => void` | ✅ | Close/hide the panel |
| `onDownload` | `() => void` | ✅ | Download as file |
| `isDownloading` | `boolean` | ✅ | Download in progress flag |
