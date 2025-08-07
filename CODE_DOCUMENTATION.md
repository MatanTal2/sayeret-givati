# Project Code Documentation

## `src/app/admin/layout.tsx`

### Functions and Methods

#### AdminLayout
- **Description:** This is a React component that defines the layout for the admin section of the application. It includes a header with a title and a container for the page content.
- **Parameters:**
  - `children` (React.ReactNode): The content to be rendered within the layout.
- **Returns:** (JSX.Element) A JSX element representing the admin page layout.

## `src/app/admin/page.tsx`

### Functions and Methods

#### AdminPage
- **Description:** This component serves as the main entry point for the admin section. It handles the authentication flow, showing a loading spinner while checking the auth state, a login form if the user is not authenticated, and the admin dashboard if the user is authenticated.
- **Internal Functions:**
  - `handleLoginSuccess`: A callback function that is triggered on successful login.
  - `handleLogout`: A function that handles the logout process by calling the `logout` function from the `useAdminAuth` hook.
- **Returns:** (JSX.Element) A JSX element that conditionally renders the loading spinner, the `AdminLogin` component, or the `AdminDashboard` component based on the authentication state.

## `src/app/admin/components/AddPersonnel.tsx`

### Functions and Methods

#### AddPersonnel
- **Description:** This component provides a form for adding a new authorized person to the system. It includes fields for personal details, military information, and contact number. It also handles form submission, loading states, and displays success or error messages.
- **Internal Functions:**
  - `handleSubmit`: An async function that prevents the default form submission and calls the `addPersonnel` function.
  - `handleInputChange`: A function that updates the form field's value in the state and clears any displayed message.
- **Returns:** (JSX.Element) A JSX element containing the form for adding new personnel, along with an information box explaining the process.

## `src/app/admin/components/AdminDashboard.tsx`

### Functions and Methods

#### AdminDashboard
- **Description:** This component renders the main admin dashboard, which includes a header with a logout button and a tab-based navigation to switch between different admin functionalities like adding personnel, bulk uploading, viewing personnel, and viewing system stats.
- **Parameters:**
  - `onLogout` (() => void): A callback function that is called when the user logs out.
- **Internal Functions:**
  - `handleLogout`: A function that calls the `logout` function from the `useAdminAuth` hook and the `onLogout` prop.
- **Returns:** (JSX.Element) A JSX element containing the admin dashboard with tabbed navigation.

## `src/app/admin/components/AdminLogin.tsx`

### Functions and Methods

#### AdminLogin
- **Description:** This component provides a login form for system administrators. It includes fields for email and password, handles form submission, and displays loading states and error messages.
- **Parameters:**
  - `onLoginSuccess` (() => void): A callback function that is called on successful login.
- **Internal Functions:**
  - `handleSubmit`: An async function that prevents the default form submission, calls the `login` function, and then calls `onLoginSuccess` if the login was successful.
- **Returns:** (JSX.Element) A JSX element containing the admin login form.

## `src/app/admin/components/BulkUpload.tsx`

### Functions and Methods

#### BulkUpload
- **Description:** This component allows administrators to bulk upload authorized personnel data from a CSV file. It provides a template for download, handles file parsing and validation, displays a preview of the data, processes the upload, and shows the results, including successes and failures.
- **Internal Functions:**
  - `downloadTemplate`: A function to download a CSV template file.
  - `parseCsvFile`: A `Promise` that parses a CSV file, validates its headers, and returns an array of `AuthorizedPersonnelData`.
  - `handleFileUpload`: An async function that handles the file upload event, parses the CSV file, and sets the preview data.
  - `processBulkUpload`: An async function that sends the parsed personnel data to the server for bulk processing.
  - `clearResults`: A function to reset the component's state, clearing any results or previews.
- **Returns:** (JSX.Element) A JSX element containing the UI for bulk uploading personnel, including instructions, a file uploader, a preview section, and a results display.

### Exported Types and Interfaces

#### CsvUploadResult
- **Description:** Defines the shape of the result object after a CSV upload attempt.
- **Key Fields:**
  - `success` (number): The number of records successfully uploaded.
  - `failed` (number): The number of records that failed to upload.
  - `errors` (string[]): An array of error messages for the failed records.
  - `successNames` (string[]): An array of names of the personnel who were successfully added.

## `src/app/admin/components/SystemStats.tsx`

### Functions and Methods

#### SystemStats
- **Description:** This component displays key statistics and information about the system. It shows the total number of authorized personnel, how many have been added recently, and the system's operational status. It also provides quick actions and a log of recent activity.
- **Internal Functions:**
  - `formatLastUpdated`: A function to format the `lastUpdated` date into a human-readable time string.
- **Returns:** (JSX.Element) A JSX element that renders a dashboard with system statistics, information, quick actions, and recent activity.

## `src/app/admin/components/ViewPersonnel.tsx`

### Functions and Methods

#### ViewPersonnel
- **Description:** This component provides a comprehensive view of all authorized personnel in the system. It includes features for searching, filtering by rank, and sorting the personnel list. It also allows administrators to remove personnel from the system.
- **Internal Functions:**
  - `handleDelete`: An async function that prompts for confirmation and then deletes a person from the authorized list.
  - `formatDate`: A function to format a timestamp into a readable date and time string.
  - `formatPhoneNumber`: A function to format a phone number for display.
- **Returns:** (JSX.Element) A JSX element that displays the personnel list in a table with controls for searching, filtering, and sorting. It also shows a loading state and handles empty states.

## `src/app/api/auth/register/route.ts`

### Functions and Methods

#### POST
- **Description:** This function handles the user registration process. It receives user registration data in the request body, validates it, and then calls the `UserService.registerUser` method to create a new user account.
- **Parameters:**
  - `request` (NextRequest): The incoming Next.js API request object, which should contain the user's registration data in the JSON body.
- **Returns:** (NextResponse) A `NextResponse` object. On success, it returns a JSON object with `success: true`, the new user's `uid`, and a success message. On failure (e.g., missing fields, registration error), it returns a JSON object with `success: false` and an error message, with a corresponding HTTP status code (400 or 500).

#### GET
- **Description:** This function handles GET requests to the registration endpoint. It is not an allowed method for this endpoint and returns a 405 Method Not Allowed status.
- **Returns:** (NextResponse) A `NextResponse` object with a message indicating that the POST method should be used, and a 405 status code.

## `src/app/api/auth/send-otp/route.ts`

### Functions and Methods

#### POST
- **Description:** This function handles the process of sending a One-Time Password (OTP) to a user's phone number. It validates the phone number, checks for rate limiting, generates an OTP, stores it, and sends it via SMS using Twilio.
- **Parameters:**
  - `request` (NextRequest): The incoming Next.js API request object, which should contain the `phoneNumber` in the JSON body.
- **Returns:** (NextResponse) A `NextResponse` object. On success, it returns a JSON object with `success: true`, a success message, the formatted phone number, the number of attempts remaining, and the expiration time for the OTP. On failure, it returns a JSON object with `success: false` and an error message, with a corresponding HTTP status code (400, 429, or 500).

#### GET
- **Description:** This function handles GET requests to the send-otp endpoint. It is not an allowed method and returns a 405 Method Not Allowed status.
- **Returns:** (NextResponse) A `NextResponse` object with an error message and a 405 status code.

## `src/app/api/sheets/route.ts`

### Functions and Methods

#### GET
- **Description:** This function retrieves data from a specified Google Sheet. It authenticates with Google using service account credentials, fetches all data from the sheet, and returns it.
- **Returns:** (NextResponse) A `NextResponse` object. On success, it returns a JSON object containing the `data` from the sheet and some metadata. On failure, it returns a JSON object with an error message and a corresponding HTTP status code (403 or 500).

#### POST
- **Description:** This function appends new rows of soldier data to the Google Sheet. It receives an array of soldier objects, formats them into rows, and appends them to the sheet.
- **Parameters:**
  - `request` (Request): The incoming request object, which should contain an array of `soldiers` in the JSON body.
- **Returns:** (NextResponse) A `NextResponse` object. On success, it returns a JSON object with `success: true` and update details. On failure, it returns a JSON object with an error message and a corresponding HTTP status code (400, 403, or 500).

#### PUT
- **Description:** This function updates the status of existing soldiers in the Google Sheet. It reads the current sheet data, finds the rows corresponding to the soldiers provided in the request, and updates their status column.
- **Parameters:**
  - `request` (Request): The incoming request object, which should contain an array of `soldiers` with their updated status in the JSON body.
