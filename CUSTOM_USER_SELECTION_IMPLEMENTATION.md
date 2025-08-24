# Custom User Selection Implementation

## Overview
Implemented a comprehensive custom user selection modal for the EmailTab component that allows administrators to select specific users for email notifications.

## Files Created/Modified

### 1. New Hook: `src/hooks/useUsers.ts`
- **Purpose**: Fetches all active users from Firestore users collection
- **Features**:
  - Fetches user data with proper error handling
  - Filters only active users
  - Maps Firestore data to simplified interface for email purposes
  - Sorts users alphabetically by last name, then first name
  - Includes team derivation based on user role

### 2. New Component: `src/components/management/tabs/CustomUserSelectionModal.tsx`
- **Purpose**: Modal popup for custom user selection
- **Features**:
  - Search functionality by name or email
  - Alphabetical filter with Hebrew letters (א-ת)
  - Select all/unselect all functionality
  - Sortable table with checkbox selection
  - Displays: Full Name, Team, Role, Rank columns
  - Pre-selection support for existing selections
  - Responsive design with proper Hebrew RTL support

### 3. Modified Component: `src/components/management/tabs/EmailTab.tsx`
- **Purpose**: Enhanced email tab with custom selection support
- **Changes**:
  - Added state management for selected users
  - Integrated CustomUserSelectionModal
  - Updated recipient count logic to handle custom selections
  - Added UI section for custom selection with selected users preview
  - Enhanced form clearing to include custom selections

## Features Implemented

### ✅ Popup Modal
- Fixed position overlay with backdrop
- Responsive design (max-width 4xl, max-height 90vh)
- Proper z-index for layering

### ✅ Search Functionality
- Real-time search by name or email
- Case-insensitive search
- Searches in firstName, lastName, fullName, and email fields

### ✅ User Selection Table
- Checkbox column for individual selection
- Full Name column with sorting (ascending/descending)
- Team column (derived from user role)
- Role column (user-friendly display names)
- Rank column
- Row click selection for better UX

### ✅ Select All/Unselect All
- "Select All" button for filtered results
- "Unselect All" button to clear selection
- Master checkbox in table header
- Shows count of selected vs total users

### ✅ Alphabetical Filter
- Hebrew alphabet filter buttons (א-ת)
- "All" option to show all users
- Visual indication of active filter
- Filters by first letter of firstName or lastName

### ✅ Modal Actions
- "Cancel" button that resets to original selection
- "Approve Selected" button with count indicator
- Disabled approve button when no users selected
- Shows selected count in footer

### ✅ EmailTab Integration
- Custom selection automatically opens modal
- Shows selected users count in recipients
- Preview section showing selected users
- "Edit Selection" button to reopen modal
- Form clearing includes custom selections

## User Experience

1. **Selecting Custom Recipients**:
   - User selects "בחירה מותאמת" from recipients dropdown
   - Modal automatically opens for user selection

2. **Finding Users**:
   - Search by typing name or email
   - Use alphabet filter for quick navigation
   - Sort by name (ascending/descending)

3. **Making Selections**:
   - Click rows or checkboxes to select users
   - Use "Select All" for all visible users
   - See real-time count of selections

4. **Confirming Selection**:
   - Click "Approve Selected" to confirm
   - See selected users in main form
   - Edit selection anytime with "Edit Selection" button

## Technical Details

### Data Flow
1. `useUsers` hook fetches users from Firestore
2. `CustomUserSelectionModal` handles selection logic
3. `EmailTab` manages state and form integration
4. Selected users are stored as `UserForEmail[]` array

### Performance Considerations
- Users fetched once on hook initialization
- Filtering and sorting done in memory
- Debounced search (if needed in future)
- Efficient re-renders with useMemo

### Accessibility
- Proper ARIA labels for checkboxes
- Keyboard navigation support
- Focus management for modal
- Screen reader friendly structure

## Future Enhancements

1. **Team Assignment**: Actual team data from user profiles instead of role-derived teams
2. **Bulk Operations**: Additional bulk selection options (by team, by role)
3. **User Details**: Show more user information (status, last login, etc.)
4. **Export Selection**: Save/load custom user lists
5. **Search Enhancement**: Advanced filters (by team, role, status)
