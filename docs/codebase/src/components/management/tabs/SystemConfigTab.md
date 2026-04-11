# SystemConfigTab.tsx

**File:** `src/components/management/tabs/SystemConfigTab.tsx`  
**Lines:** 136  
**Status:** Placeholder (mock data)

## Purpose

System configuration settings UI for security (session timeout, max login attempts), notifications (email toggle), and system info display. Currently uses local state only — no Firestore persistence.

## State

| State | Type | Purpose |
|-------|------|---------|
| `autoBackup` | `boolean` | Auto backup toggle |
| `notificationEmail` | `boolean` | Notification email toggle |
| `sessionTimeout` | `number` | Session timeout minutes |
| `maxLoginAttempts` | `number` | Max login attempts |

## Known Issues

- Settings are not persisted — lost on page refresh.
- System info is mock data.
- Extensive inline Hebrew.