- **Returns:** (NextResponse) A `NextResponse` object. On success, it returns a JSON object with `success: true` and update details. On failure, it returns a JSON object with an error message and a corresponding HTTP status code (400, 404, or 500).

## `src/app/components/AddSoldierForm.tsx`

### Functions and Methods

#### AddSoldierForm
- **Description:** This component renders a form for adding a new soldier. The form is collapsible and includes fields for the soldier's name, ID, platoon, status (with custom status option), and notes. It also handles input changes and form submission.
- **Parameters:**
  - `showForm` (boolean): Controls the visibility of the form.
  - `newSoldier` (NewSoldierForm): An object containing the data for the new soldier being added.
  - `formErrors` (FormErrors): An object containing any validation errors for the form fields.
  - `uniquePlatoons` (string[]): An array of unique platoon names to populate the platoon dropdown.
  - `manuallyAddedCount` (number): The number of soldiers that have been manually added and are pending a server update.
  - `onToggleForm` (() => void): A function to toggle the visibility of the form.
  - `onFieldChange` ((field: keyof NewSoldierForm, value: string) => void): A function to handle changes in the form fields.
  - `onSubmit` (() => void): A function to handle the submission of the form.
  - `onUpdateServer` (() => void): A function to update the server with the newly added soldiers.
  - `onClearErrors` (() => void): A function to clear any form validation errors.
- **Internal Functions:**
  - `handleNameChange`: A function to handle changes to the name input and clear related errors.
  - `handleIdChange`: A function to handle changes to the ID input and clear related errors.
  - `handlePlatoonChange`: A function to handle changes to the platoon selection and clear related errors.
- **Returns:** (JSX.Element) A JSX element containing the "Add New" button and the collapsible form for adding a new soldier.

## `src/app/components/AuthButton.tsx`

### Functions and Methods

#### AuthButton
- **Description:** This component handles the authentication state display and user actions. It shows a "Login" button for signed-out users, and a user profile menu for signed-in users. The profile menu includes links to the user's profile, settings, and a logout button. It also features a notification button for equipment transfers.
- **Internal Functions:**
  - `handleClickOutside`: A memoized function to close the menu when a click is detected outside of it.
  - `handleKeyDown`: A memoized function to handle keyboard navigation (e.g., closing the menu with the Escape key).
  - `getUserInitials`: A memoized function that generates the user's initials for the profile icon, with several fallbacks.
  - `getUserFirstName`: A memoized function to get the user's first name for display.
  - `getUserLastName`: A memoized function to get the user's last name.
  - `getDesktopGreeting`: A memoized function to generate a greeting for the user.
  - `handleLoginClick`: A memoized function to open the authentication modal.
  - `handleMenuToggle`: A memoized function to toggle the profile menu.
  - `handleProfileClick`: A memoized function to handle clicks on the profile link.
  - `handleSettingsClick`: A memoized function to handle clicks on the settings button.
  - `handleLogout`: A memoized async function to handle user logout.
  - `handleButtonClick`: A memoized function for handling clicks on UI-only buttons like notifications.
- **Returns:** (JSX.Element) A JSX element that conditionally renders a loading spinner, a "Login" button, or a profile menu with a dropdown and a notification button based on the authentication state.

## `src/app/components/BottomBar.tsx`

### Functions and Methods

#### BottomBar
- **Description:** This component renders a bottom bar that appears when soldiers are selected. It contains a button to generate a report and checkboxes to configure the report settings, such as including multiple platoons or personal IDs.
- **Parameters:**
  - `show` (boolean): Controls the visibility of the bottom bar.
  - `reportSettings` (ReportSettings): An object containing the current settings for the report.
  - `onGenerateReport` (() => void): A function to be called when the "Generate Report" button is clicked.
  - `onReportSettingsChange` ((settings: Partial<ReportSettings>) => void): A function to handle changes in the report settings checkboxes.
- **Returns:** (JSX.Element | null) A JSX element representing the bottom bar, or `null` if the `show` prop is `false`.

## `src/app/components/FeatureCard.tsx`

### Functions and Methods

#### FeatureCard
- **Description:** This component displays a feature card with an icon, title, and description. The card is a clickable link that navigates to a specified URL. It can also display a "Coming Soon" badge if the feature is not yet available.
- **Parameters:**
  - `title` (string): The title of the feature.
  - `description` (string): A short description of the feature.
  - `icon` (string): An emoji or icon to represent the feature.
  - `href` (string): The URL to navigate to when the card is clicked.
  - `available` (boolean): Indicates whether the feature is currently available.
  - `color` (string): The background color class for the card (e.g., 'bg-blue-500').
- **Internal Component:**
  - `CardContent`: A sub-component that renders the visual content of the card, including the icon, title, description, and "Coming Soon" badge.
- **Returns:** (JSX.Element) A JSX element that wraps the `CardContent` in a Next.js `Link` component, making the entire card clickable.

## `src/app/components/Header.tsx`

### Functions and Methods

#### Header
- **Description:** This component renders the main header for the application. It includes the Sayeret Givati logo, a title, and a subtitle. It has a responsive design that adapts for mobile and desktop views. It can also conditionally display an authentication button or a "back" link.
- **Parameters:**
  - `title` (string): The main title to be displayed in the header.
  - `subtitle` (string): The subtitle to be displayed in the header (on mobile).
  - `backLink?` (string): The URL for the back link. Defaults to "/".
  - `backText?` (string): The text for the back link. Defaults to "← חזרה לעמוד הבית".
  - `showAuth?` (boolean): A flag to control whether the `AuthButton` is displayed. Defaults to `true`.
  - `enableWaveEffect?` (boolean): A flag to enable a wave animation effect on the title text. Defaults to `false`.
- **Returns:** (JSX.Element) A JSX element representing the application header with responsive layouts for mobile and desktop.

## `src/app/components/LoadingSpinner.tsx`

### Functions and Methods

#### LoadingSpinner
- **Description:** A simple, reusable loading spinner component.
- **Parameters:**
  - `size?` ('sm' | 'md' | 'lg'): The size of the spinner. Defaults to `'md'`.
  - `color?` ('white' | 'purple' | 'gray'): The color of the spinner. Defaults to `'white'`.
- **Returns:** (JSX.Element) A JSX element representing the loading spinner.

## `src/app/components/PasswordModal.tsx`

### Functions and Methods

#### PasswordModal
- **Description:** This component renders a modal that prompts the user to enter an admin password. It is used to authorize sensitive actions, such as updating data on the server. It includes a password input field with a visibility toggle, an error display, and submit/cancel buttons.
- **Parameters:**
  - `show` (boolean): Controls the visibility of the modal.
  - `password` (string): The current value of the password input.
  - `showPassword` (boolean): Toggles the visibility of the password text.
  - `passwordError` (string): An error message to display if password validation fails.
  - `isUpdating` (boolean): A flag to indicate if an update is in progress, which disables the buttons.
  - `onPasswordChange` ((password: string) => void): A function to handle changes in the password input.
  - `onTogglePasswordVisibility` (() => void): A function to toggle the password's visibility.
  - `onSubmit` (() => void): A function to be called when the submit button is clicked.
  - `onCancel` (() => void): A function to be called when the cancel button is clicked, or the modal is otherwise closed.
- **Internal Functions:**
  - `handleKeyPress`: A function to allow form submission by pressing the "Enter" key.
- **Returns:** (JSX.Element | null) A JSX element representing the password modal, or `null` if the `show` prop is `false`.

## `src/app/components/ReportPreview.tsx`

### Functions and Methods

#### ReportPreview
- **Description:** This component displays a preview of a generated report in a text area. It provides buttons for copying the report to the clipboard, downloading it as a file, and sharing it on WhatsApp.
- **Parameters:**
  - `show` (boolean): Controls the visibility of the report preview.
  - `reportText` (string): The text content of the report to be displayed.
  - `isDownloading` (boolean): A flag to indicate if the report is currently being downloaded, which shows a spinner on the download button.
  - `onClose` (() => void): A function to close the report preview.
  - `onCopyToClipboard` (() => void): A function to copy the report text to the clipboard.
  - `onDownload` (() => void): A function to trigger the download of the report.
  - `onWhatsApp` (() => void): A function to share the report on WhatsApp.
- **Returns:** (JSX.Element | null) A JSX element representing the report preview section, or `null` if the `show` prop is `false`.

