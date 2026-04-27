# AnnouncementsWidget.tsx

**File:** `src/app/components/home/AnnouncementsWidget.tsx`
**Status:** Active

## Purpose

Home-page widget that shows the 3 most recent unit announcements from the `announcements` Firestore collection.

Users with elevated roles (admin, officer, commander) see a "New announcement" button that opens a modal for posting. They can also delete existing announcements.

## Role gating

Post/delete are enabled for:
- `enhancedUser.userType === 'admin'`, OR
- `enhancedUser.role` ∈ {`UserRole.OFFICER`, `UserRole.COMMANDER`}

Enforced both client-side (UI) and server-side (`firestore.rules`).

## Data flow

- Reads via `getRecentAnnouncements()` in `src/lib/announcementsService.ts`
- Writes via `createAnnouncement()` / `deleteAnnouncement()` (client SDK)
- Types in `src/types/announcement.ts`