## `src/app/components/SearchBar.tsx`

### Functions and Methods

#### SearchBar
- **Description:** This component is a simple, reusable search bar with a search icon.
- **Parameters:**
  - `value` (string): The current value of the search input.
  - `onChange` ((value: string) => void): A function to be called when the search input value changes.
  - `placeholder?` (string): The placeholder text for the search input. Defaults to "חיפוש לפי שם...".
- **Returns:** (JSX.Element) A JSX element representing the search bar.

## `src/app/components/SelectAllCheckbox.tsx`

### Functions and Methods

#### SelectAllCheckbox
- **Description:** This component is a checkbox that supports an indeterminate state, which is useful for "select all" functionality in tables or lists. It can represent three states: all items selected, some items selected (indeterminate), or no items selected.
- **Parameters:**
  - `allSelected` (boolean): `true` if all items are selected, which makes the checkbox appear checked.
  - `someSelected` (boolean): `true` if some, but not all, items are selected, which puts the checkbox in an indeterminate state.
  - `onToggle` (() => void): A function to be called when the checkbox is clicked.
  - `className?` (string): Optional additional CSS classes to apply to the checkbox.
  - `size?` ('sm' | 'md' | 'lg'): The size of the checkbox. Defaults to `'md'`.
- **Returns:** (JSX.Element) A JSX element representing the indeterminate checkbox.

## `src/app/components/SelectionBar.tsx`

### Functions and Methods

#### SelectionBar
- **Description:** This component displays information about the current selection of soldiers, including counts of selected and total soldiers (both filtered and overall). It also provides buttons to refresh the data and to update any changes made to the soldier statuses on the server.
- **Parameters:**
  - `filteredSelectedCount` (number): The number of selected soldiers within the filtered view.
  - `filteredTotalCount` (number): The total number of soldiers in the filtered view.
  - `selectedCount` (number): The total number of selected soldiers overall.
  - `totalCount` (number): The total number of soldiers overall.
  - `nameFilter` (string): The current name filter string.
  - `selectedTeams` (string[]): An array of the currently selected teams for filtering.
  - `selectedStatuses` (string[]): An array of the currently selected statuses for filtering.
  - `lastUpdated` (Date | null): The timestamp of the last data update.
  - `changedSoldiers` (Soldier[]): An array of soldiers who have had their status changed and are pending an update.
  - `isRefreshing` (boolean): A flag indicating if the data is currently being refreshed.
  - `isUpdatingChanges` (boolean): A flag indicating if changes are currently being updated on the server.
  - `onRefresh` (() => void): A function to be called to refresh the data.
  - `onUpdateChanges` (() => void): A function to be called to update the changes on the server.
  - `formatLastUpdated` ((date: Date) => string): A function to format the `lastUpdated` date into a string.
- **Returns:** (JSX.Element) A JSX element representing the selection bar with selection counts and action buttons.

## `src/app/components/SoldiersTableDesktop.tsx`

### Functions and Methods

#### SoldiersTableDesktop
- **Description:** This component renders a table of soldiers specifically for desktop views. It includes columns for selection, name, team, status, and notes. The table header features filterable dropdowns for team and status, and a "select all" checkbox. The status for each soldier can be changed directly within the table.
- **Parameters:**
  - `soldiers` (Soldier[]): An array of soldier objects to display.
  - `hasOtherStatus` (boolean): A flag indicating if any soldier has a custom "other" status, used to adjust column widths.
  - `uniquePlatoons` (string[]): An array of unique platoon names for the team filter.
  - `selectedTeams` (string[]): An array of the currently selected teams for filtering.
  - `selectedStatuses` (string[]): An array of the currently selected statuses for filtering.
  - `showTeamFilter` (boolean): Controls the visibility of the team filter dropdown.
  - `showStatusFilter` (boolean): Controls the visibility of the status filter dropdown.
  - `onToggleSelection` ((index: number) => void): A function to toggle the selection of a single soldier.
  - `onToggleAllVisible` (() => void): A function to toggle the selection of all visible soldiers.
  - `onStatusChange` ((index: number, status: string, customStatus?: string) => void): A function to handle status changes for a soldier.
  - `onNotesChange` ((index: number, notes: string) => void): A function to handle changes to a soldier's notes.
  - `onTeamFilterToggle` (() => void): A function to toggle the team filter dropdown.
  - `onStatusFilterToggle` (() => void): A function to toggle the status filter dropdown.
  - `onTeamFilterChange` ((teams: string[]) => void): A function to handle changes in the team filter.
  - `onStatusFilterChange` ((statuses: string[]) => void): A function to handle changes in the status filter.
  - `allVisibleSelected` (boolean): `true` if all visible soldiers are selected.
  - `someVisibleSelected` (boolean): `true` if some, but not all, visible soldiers are selected.
- **Internal Functions:**
  - `handleTeamFilterChange`: A function to update the list of selected teams.
  - `handleStatusFilterChange`: A function to update the list of selected statuses.
  - `clearTeamFilters`: A function to clear all team filters.
  - `clearStatusFilters`: A function to clear all status filters.
- **Returns:** (JSX.Element) A JSX element representing the soldiers table for desktop, or it is hidden on mobile views.

## `src/app/components/SoldiersTableMobile.tsx`

### Functions and Methods

#### SoldiersTableMobile
- **Description:** This component renders a list of soldiers optimized for mobile views. Instead of a traditional table, it displays each soldier as a card with their details and interactive elements for status changes and notes. The header contains dropdown filters for team and status.
- **Parameters:**
  - `soldiers` (Soldier[]): An array of soldier objects to display.
  - `uniquePlatoons` (string[]): An array of unique platoon names for the team filter.
  - `selectedTeams` (string[]): An array of the currently selected teams for filtering.
  - `selectedStatuses` (string[]): An array of the currently selected statuses for filtering.
  - `showTeamFilter` (boolean): Controls the visibility of the team filter dropdown.
  - `showStatusFilter` (boolean): Controls the visibility of the status filter dropdown.
  - `onToggleSelection` ((index: number) => void): A function to toggle the selection of a single soldier.
  - `onToggleAllVisible` (() => void): A function to toggle the selection of all visible soldiers.
  - `onStatusChange` ((index: number, status: string, customStatus?: string) => void): A function to handle status changes for a soldier.
  - `onNotesChange` ((index: number, notes: string) => void): A function to handle changes to a soldier's notes.
  - `onTeamFilterToggle` (() => void): A function to toggle the team filter dropdown.
  - `onStatusFilterToggle` (() => void): A function to toggle the status filter dropdown.
  - `onTeamFilterChange` ((teams: string[]) => void): A function to handle changes in the team filter.
  - `onStatusFilterChange` ((statuses: string[]) => void): A function to handle changes in the status filter.
  - `allVisibleSelected` (boolean): `true` if all visible soldiers are selected.
  - `someVisibleSelected` (boolean): `true` if some, but not all, visible soldiers are selected.
- **Internal Functions:**
  - `handleTeamFilterChange`: A function to update the list of selected teams.
  - `handleStatusFilterChange`: A function to update the list of selected statuses.
  - `clearTeamFilters`: A function to clear all team filters.
  - `clearStatusFilters`: A function to clear all status filters.
- **Returns:** (JSX.Element) A JSX element representing the soldiers list for mobile, or it is hidden on desktop views.

## `src/app/components/StatusToggle.tsx`

### Functions and Methods

#### StatusToggle
- **Description:** This component is a set of three buttons that act as a toggle for a soldier's status ('בית', 'משמר', 'אחר'). It visually indicates the currently selected status.
- **Parameters:**
  - `currentStatus` (string): The current status, which determines which button is highlighted.
  - `onStatusChange` ((status: string) => void): A function to be called when a status button is clicked.
  - `size?` ('sm' | 'md' | 'lg'): The size of the toggle buttons. Defaults to `'md'`.
  - `disabled?` (boolean): If `true`, the buttons are disabled. Defaults to `false`.
- **Returns:** (JSX.Element) A JSX element containing the group of status toggle buttons.

## `src/app/components/TextInputWithError.tsx`

### Functions and Methods

#### TextInputWithError
- **Description:** This is a reusable text input component that includes a label, support for displaying a validation error message, and a required field indicator.
- **Parameters:**
  - `label` (string): The label to display above the input field.
  - `value` (string): The current value of the input.
  - `onChange` ((value: string) => void): A function to be called when the input value changes.
  - `placeholder?` (string): The placeholder text for the input.
  - `error?` (string): An optional error message to display below the input. If present, the input border will be highlighted in red.
  - `required?` (boolean): If `true`, a red asterisk is shown next to the label. Defaults to `false`.
  - `type?` ('text' | 'password' | 'email' | 'tel'): The type of the input field. Defaults to `'text'`.
  - `disabled?` (boolean): If `true`, the input is disabled. Defaults to `false`.
- **Returns:** (JSX.Element) A JSX element containing the labeled text input and an optional error message.

## `src/components/AdminSetup.tsx`

### Functions and Methods

#### AdminSetup
- **Description:** This component provides a UI for setting up the initial admin user in Firebase Authentication. It allows the developer to enter a password for the predefined admin email and create the user. It also provides status feedback and a link to the admin login page upon successful creation.
- **Internal Functions:**
  - `createAdminUser`: An async function that handles the creation of the admin user in Firebase using the provided password. It also handles cases where the user already exists.
- **Returns:** (JSX.Element) A JSX element containing the admin setup form, status display, and instructions.

## `src/components/EquipmentTest.tsx`

### Functions and Methods

#### EquipmentTest
- **Description:** This is a placeholder component for testing the equipment management system. It currently displays a "Coming Soon" message with a breakdown of the features that will be included in the test, such as CRUD operations, transfer workflows, tracking, and security testing. It also shows the current development status.
- **Returns:** (JSX.Element) A JSX element containing the placeholder content for the equipment management test page.

## `src/components/FirebasePersistentTest.tsx`

### Functions and Methods

#### SimpleUserTest
- **Description:** This component is a testing utility for Firebase user authentication. It provides buttons to check the Firebase configuration and to run a test that attempts to create a new user. If the user already exists, it tries to sign in instead. It displays a detailed log of the test results.
- **Internal Functions:**
  - `addResult`: A helper function to add a new result to the `testResults` log.
  - `testCreateUser`: An async function that runs the main test logic: creating a user, checking the connection, and signing out. It also handles the case where the user already exists by attempting to sign in.
  - `checkFirebaseConfig`: A function to display the current Firebase configuration values.
- **Returns:** (JSX.Element) A JSX element containing the UI for the Firebase user creation test, including instructions, status, action buttons, and a results log.

## `src/components/SimpleRankIcon.tsx`

### Functions and Methods

#### SimpleRankIcon
- **Description:** This component displays a simple SVG icon representing a soldier's rank. It uses a predefined mapping of rank names to SVG strings. If a rank is not found in the mapping, it defaults to a medal emoji.
- **Parameters:**
  - `rank` (string): The name of the rank to display an icon for.
  - `className?` (string): Optional additional CSS classes to apply to the icon's container.
- **Returns:** (JSX.Element) A JSX `span` element that either renders the SVG icon using `dangerouslySetInnerHTML` or displays the fallback emoji.

## `src/components/SimpleUserTest.tsx`

### Functions and Methods

#### SimpleUserTest
- **Description:** This component provides a comprehensive testing interface for Firebase authentication. It includes a suite of tests for user registration, login, logout, invalid credential handling, and password resets. It also has functionality to check the Firebase configuration and to delete the test user from both authentication and Firestore. The component displays a detailed log and a summary of pass/fail results for each test scenario.
- **Internal Functions:**
  - `addResult`: A helper function to add a message to the detailed log.
  - `clearResults`: A function to clear both the detailed log and the summary results.
  - `updateAuthResult`: A function to add or update a result in the `authResults` summary.
  - `checkConfig`: A function to check and display the current Firebase configuration.
  - `runComprehensiveAuthTest`: An async function that runs a full suite of authentication tests.
  - `testUserDeletion`: An async function to sign in and then delete the test user from both Firebase Authentication and the Firestore database.
- **Returns:** (JSX.Element) A JSX element containing the UI for the comprehensive authentication test suite.

## `src/components/auth/AuthGuard.tsx`

### Functions and Methods

#### AuthGuard
- **Description:** This component protects its children from being rendered if the user is not authenticated. It shows a loading spinner while checking the authentication state. If the user is not authenticated, it displays a `LoginPrompt` or a custom fallback component. If the user is authenticated, it renders the children.
- **Parameters:**
  - `children` (ReactNode): The content to be protected and rendered for authenticated users.
  - `fallback?` (ReactNode): An optional custom component to display instead of the default `LoginPrompt` when the user is not authenticated.
- **Returns:** (JSX.Element) A JSX element that conditionally renders a loading spinner, the fallback/login prompt, or the protected children based on the authentication status.

## `src/components/auth/AuthModal.tsx`

### Functions and Methods

#### AuthModal
- **Description:** This component serves as a simple wrapper for the `AuthModalController`. It is designed to be used for general-purpose authentication, starting with the login view.
- **Parameters:**
  - `isOpen` (boolean): Controls whether the modal is open or closed.
  - `onClose` (() => void): A function to be called when the modal should be closed.
  - `onRegistrationSuccess?` (() => void): An optional callback to be executed upon successful user registration.

## `src/components/auth/AuthModalController.tsx`

### Functions and Methods

#### AuthModalController
- **Description:** This component acts as a controller for the authentication modals. It manages which modal (login or registration) is currently active and handles the transitions between them.
- **Parameters:**
  - `isOpen` (boolean): Controls the overall visibility of the modal system.
  - `onClose` (() => void): A function to close the modals.
  - `initialModal?` ('login' | 'registration'): The modal to display initially when opened. Defaults to `'login'`.
  - `onRegistrationSuccess?` (() => void): An optional callback to be passed down to the `RegistrationModal`.
- **Internal Functions:**
  - `handleClose`: A function to close the currently active modal and call the `onClose` prop.
  - `handleSwitchToLogin`: A function to switch the view to the `LoginModal`.
  - `handleSwitchToRegistration`: A function to switch the view to the `RegistrationModal`.
- **Returns:** (JSX.Element | null) A JSX fragment that contains both the `LoginModal` and `RegistrationModal`, but only renders the one that is currently active. Returns `null` if `isOpen` is `false`.

### Exported Types and Interfaces

#### ModalType
- **Description:** A type alias for the possible modal states.
- **Type:** `'login' | 'registration' | null`

## `src/components/auth/LoginModal.tsx`

### Functions and Methods

#### LoginModal
- **Description:** This component provides a modal dialog for user login. It includes fields for email and password, a submit button, and a link to switch to the registration modal. It also handles form submission, displays loading and error states from the `AuthContext`, and has a password visibility toggle.
- **Parameters:**
  - `isOpen` (boolean): Controls whether the modal is open or closed.
  - `onClose` (() => void): A function to be called when the modal should be closed.
  - `onSwitch` (() => void): A function to be called to switch to the registration modal.
- **Internal Functions:**
  - `handleSubmit`: An async function that handles the form submission by calling the `login` function.
  - `handleInputChange`: A function to update the `formData` state as the user types.
  - `handleClose`: A function that resets the form state and calls the `onClose` prop.
  - `handleSwitchToRegister`: A function that resets the form state and calls the `onSwitch` prop.
- **Returns:** (JSX.Element | null) A JSX element representing the login modal, or `null` if `isOpen` is `false`.

## `src/components/auth/LoginPrompt.tsx`

### Functions and Methods

#### LoginPrompt
- **Description:** This component displays a user-friendly message prompting unauthenticated users to log in. It is typically used as a fallback for protected content. It includes a button that opens the global authentication modal.
- **Internal Functions:**
  - `handleLoginClick`: A function that opens the authentication modal when the login button is clicked.
- **Returns:** (JSX.Element) A JSX element containing the login prompt card with a message and a login button.

## `src/components/auth/index.ts`

- **Description:** This file serves as a barrel file for the `auth` components and related types. It re-exports the `AuthModal` component and its props, as well as the `useAuth` hook and its associated types from the `AuthContext`. This allows for cleaner imports in other parts of the application.

## `src/components/registration/AccountDetailsStep.tsx`

### Functions and Methods

#### AccountDetailsStep
- **Description:** This component is a step in the user registration form, specifically for collecting the user's account details: email, password, and consent. It includes real-time validation for all fields and provides feedback to the user. It also features a password visibility toggle and a tooltip explaining the password requirements.
- **Parameters:**
  - `email?` (string): The initial value for the email field.
  - `password?` (string): The initial value for the password field.
  - `consent?` (boolean): The initial value for the consent checkbox.
  - `onSubmit?` ((data: AccountDetailsData) => void): A callback function to be executed when the form is submitted with valid data.
  - `isSubmitting?` (boolean): A flag to indicate if the form is currently being submitted.
- **Internal Functions:**
  - `handleInputChange`: A function to update the `formData` state as the user interacts with the form.
  - `handleSubmit`: A function that calls the `onSubmit` prop if the form is valid.
  - `togglePasswordVisibility`: A function to toggle the password's visibility.
- **Returns:** (JSX.Element) A JSX fragment containing the form for the account details step of the registration process.

## `src/components/registration/OTPVerificationStep.tsx`

### Functions and Methods

#### OTPVerificationStep
- **Description:** This component is a step in the user registration process for verifying the user's phone number via a One-Time Password (OTP). It displays a message indicating that an OTP has been sent, provides an input field for the code, and includes a button to resend the code. It performs real-time validation and automatically attempts to verify the OTP when a 6-digit code is entered.
- **Parameters:**
  - `phoneNumber` (string): The phone number to which the OTP was sent.
  - `onVerifySuccess?` (() => void): An optional callback function to be executed upon successful OTP verification.
- **Internal Functions:**
  - `handleVerifyOTP`: An async function that sends the OTP code to the backend for verification.
  - `handleInputChange`: A function to handle changes in the OTP input, ensuring only digits are entered.
  - `handleResendCode`: An async function that requests the backend to resend an OTP to the user's phone number.
- **Returns:** (JSX.Element) A JSX fragment containing the UI for the OTP verification step.

## `src/components/registration/PersonalDetailsStep.tsx`

### Functions and Methods

#### PersonalDetailsStep
- **Description:** This component is a step in the user registration form for collecting the user's personal details: first name, last name, gender, and birthdate. It performs real-time validation on all fields and enables the "Continue" button only when the form is valid.
- **Parameters:**
  - `firstName` (string): The initial value for the first name field.
  - `lastName` (string): The initial value for the last name field.
  - `gender?` (string): The initial value for the gender selection.
  - `birthdate?` (string): The initial value for the birthdate field.
  - `onSubmit?` ((data: PersonalDetailsData) => void): A callback function to be executed when the form is submitted with valid data.
- **Internal Functions:**
  - `handleInputChange`: A function to update the `formData` state as the user interacts with the form.
  - `handleSubmit`: A function that calls the `onSubmit` prop if the form is valid.
- **Returns:** (JSX.Element) A JSX fragment containing the form for the personal details step of the registration process.

## `src/components/registration/RegistrationDetailsStep.tsx`

### Functions and Methods

#### RegistrationDetailsStep
- **Description:** This component is a step in the user registration form that collects the final details required for creating an account, including email, password, gender, birthdate, and consent. It displays the user's first and last name as read-only fields. It performs real-time validation on all the editable fields.
- **Parameters:**
  - `firstName` (string): The user's first name (read-only).
  - `lastName` (string): The user's last name (read-only).
  - `phoneNumber` (string): The user's phone number (not used in the component, but passed in).
  - `onSubmit?` ((data: RegistrationData) => void): A callback function to be executed when the form is submitted with valid data.
- **Internal Functions:**
  - `handleInputChange`: A function to update the `formData` state.
  - `handleSubmit`: A function that calls the `onSubmit` prop if the form is valid.
- **Returns:** (JSX.Element) A JSX fragment containing the form for the registration details step.

### Exported Types and Interfaces

#### RegistrationData
- **Description:** Defines the shape of the form data for this step.
- **Key Fields:** `email`, `password`, `gender`, `birthdate`, `consent`.

## `src/components/registration/RegistrationForm.tsx`

### Functions and Methods

#### RegistrationForm
- **Description:** This component is the main controller for the multi-step user registration process. It orchestrates the flow between verifying the personal number, OTP verification, collecting personal and account details, and showing a success message. It manages the state for each step and handles the final submission of the registration data.
- **Parameters:**
  - `personalNumber` (string): The current value of the personal number input.
  - `setPersonalNumber` ((value: string) => void): A function to update the personal number in the parent component.
  - `onSwitchToLogin?` (() => void): An optional function to switch to the login view.
  - `onStepChange?` ((step: 'personal-number' | 'otp' | 'personal' | 'account' | 'success') => void): An optional callback that is fired when the registration step changes.
  - `currentStep` ('personal-number' | 'otp' | 'personal' | 'account' | 'success'): The current active step in the registration flow.
  - `onRegistrationSuccess?` (() => void): An optional callback to be executed upon successful registration.
- **Internal Functions:**
  - `updateCurrentStep`: A helper to call the `onStepChange` prop.
  - `handleInputChange`: A function to handle changes in the personal number input.
  - `sendOTPToUser`: An async function to request an OTP from the backend.
  - `handleVerifyPersonalNumber`: An async function to verify the personal number and then trigger sending an OTP.
  - `handleOTPVerifySuccess`: A function to move to the next step after successful OTP verification.
  - `handlePersonalDetailsSubmit`: A function to store personal details and move to the next step.
  - `handleAccountDetailsSubmit`: An async function to submit the complete registration data to the backend.
  - `handleContinueToSystem`: A function to call the `onRegistrationSuccess` prop after the success step.
- **Returns:** (JSX.Element) A JSX element that renders the appropriate registration step component based on the `currentStep` prop.

## `src/components/registration/RegistrationHeader.tsx`

### Functions and Methods

#### RegistrationHeader
- **Description:** This component renders the header for the registration modal. It includes a centered title, a "close" button, and a "back" button to navigate to the previous view (typically the login modal).
- **Parameters:**
  - `onBack` (() => void): A function to be called when the back button is clicked.
  - `onClose` (() => void): A function to be called when the close button is clicked.
- **Returns:** (JSX.Element) A JSX element containing the registration modal header.

## `src/components/registration/RegistrationModal.tsx`

### Functions and Methods

#### RegistrationModal
- **Description:** This component is the main container for the entire user registration flow. It renders the registration modal, which includes a header, a step indicator, the main registration form, and a footer. It manages the current step of the registration process and handles the navigation between steps.
- **Parameters:**
  - `isOpen` (boolean): Controls whether the modal is open or closed.
  - `onClose` (() => void): A function to be called when the modal should be closed.
  - `onSwitch` (() => void): A function to be called to switch to the login modal.
  - `onRegistrationSuccess?` (() => void): An optional callback to be executed upon successful user registration.
- **Internal Functions:**
  - `handleClose`: A function to reset the form state and close the modal.
  - `handleSwitchToLogin`: A function to reset the form state and switch to the login modal.
  - `handleStepChange`: A function to update the `currentStep` state.
  - `handleBackNavigation`: A function that determines the destination of the "back" button based on the current step.
- **Returns:** (JSX.Element | null) A JSX element representing the registration modal, or `null` if `isOpen` is `false`.

## `src/components/registration/RegistrationStepDots.tsx`

### Functions and Methods

#### RegistrationStepDots
- **Description:** This component displays a visual progress indicator for the multi-step registration process. It shows a series of dots connected by lines, where each dot represents a step. The color of the dots and lines changes to indicate completed, active, and upcoming steps.
- **Parameters:**
  - `currentStep` (RegistrationStep): The current active step, which determines the state of the dots.
  - `className?` (string): Optional additional CSS classes to apply to the container.
- **Internal Functions:**
  - `getActiveStepNumber`: A function that converts the `currentStep` string into a numerical representation (1-5).
  - `isStepCompleted`: A function that determines if a given step number is considered completed based on the `currentStep`.
  - `isStepActive`: A function that determines if a given step number is the currently active step.
- **Returns:** (JSX.Element) A JSX element that renders the step dots progress bar.

### Exported Types and Interfaces

#### RegistrationStep
- **Description:** A type alias for the possible registration step names.
- **Type:** `'personal-number' | 'otp' | 'personal' | 'account' | 'success'`

## `src/components/registration/RegistrationSuccessStep.tsx`

### Functions and Methods

#### RegistrationSuccessStep
- **Description:** This component represents the final step of the registration process, displaying a success message to the user. It includes a "Continue" button to proceed into the application.
- **Parameters:**
  - `onContinue?` (() => void): An optional callback function to be executed when the "Continue" button is clicked.
- **Internal Functions:**
  - `handleContinue`: A function that calls the `onContinue` prop.
- **Returns:** (JSX.Element) A JSX fragment containing the success message and a continue button.

## `src/components/ui/ComingSoon.tsx`

### Functions and Methods

#### ComingSoon
- **Description:** This component is a placeholder for features that are under development. It displays a "Coming Soon" message with a title, an optional description, and an expected availability date. It also includes a back button to navigate to the home page.
- **Parameters:**
  - `title` (string): The title of the feature that is coming soon.
  - `description?` (string): An optional description of the feature.
  - `expectedDate?` (string): An optional string indicating the expected availability date.
  - `showBackButton?` (boolean): If `true`, a back button to the home page is displayed. Defaults to `true`.
- **Returns:** (JSX.Element) A JSX element containing the "Coming Soon" page content.

## `src/constants/admin.ts`

### Constants

- **ADMIN_CONFIG**: An object containing configuration settings for the admin panel, such as the admin email, session duration, and Firestore collection names.
- **VALIDATION_PATTERNS**: An object holding regular expression patterns for validating inputs like military ID, phone number, and email.
- **VALIDATION_MESSAGES**: An object that provides a centralized collection of validation error messages.
- **ADMIN_MESSAGES**: An object containing success, error, and confirmation messages used throughout the admin panel.
- **RANK_OPTIONS**: An array of objects formatted for use in a dropdown menu, derived from the `MILITARY_RANKS` type.
- **ADMIN_TABS**: An array of objects that define the configuration for the tabs in the admin dashboard, including their ID, name, and description.
- **SECURITY_CONFIG**: An object with security-related configuration, such as the hashing algorithm, salt length, and login attempt limits.
- **FORM_CONSTRAINTS**: An object defining maximum length constraints for various form fields.
- **LOADING_OPERATIONS**: An object containing a mapping of loading operations to their corresponding display text.

## `src/constants/text.ts`

### Constants

- **TEXT_CONSTANTS**: A large, centralized object that holds all the text content for the application, organized into nested objects for different sections of the app.
- **Individual Exports**: Several key sections of the `TEXT_CONSTANTS` object are also exported individually for more convenient importing.

## `src/contexts/AuthContext.tsx`

### Context and Provider

#### AuthContext
- **Description:** This context provides a global state for user authentication throughout the application. It manages the user's authentication status, user data, loading states, and any related messages.

#### AuthProvider
- **Description:** This is the provider component for the `AuthContext`. It wraps the application and provides the authentication state to all its children. It listens for changes in the Firebase authentication state and fetches additional user data from Firestore for authenticated personnel users.
- **Parameters:**
  - `children` (ReactNode): The child components that will have access to the context.

### Custom Hook

#### useAuth
- **Description:** A custom hook that provides a convenient way to access the `AuthContext`'s value.
- **Returns:** The `AuthContextType` object, which includes the authentication state and action functions.

### Exported Types and Interfaces

#### AuthUser
- **Description:** Defines the basic shape of a user object derived from Firebase Authentication.
- **Key Fields:** `uid`, `email`, `displayName`, `userType` ('admin' or 'personnel'), `militaryId`, `rank`, `firstName`, `lastName`.

#### EnhancedAuthUser
- **Description:** An extended user type that includes the basic `AuthUser` data plus additional profile information fetched from Firestore. (Re-exported from `@/types/user`).

#### AuthCredentials
- **Description:** Defines the shape of the credentials object required for login.
- **Key Fields:** `email`, `password`.

#### FormMessage
- **Description:** Defines the shape of an object used for displaying form-related messages.
- **Key Fields:** `text`, `type` ('success', 'error', 'warning', 'info').

#### AuthContextType
- **Description:** Defines the complete shape of the value provided by the `AuthContext`.
- **Key Fields:** `user`, `enhancedUser`, `isAuthenticated`, `isLoading`, `message`, `login`, `logout`, `clearMessage`, `showAuthModal`, `setShowAuthModal`.

## `src/hooks/useAdminAuth.ts`

### Custom Hook

#### useAdminAuth
- **Description:** This hook encapsulates the logic for handling administrator authentication. It listens for Firebase auth state changes, provides functions for login and logout, and manages loading and message states specifically for the admin panel.
- **Returns:** (UseAdminAuthReturn) An object containing the authentication state and action functions for the admin.

### Exported Types and Interfaces

#### UseAdminAuthReturn
- **Description:** Defines the shape of the object returned by the `useAdminAuth` hook.
- **Key Fields:** `isAuthenticated`, `isLoading`, `message`, `login`, `logout`, `checkSession`.

## `src/hooks/usePersonnelManagement.ts`

### Custom Hook

#### usePersonnelManagement
- **Description:** This hook provides a comprehensive set of tools for managing the authorized personnel list in the admin panel. It handles form state for adding new personnel, validation, and communication with the `AdminFirestoreService` for CRUD operations (Create, Read, Delete).
- **Returns:** (UsePersonnelManagementReturn) An object containing the state and functions for managing personnel.

### Exported Types and Interfaces

#### UsePersonnelManagementReturn
- **Description:** Defines the shape of the object returned by the `usePersonnelManagement` hook.
- **Key Fields:** `formData`, `isLoading`, `message`, `personnel`, `updateFormField`, `addPersonnel`, `addPersonnelBulk`, `deletePersonnel`, `fetchPersonnel`, `clearMessage`, `resetForm`.

## `src/hooks/useSoldiers.ts`

### Custom Hook

#### useSoldiers
- **Description:** This is a comprehensive hook that manages the entire state and logic for the main soldier-tracking feature. It handles fetching soldier data from the API, caching, filtering, selection, status updates, and adding new soldiers. It also manages loading, error, and form states.
- **Returns:** An object containing the state, operations, and utility functions for managing soldiers.

## `src/lib/adminUtils.ts`

### Classes

#### SecurityUtils
- **Description:** A class containing static methods for security-related operations, specifically for hashing and verifying military personal numbers using the Web Crypto API.
- **Methods:** `hashMilitaryId`, `verifyMilitaryId`.

#### ValidationUtils
- **Description:** A class with static methods for validating various types of form data, such as military IDs, names, ranks, phone numbers, and emails.
- **Methods:** `validateMilitaryId`, `validateFirstName`, `validateLastName`, `validateRank`, `validatePhoneNumber`, `validateEmail`, `isValidIsraeliMobile`, `toInternationalFormat`, `validatePersonnelForm`, `validateAuthorizedPersonnelData`.

#### AdminFirestoreService
- **Description:** A class that encapsulates all Firestore operations related to the admin panel, such as managing authorized personnel and fetching admin configuration.
- **Methods:** `checkMilitaryIdExists`, `getAdminConfig`, `addAuthorizedPersonnel`, `addAuthorizedPersonnelBulk`, `getAllAuthorizedPersonnel`, `deleteAuthorizedPersonnel`.

#### SessionUtils
- **Description:** A class with static methods for managing the admin session in the browser's local storage.
- **Methods:** `isSessionValid`, `createSession`, `clearSession`, `getCurrentSession`.

#### AdminError
- **Description:** A custom error class that extends the base `Error` class to include additional context, such as an error code and the operation that failed.

## `src/lib/cache.ts`

### Functions

#### getCachedData
- **Description:** This function retrieves soldier data from the browser's local storage. It checks if the cached data exists and if it has expired (based on a 12-hour TTL). If the data is valid, it returns it; otherwise, it clears the cache and returns `null`.
- **Returns:** An object containing the cached `data` and `timestamp`, or `null` if no valid cache exists.

#### setCachedData
- **Description:** This function saves soldier data and a timestamp to the local storage.
- **Parameters:**
  - `data` (Soldier[]): The array of soldier data to be cached.
  - `timestamp` (number): The timestamp of when the data was fetched.

### Constants

- **CACHE_KEY**: The key used to store the cached data in local storage.
- **CACHE_TTL**: The Time-To-Live for the cache, set to 12 hours in milliseconds.

## `src/lib/dateUtils.ts`

### Functions

#### formatReportDate
- **Description:** Formats a `Date` object into a date string specifically for reports.
- **Parameters:**
  - `date` (Date): The date to format.
- **Returns:** (string) A formatted date string.

#### formatReportTime
- **Description:** Formats a `Date` object into a time string.
- **Parameters:**
  - `date` (Date): The date to format.
- **Returns:** (string) A formatted time string.

#### formatLastUpdated
- **Description:** Formats a `Date` object into a "last updated" string, showing "היום" (Today) if applicable.
- **Parameters:**
  - `date` (Date): The date to format.
- **Returns:** (string) A formatted "last updated" string.

#### formatCacheErrorDate
- **Description:** Formats a timestamp into a full date and time string for displaying cache age on error.
- **Parameters:**
  - `timestamp` (number): The timestamp to format.
- **Returns:** (string) A formatted date and time string.

## `src/lib/equipmentUtils.ts`

### Functions

- **createHistoryEntry**: Creates a new history entry for an equipment item.
- **createNewEquipment**: Creates a new equipment item with an initial history entry.
- **transferEquipment**: Updates an equipment item for a transfer and adds a history entry.
- **updateEquipmentStatus**: Updates the status of an equipment item and adds a history entry.
- **updateEquipmentCondition**: Updates the condition of an equipment item and adds a history entry.
- **performDailyCheckIn**: Performs a daily check-in for an equipment item and adds a history entry.
- **validateEquipmentId**: Validates the format of an equipment ID.
- **getUserPermissions**: Gets a list of permissions for a given user role.
- **hasPermission**: Checks if a user has a specific permission.
- **filterEquipmentList**: Filters a list of equipment based on user permissions and filter criteria.
- **sortEquipmentList**: Sorts a list of equipment based on a specified field and direction.
- **formatEquipmentDate**: Formats a date string for display in the equipment context.
- **getStatusDisplayText**: Gets the Hebrew display text for an equipment status.
- **getConditionDisplayText**: Gets the Hebrew display text for an equipment condition.
- **needsAttention**: Determines if an equipment item requires attention based on its status or last update time.

## `src/lib/equipmentValidation.ts`

### Functions

- **validateNewEquipmentForm**: Validates the data from the "new equipment" form.
- **validateTransferForm**: Validates the data for a single equipment transfer.
- **validateBulkTransferForm**: Validates the data for a bulk equipment transfer.
- **validateEquipmentId**: Validates the format of an equipment ID.
- **validateUserName**: Validates a user's name.
- **validatePhoneNumber**: Validates a phone number for OTP.
- **validateUnitName**: Validates a unit name.
- **validateLocation**: Validates a location.
- **validateNotes**: Validates the notes field.
- **validateRetirementReason**: Validates the reason for retiring an equipment item.
- **validateForm**: A generic function to run multiple validators on a form data object.

### Exported Types and Interfaces

#### ValidationResult
- **Description:** Defines the shape of the object returned by the validation functions.
- **Key Fields:** `isValid`, `errors`, `warnings?`.

## `src/lib/otpUtils.ts`

### Class

#### OTPManager
- **Description:** A class containing static methods for managing the entire One-Time Password (OTP) lifecycle. This includes generating OTPs, creating and verifying sessions in Firestore, and handling rate limiting to prevent abuse.
- **Methods:** `generateOTPCode`, `createOTPSession`, `verifyOTPCode`, `checkRateLimit`, `cleanupExpiredSessions`.

### Exported Types and Interfaces

#### OTPSession
- **Description:** Defines the shape of an OTP session object as it is stored in Firestore.
- **Key Fields:** `phoneNumber`, `otpCode`, `createdAt`, `expiresAt`, `verified`.

#### RateLimitSession
- **Description:** Defines the shape of a rate limiting session object stored in Firestore.
- **Key Fields:** `phoneNumber`, `attempts`, `firstAttemptAt`, `lastAttemptAt`.

## `src/lib/selectionUtils.ts`

### Functions

- **selectAllSoldiers**: Returns a new array with all soldiers marked as selected.
- **selectNoneSoldiers**: Returns a new array with all soldiers marked as not selected.
- **toggleAllVisibleSoldiers**: Toggles the selection state of only the soldiers that are currently visible (filtered).
- **selectSoldiersByStatus**: Returns a new array with all soldiers of a specific status marked as selected.
- **selectSoldiersByPlatoon**: Returns a new array with all soldiers from a specific platoon marked as selected.
- **createSelectAllHandler**: A higher-order function that creates a handler for selecting all soldiers, to be used with a React state setter.
- **createSelectNoneHandler**: Creates a handler for deselecting all soldiers.
- **createToggleAllVisibleHandler**: Creates a handler for toggling the selection of visible soldiers.
- **createSelectByStatusHandler**: Creates a handler for selecting soldiers by status.
- **createSelectByPlatoonHandler**: Creates a handler for selecting soldiers by platoon.

## `src/lib/soldierUtils.ts`

### Functions

- **generateReport**: Generates a formatted text report from a list of selected soldiers.
- **validateSoldierForm**: Validates the data for a new soldier form.
- **downloadTextFile**: Triggers the download of a text file in the browser.
- **copyToClipboard**: Copies a given string to the user's clipboard.

## `src/lib/statusUtils.ts`

### Functions

- **mapRawStatusToStructured**: Maps a raw status string to a structured object with a `status` and an optional `customStatus`.
- **mapStructuredStatusToRaw**: Maps a structured status object back to a single raw status string.
- **getAvailableStatuses**: Returns a list of the available primary statuses.

### Exported Types and Interfaces

#### StatusMapping
- **Description:** Defines the shape of a structured status object.
- **Key Fields:** `status`, `customStatus?`.

## `src/lib/twilioService.ts`

### Class

#### TwilioService
- **Description:** A class with static methods for interacting with the Twilio API to send SMS messages, specifically for One-Time Passwords (OTPs). It handles configuration validation, phone number formatting, and sending the SMS.
- **Methods:** `sendOTPSMS`, `formatPhoneNumber`, `validatePhoneNumber`.
- **Private Methods:** `validateConfig`.

## `src/lib/userDataService.ts`

### Class

#### UserDataService
- **Description:** A service class with static methods for fetching and managing user data from Firestore. It also includes helper functions for generating user-related display strings like initials and greetings.
- **Methods:** `fetchUserDataByEmail`, `generateInitials`, `generateDisplayName`, `getFirstName`.

## `src/lib/userService.ts`

### Class

#### UserService
- **Description:** A service class with static methods for handling user registration and profile management in Firestore.
- **Methods:** `registerUser`, `checkUserExists`.
- **Private Methods:** `getAuthorizedPersonnelData`, `markAsRegistered`.

## `src/types/admin.ts`

### Interfaces

- **AdminSession**: Defines the shape of an admin session object.
- **AdminCredentials**: Defines the shape of the credentials for admin login.
- **AdminConfig**: Defines the shape of the admin configuration document in Firestore.
- **PersonnelFormData**: Defines the shape of the form data for adding a new person, including their personal email.
- **AuthorizedPersonnelData**: Defines the shape of the data for pre-authorizing personnel (without email).
- **AuthorizedPersonnel**: Defines the shape of an authorized personnel document in Firestore.
- **FormMessage**: Defines the shape of a message object for UI feedback.
- **LoadingState**: Defines the shape of an object to manage loading states.
- **ValidationRule**: Defines the shape of a validation rule object.
- **ValidationResult**: Defines the shape of the result of a validation check.
- **SystemStats**: Defines the shape of the system statistics object.
- **AdminApiResponse<T>**: A generic interface for admin API responses.
- **PersonnelOperationResult**: Defines the shape of the result of a personnel operation (add, delete).
- **BulkUploadResult**: Defines the shape of the result of a bulk upload operation.

### Type Aliases

- **AdminTabType**: A type for the possible admin dashboard tab IDs.
- **MilitaryRank**: A type created from the `MILITARY_RANKS` array.

### Constants

- **MILITARY_RANKS**: An array of all possible military ranks, serving as a single source of truth.

## `src/types/auth.ts`

### Interfaces

- **AuthGuardProps**: Defines the props for the `AuthGuard` component.
- **LoginPromptProps**: Defines the props for the `LoginPrompt` component.
- **ComingSoonProps**: Defines the props for the `ComingSoon` component.
- **PageAccessProps**: Defines the props for controlling page access based on authentication and feature availability.

## `src/types/equipment.ts`

### Interfaces

- **Equipment**: The main interface for an equipment item.
- **EquipmentHistoryEntry**: Defines an entry in the equipment's tracking history.
- **ApprovalDetails**: Defines an approval record for an equipment action.
- **EmergencyOverride**: Defines an emergency override record.
- **RetirementRequest**: Defines a request to retire an equipment item.
- **NewEquipmentForm**: Defines the form for adding new equipment.
- **TransferEquipmentForm**: Defines the form for transferring equipment.
- **BulkTransferForm**: Defines the form for bulk transferring equipment.
- **EquipmentFilter**: Defines the filter object for querying equipment.
- **EquipmentListResponse**: Defines the API response for a list of equipment.
- **EquipmentOperationResult**: Defines the result of an equipment operation.
- **EquipmentSort**: Defines the sorting object for equipment lists.
- **EquipmentUserContext**: Defines the user context for permission checking.

### Enums

- **EquipmentStatus**: Possible statuses of an equipment item.
- **EquipmentCondition**: Possible conditions of an equipment item.
- **EquipmentAction**: Possible actions that can be performed on an equipment item.
- **ApprovalType**: Possible types of approval for an action.
- **RetirementStatus**: Possible statuses of a retirement request.
- **UserRole**: Possible user roles in the system.
- **EquipmentPermission**: Possible permissions a user can have.

### Type Aliases

- **EquipmentSortField**: The possible fields to sort equipment by.
- **SortDirection**: The possible sort directions ('asc' or 'desc').

## `src/types/index.ts`

### Interfaces

- **Soldier**: Defines the shape of a soldier object used throughout the application.
- **FormErrors**: Defines the shape of an object for storing validation errors for the "add new soldier" form.
- **NewSoldierForm**: Defines the shape of the form data for adding a new soldier.
- **ReportSettings**: Defines the shape of the settings object for generating reports.
- **FilterState**: Defines the shape of the state object for the filters.

## `src/types/registration.ts`

### Interfaces

- **PersonalDetailsData**: Defines the shape of the data for the personal details step of registration.
- **AccountDetailsData**: Defines the shape of the data for the account details step of registration.
- **CompleteRegistrationData**: An interface that combines `PersonalDetailsData` and `AccountDetailsData` for the final registration submission.
- **PersonalDetailsValidationErrors**: Defines the shape of the validation errors object for the personal details step.
- **AccountDetailsValidationErrors**: Defines the shape of the validation errors object for the account details step.
- **PersonalDetailsStepProps**: Defines the props for the `PersonalDetailsStep` component.
- **AccountDetailsStepProps**: Defines the props for the `AccountDetailsStep` component.

## `src/types/user.ts`

### Interfaces

- **EnhancedAuthUser**: An extended user interface that combines the basic user data from Firebase Authentication with the detailed user profile information from Firestore.
- **FirestoreUserProfile**: Defines the shape of a user's profile document as it is stored in the `users` collection in Firestore.
- **UserFetchResult**: Defines the shape of the result object when fetching user data.

### Exported Types and Interfaces

#### RegistrationData
- **Description:** Defines the shape of the complete registration data required by the `registerUser` function.
- **Key Fields:** `email`, `password`, `firstName`, `lastName`, `gender`, `birthdate`, `phoneNumber`, `militaryPersonalNumber`.

#### UserProfile
- **Description:** Defines the shape of a user profile document as it is stored in the Firestore `users` collection.
- **Key Fields:** `uid`, `email`, `firstName`, `lastName`, `gender`, `birthday`, `phoneNumber`, `rank`, `role`, `status`, `militaryPersonalNumberHash`, `permissions`, `joinDate`, `createdAt`, `updatedAt`, `profileImage?`, `testUser?`.

#### UserRegistrationResult
- **Description:** Defines the shape of the result object returned by the `registerUser` function.
- **Key Fields:** `success`, `uid?`, `message?`, `error?`.

## `src/utils/navigationUtils.ts`

### Functions

- **getFeatureRoutes**: Returns a complete list of all feature routes in the application, with their configuration details.
- **routeRequiresAuth**: Checks if a given route requires user authentication.
- **routeIsComingSoon**: Checks if a given route is marked as "coming soon".

### Exported Types and Interfaces

#### FeatureRoute
- **Description:** Defines the shape of an object that holds the configuration for a feature route.
- **Key Fields:** `title`, `description`, `icon`, `href`, `available`, `color`, `requiresAuth`, `isComingSoon`.

## `src/utils/validationUtils.ts`

### Classes

- **FormValidationUtils**: A class containing static methods for validating various form fields.
- **PhoneUtils**: A class with static methods for phone number-related utilities.

### Constants

- **VALIDATION_PATTERNS**: An object holding regular expression patterns for validation.
- **VALIDATION_MESSAGES_HE**: An object containing validation error messages in Hebrew.

### Exported Types and Interfaces

#### ValidationResult
- **Description:** Defines the shape of the object returned by the validation functions.

### Individual Exports
- **Description:** Several validation functions are also exported individually for more convenient direct use.

## `src/lib/firebase.ts`

### Constants

- **firebaseConfig**: An object that holds the Firebase configuration details, loaded from environment variables.
- **app**: The main Firebase app instance, initialized only once.
- **db**: The Firestore database instance.
- **auth**: The Firebase Authentication instance.

## `src/components/registration/RegistrationFooter.tsx`

### Functions and Methods

#### RegistrationFooter
- **Description:** This component renders the footer for the registration modal. It displays the company name and can optionally show a note about the registration process.
- **Parameters:**
  - `showRegistrationNote?` (boolean): If `true`, a note about the registration process is displayed. Defaults to `false`.
- **Returns:** (JSX.Element) A JSX element containing the registration footer content.

#### ValidationErrors
- **Description:** Defines the shape of the validation errors object.
- **Key Fields:** `email`, `password`, `gender`, `birthdate`, `consent`.

## `src/components/auth/GlobalAuthModal.tsx`

### Functions and Methods

#### GlobalAuthModal
- **Description:** This component provides a globally accessible authentication modal. It uses the `AuthContext` to determine whether the modal should be shown and provides the necessary callbacks to control its state. This allows any component in the application to trigger the auth modal.
- **Returns:** (JSX.Element) A JSX element that renders the `AuthModal`, connecting its `isOpen` and `onClose` props to the global auth context.
- **Returns:** (JSX.Element) A JSX element that renders the `AuthModalController` with the `initialModal` prop set to "login".

### Exported Types and Interfaces

#### AuthModalProps
- **Description:** Defines the props for the `AuthModal` component.
- **Key Fields:**
  - `isOpen` (boolean): Controls whether the modal is open or closed.
  - `onClose` (() => void): A function to be called when the modal should be closed.
  - `onRegistrationSuccess?` (() => void): An optional callback to be executed upon successful user registration.

### Exported Types and Interfaces

#### AuthTestResult
- **Description:** Defines the shape of an object that holds the result of a single authentication test scenario.
- **Key Fields:**
  - `testName` (string): The name of the test (e.g., "Email/Password Registration").
  - `passed` (boolean): `true` if the test passed, `false` otherwise.
  - `details` (string): A brief description of the test's outcome.

## `src/app/api/auth/verify-otp/route.ts`

### Functions and Methods

#### POST
- **Description:** This function handles the verification of a One-Time Password (OTP) submitted by a user. It validates the phone number and OTP code, then calls `OTPManager.verifyOTPCode` to check if the code is correct, not expired, and has not been used before.
- **Parameters:**
  - `request` (NextRequest): The incoming Next.js API request object, which should contain the `phoneNumber` and `otpCode` in the JSON body.
- **Returns:** (NextResponse) A `NextResponse` object. On successful verification, it returns a JSON object with `success: true` and a success message. On failure, it returns a JSON object with `success: false` and a specific error message in Hebrew, with a corresponding HTTP status code (400 or 500).

#### GET
- **Description:** This function handles GET requests to the verify-otp endpoint. It is not an allowed method and returns a 405 Method Not Allowed status.
- **Returns:** (NextResponse) A `NextResponse` object with an error message and a 405 status code.

## `src/app/api/auth/verify-military-id/route.ts`

### Functions and Methods

#### POST
- **Description:** This function verifies if a given military ID exists in the authorized personnel database. It takes a military ID, sanitizes it, hashes it, and then performs a direct lookup in Firestore to check for its existence.
- **Parameters:**
  - `request` (NextRequest): The incoming Next.js API request object, which should contain the `militaryId` in the JSON body.
- **Returns:** (NextResponse) A `NextResponse` object. If the military ID is found, it returns a JSON object with `success: true` and the associated personnel data. If not found or on error, it returns a JSON object with `success: false` and an error message, with a corresponding HTTP status code (400, 404, or 500).

#### GET
- **Description:** This function handles GET requests to the verify-military-id endpoint. It is not an allowed method and returns a 405 Method Not Allowed status.
- **Returns:** (NextResponse) A `NextResponse` object with an error message and a 405 status code.
