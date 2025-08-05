# Registration Feature Unit Tests Documentation

This document outlines comprehensive unit tests for the registration feature, covering input validation, UI navigation, backend integration, and registration logic flows.

## Table of Contents

1. [Input Validation Tests](#input-validation-tests)
2. [UI Navigation and Component Tests](#ui-navigation-and-component-tests)
3. [Backend Integration Tests](#backend-integration-tests)
4. [Registration Logic and Flow Tests](#registration-logic-and-flow-tests)
5. [Utility Function Tests](#utility-function-tests)

---

## Input Validation Tests

### Personal Number Validation (`validatePersonalNumber`)

| Test Name | Function Tested | Description | Input Values | Expected Output | Edge Cases |
|-----------|----------------|-------------|--------------|----------------|------------|
| `should validate correct personal number` | `validatePersonalNumber` | Tests valid military personal numbers | `"12345"`, `"123456"`, `"1234567"` | `{isValid: true, errorMessage: null}` | 5-7 digits |
| `should reject empty personal number` | `validatePersonalNumber` | Tests required field validation | `""`, `"   "`, `null`, `undefined` | `{isValid: false, errorMessage: "מספר אישי הוא שדה חובה"}` | Empty/whitespace |
| `should reject invalid personal number format` | `validatePersonalNumber` | Tests regex pattern validation | `"1234"`, `"12345678"`, `"abc123"`, `"123-45"` | `{isValid: false, errorMessage: "מספר אישי חייב להכיל בין 5-7 ספרות בלבד"}` | Too short/long, non-digits |
| `should handle input sanitization` | `validatePersonalNumber` | Tests trimming and cleaning | `"  12345  "`, `"\t123456\n"` | `{isValid: true, errorMessage: null}` | Whitespace around valid input |

### Email Validation (`validateEmail`)

| Test Name | Function Tested | Description | Input Values | Expected Output | Edge Cases |
|-----------|----------------|-------------|--------------|----------------|------------|
| `should validate correct email formats` | `validateEmail` | Tests valid email addresses | `"user@example.com"`, `"test.email+tag@domain.co.il"` | `{isValid: true, errorMessage: null}` | Standard email formats |
| `should reject empty email` | `validateEmail` | Tests required field validation | `""`, `"   "`, `null` | `{isValid: false, errorMessage: "כתובת אימייל היא שדה חובה"}` | Empty values |
| `should reject invalid email formats` | `validateEmail` | Tests email regex pattern | `"invalid"`, `"@domain.com"`, `"user@"`, `"user..name@domain.com"` | `{isValid: false, errorMessage: "כתובת אימייל לא תקינה"}` | Malformed emails |
| `should handle special characters in email` | `validateEmail` | Tests international and special chars | `"user+tag@domain.com"`, `"user.name@sub.domain.org"` | `{isValid: true, errorMessage: null}` | Plus signs, dots |

### Password Validation (`validatePassword`)

| Test Name | Function Tested | Description | Input Values | Expected Output | Edge Cases |
|-----------|----------------|-------------|--------------|----------------|------------|
| `should validate strong password` | `validatePassword` | Tests password complexity requirements | `"Password123!"`, `"MyStr0ng@Pass"` | `{isValid: true, errorMessage: null}` | 8+ chars, upper/lower/number/special |
| `should reject empty password` | `validatePassword` | Tests required field validation | `""`, `"   "`, `null` | `{isValid: false, errorMessage: "סיסמה היא שדה חובה"}` | Empty values |
| `should reject weak passwords` | `validatePassword` | Tests complexity requirements | `"password"`, `"12345678"`, `"PASSWORD"`, `"Pass123"` | `{isValid: false, errorMessage: "סיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר"}` | Missing requirements |
| `should handle minimum length` | `validatePassword` | Tests length requirement | `"Pass1!"` (7 chars), `"Password1!"` (10 chars) | First: invalid, Second: valid | Boundary testing |

### OTP Validation (`validateOTP`)

| Test Name | Function Tested | Description | Input Values | Expected Output | Edge Cases |
|-----------|----------------|-------------|--------------|----------------|------------|
| `should validate correct OTP format` | `validateOTP` | Tests 6-digit OTP codes | `"123456"`, `"000000"`, `"999999"` | `{isValid: true, errorMessage: null}` | Exactly 6 digits |
| `should reject incorrect OTP length` | `validateOTP` | Tests length validation | `"12345"`, `"1234567"`, `""` | `{isValid: false, errorMessage: "הקוד חייב להכיל 6 ספרות בדיוק"}` | Wrong length |
| `should reject non-numeric OTP` | `validateOTP` | Tests numeric-only requirement | `"12345a"`, `"abc123"`, `"12-34-56"` | `{isValid: false, errorMessage: "הקוד חייב להכיל 6 ספרות בדיוק"}` | Non-digits |
| `should handle leading zeros` | `validateOTP` | Tests edge case with zeros | `"000123"`, `"012345"` | `{isValid: true, errorMessage: null}` | Leading zeros |

### Phone Number Validation (`validatePhone`)

| Test Name | Function Tested | Description | Input Values | Expected Output | Edge Cases |
|-----------|----------------|-------------|--------------|----------------|------------|
| `should validate Israeli mobile numbers` | `validatePhone` | Tests Israeli phone formats | `"0521234567"`, `"+972521234567"`, `"052-123-4567"` | `{isValid: true, errorMessage: null}` | Various Israeli formats |
| `should reject empty phone number` | `validatePhone` | Tests required field validation | `""`, `"   "`, `null` | `{isValid: false, errorMessage: "מספר טלפון הוא שדה חובה"}` | Empty values |
| `should reject invalid phone formats` | `validatePhone` | Tests phone regex pattern | `"123456789"`, `"0521234"`, `"+1234567890"` | `{isValid: false, errorMessage: "מספר טלפון לא תקין"}` | Non-Israeli formats |

### Gender Validation (`validateGender`)

| Test Name | Function Tested | Description | Input Values | Expected Output | Edge Cases |
|-----------|----------------|-------------|--------------|----------------|------------|
| `should validate selected gender` | `validateGender` | Tests gender selection | `"male"`, `"female"`, `"other"` | `{isValid: true, errorMessage: null}` | Valid options |
| `should reject empty gender selection` | `validateGender` | Tests required field validation | `""`, `"   "`, `null` | `{isValid: false, errorMessage: "בחירת מין היא שדה חובה"}` | No selection |

### Birthdate Validation (`validateBirthdate`)

| Test Name | Function Tested | Description | Input Values | Expected Output | Edge Cases |
|-----------|----------------|-------------|--------------|----------------|------------|
| `should validate correct birthdate for adults` | `validateBirthdate` | Tests valid adult birthdates | `"1990-01-01"`, `"2000-12-31"` | `{isValid: true, errorMessage: null}` | 18+ years old |
| `should reject empty birthdate` | `validateBirthdate` | Tests required field validation | `""`, `"   "`, `null` | `{isValid: false, errorMessage: "תאריך לידה הוא שדה חובה"}` | Empty values |
| `should reject future dates` | `validateBirthdate` | Tests future date validation | Tomorrow's date | `{isValid: false, errorMessage: "תאריך לידה לא תקין"}` | Future dates |
| `should reject underage birthdates` | `validateBirthdate` | Tests minimum age requirement | 17 years ago date | `{isValid: false, errorMessage: "תאריך לידה לא תקין"}` | Under 18 |
| `should handle invalid date formats` | `validateBirthdate` | Tests date parsing | `"invalid-date"`, `"32/13/2000"` | `{isValid: false, errorMessage: "תאריך לידה לא תקין"}` | Malformed dates |

### Consent Validation (`validateConsent`)

| Test Name | Function Tested | Description | Input Values | Expected Output | Edge Cases |
|-----------|----------------|-------------|--------------|----------------|------------|
| `should validate accepted consent` | `validateConsent` | Tests consent checkbox checked | `true` | `{isValid: true, errorMessage: null}` | Terms accepted |
| `should reject unaccepted consent` | `validateConsent` | Tests consent checkbox unchecked | `false` | `{isValid: false, errorMessage: "יש לאשר את תנאי השימוש"}` | Terms not accepted |

---

## UI Navigation and Component Tests

### RegistrationModal Component

| Test Name | Component Tested | Description | Input/Scenario | Expected Behavior | Edge Cases |
|-----------|-----------------|-------------|----------------|-------------------|------------|
| `should render modal when open` | `RegistrationModal` | Tests modal visibility | `isOpen={true}` | Modal renders with backdrop and form | Initial state |
| `should not render when closed` | `RegistrationModal` | Tests modal hidden state | `isOpen={false}` | Returns null, no DOM elements | Closed state |
| `should reset form state on close` | `RegistrationModal` | Tests state cleanup | Click close button | `personalNumber` reset to `""`, `onClose` called | State cleanup |
| `should reset form state on switch` | `RegistrationModal` | Tests state cleanup on switch | Click switch to login | `personalNumber` reset to `""`, `onSwitch` called | Navigation cleanup |
| `should close modal on backdrop click` | `RegistrationModal` | Tests backdrop interaction | Click outside modal | `onClose` called | User interaction |

### RegistrationForm Component

| Test Name | Component Tested | Description | Input/Scenario | Expected Behavior | Edge Cases |
|-----------|-----------------|-------------|----------------|-------------------|------------|
| `should start with personal-number step` | `RegistrationForm` | Tests initial step state | Component mount | `currentStep` is `'personal-number'` | Initial state |
| `should show validation error for invalid input` | `RegistrationForm` | Tests real-time validation | Enter invalid personal number | Error message displayed, button disabled | Input validation |
| `should enable verify button for valid input` | `RegistrationForm` | Tests validation state | Enter valid personal number | No error, verify button enabled | Valid state |
| `should progress to OTP step on verification` | `RegistrationForm` | Tests step navigation | Click verify with valid input | `currentStep` changes to `'otp'` | Flow progression |
| `should handle input sanitization` | `RegistrationForm` | Tests input cleaning | Enter `"123abc45"` | Input becomes `"12345"` | Non-digit removal |
| `should navigate back from OTP step` | `RegistrationForm` | Tests backward navigation | Call `onBack` from OTP step | `currentStep` returns to `'personal-number'` | Step navigation |

### RegistrationHeader Component

| Test Name | Component Tested | Description | Input/Scenario | Expected Behavior | Edge Cases |
|-----------|-----------------|-------------|----------------|-------------------|------------|
| `should render header with title` | `RegistrationHeader` | Tests header content | Component render | Shows "הרשמה למערכת" title | Content display |
| `should call onBack when back button clicked` | `RegistrationHeader` | Tests back button functionality | Click back arrow | `onBack` function called | Button interaction |
| `should call onClose when close button clicked` | `RegistrationHeader` | Tests close button functionality | Click X button | `onClose` function called | Button interaction |
| `should have proper accessibility labels` | `RegistrationHeader` | Tests accessibility | Component render | Proper `aria-label` attributes present | Accessibility |

### OTPVerificationStep Component

| Test Name | Component Tested | Description | Input/Scenario | Expected Behavior | Edge Cases |
|-----------|-----------------|-------------|----------------|-------------------|------------|
| `should display masked phone number` | `OTPVerificationStep` | Tests phone masking | `phoneNumber="0521234567"` | Shows `"052-***4567"` | Phone masking |
| `should focus input on mount` | `OTPVerificationStep` | Tests auto-focus | Component mount | OTP input has focus | UX enhancement |
| `should limit input to 6 digits` | `OTPVerificationStep` | Tests input constraints | Type `"1234567890"` | Input value is `"123456"` | Input limiting |
| `should auto-verify on 6 valid digits` | `OTPVerificationStep` | Tests auto-verification | Enter valid 6-digit code | `onVerifySuccess` called automatically | Auto-submit |
| `should show validation error for invalid OTP` | `OTPVerificationStep` | Tests validation display | Enter invalid OTP | Error message displayed | Error handling |
| `should clear errors on input change` | `OTPVerificationStep` | Tests error clearing | Type after backend error | Backend error cleared | Error management |
| `should handle resend code functionality` | `OTPVerificationStep` | Tests resend feature | Click resend button | Input cleared, errors cleared, focus restored | Resend flow |

### RegistrationDetailsStep Component

| Test Name | Component Tested | Description | Input/Scenario | Expected Behavior | Edge Cases |
|-----------|-----------------|-------------|----------------|-------------------|------------|
| `should display pre-filled readonly fields` | `RegistrationDetailsStep` | Tests readonly data display | Props: firstName, lastName, phoneNumber | Fields populated and readonly | Data display |
| `should validate all fields in real-time` | `RegistrationDetailsStep` | Tests form validation | Enter invalid data in any field | Corresponding error messages shown | Validation |
| `should enable submit button only when form valid` | `RegistrationDetailsStep` | Tests submit state | All fields valid vs. any invalid | Button enabled/disabled accordingly | Submit control |
| `should toggle password visibility` | `RegistrationDetailsStep` | Tests password toggle | Click show/hide password button | Password field type changes | UX feature |
| `should handle form submission` | `RegistrationDetailsStep` | Tests form submit | Click submit with valid form | `onSubmit` called with form data | Data submission |
| `should update form validation on field changes` | `RegistrationDetailsStep` | Tests reactive validation | Change any form field | Validation updates immediately | Real-time updates |

### RegistrationSuccessStep Component

| Test Name | Component Tested | Description | Input/Scenario | Expected Behavior | Edge Cases |
|-----------|-----------------|-------------|----------------|-------------------|------------|
| `should display success message` | `RegistrationSuccessStep` | Tests success display | Component render | Success checkmark and message shown | Success state |
| `should handle continue button click` | `RegistrationSuccessStep` | Tests continue action | Click continue button | `onContinue` function called | Flow completion |

---

## Backend Integration Tests

### Personal Number Verification

| Test Name | Function/Flow Tested | Description | Input/Scenario | Expected Behavior | Error Cases |
|-----------|---------------------|-------------|----------------|------------------|-------------|
| `should verify valid personal number` | Personal number verification API | Tests backend verification | Valid personal number | Returns user data (name, phone) | Success case |
| `should handle unregistered personal number` | Personal number verification API | Tests unauthorized user | Invalid/unregistered number | Returns error message | Authorization failure |
| `should handle network errors` | Personal number verification API | Tests network failure | Valid input, network down | Returns network error message | Network issues |
| `should handle server errors` | Personal number verification API | Tests server failure | Valid input, server error | Returns server error message | Server issues |

### OTP Sending and Verification

| Test Name | Function/Flow Tested | Description | Input/Scenario | Expected Behavior | Error Cases |
|-----------|---------------------|-------------|----------------|------------------|-------------|
| `should send OTP to verified phone` | OTP sending service | Tests OTP delivery | Valid phone number | OTP sent successfully | SMS delivery |
| `should verify correct OTP code` | OTP verification service | Tests OTP validation | Correct 6-digit code | Verification successful | Code match |
| `should reject incorrect OTP code` | OTP verification service | Tests invalid OTP | Wrong code | Verification failed error | Code mismatch |
| `should handle expired OTP` | OTP verification service | Tests OTP expiration | Valid but expired code | Expiration error message | Time limits |
| `should handle OTP rate limiting` | OTP sending service | Tests rate limiting | Multiple rapid requests | Rate limit error | Abuse prevention |

### User Registration Completion

| Test Name | Function/Flow Tested | Description | Input/Scenario | Expected Behavior | Error Cases |
|-----------|---------------------|-------------|----------------|------------------|-------------|
| `should create user account successfully` | Firebase Auth + Firestore | Tests account creation | Valid registration data | User created in Auth + Firestore | Account creation |
| `should handle duplicate email registration` | Firebase Auth | Tests email uniqueness | Already registered email | Duplicate email error | Constraint violation |
| `should handle invalid registration data` | Registration validation | Tests data validation | Invalid form data | Validation error messages | Data validation |
| `should handle authentication service errors` | Firebase Auth | Tests service failures | Valid data, service down | Service error message | Service availability |

---

## Registration Logic and Flow Tests

### Multi-Step Flow Management

| Test Name | Flow Tested | Description | Input/Scenario | Expected Behavior | Edge Cases |
|-----------|-------------|-------------|----------------|------------------|------------|
| `should progress through all registration steps` | Complete registration flow | Tests full happy path | Valid inputs at each step | Step 1 → 2 → 3 → 4 successfully | Full flow |
| `should handle step validation barriers` | Step progression validation | Tests validation gates | Invalid input at any step | Cannot progress until valid | Validation gates |
| `should maintain form state across steps` | State persistence | Tests data retention | Navigate back and forth | Form data preserved | State management |
| `should reset form state on modal close` | State cleanup | Tests form reset | Close modal mid-flow | All form state cleared | Cleanup |
| `should handle browser back button` | Navigation handling | Tests browser navigation | Press browser back | Appropriate step navigation | Browser integration |

### Form State Management

| Test Name | Component Tested | Description | Input/Scenario | Expected Behavior | Edge Cases |
|-----------|-----------------|-------------|----------------|------------------|------------|
| `should update validation state in real-time` | Form validation | Tests reactive validation | Type in any input field | Validation updates immediately | Real-time updates |
| `should aggregate validation from all fields` | Form validation | Tests overall form state | Multiple field states | Overall form validity calculated | State aggregation |
| `should handle controlled input components` | Input management | Tests controlled components | Change input values | State updates correctly | Component control |
| `should debounce validation for performance` | Validation optimization | Tests performance | Rapid typing | Validation not called excessively | Performance |

### Auto-Verification Behaviors

| Test Name | Feature Tested | Description | Input/Scenario | Expected Behavior | Edge Cases |
|-----------|----------------|-------------|----------------|------------------|------------|
| `should auto-verify OTP on 6 digits` | OTP auto-submit | Tests automatic submission | Enter 6th digit | Verification triggered automatically | Auto-submit |
| `should not auto-verify invalid OTP` | OTP validation check | Tests validation before auto-submit | Enter 6 invalid digits | No auto-verification | Validation first |
| `should handle auto-verification errors` | Error handling | Tests auto-submit error cases | Valid format, wrong code | Error displayed appropriately | Error handling |

---

## Utility Function Tests

### Phone Number Utilities

| Test Name | Function Tested | Description | Input Values | Expected Output | Edge Cases |
|-----------|----------------|-------------|--------------|----------------|------------|
| `should mask Israeli phone numbers correctly` | `maskPhoneNumber` | Tests phone masking | `"0521234567"` | `"052-***4567"` | Standard format |
| `should handle international format` | `maskPhoneNumber` | Tests +972 format | `"+972521234567"` | `"052-***4567"` | International |
| `should handle formatted input` | `maskPhoneNumber` | Tests formatted input | `"052-123-4567"` | `"052-***4567"` | Pre-formatted |
| `should return original for invalid input` | `maskPhoneNumber` | Tests invalid input handling | `"123"`, `"invalid"` | Original string returned | Invalid input |

### Input Sanitization

| Test Name | Function Tested | Description | Input Values | Expected Output | Edge Cases |
|-----------|----------------|-------------|--------------|----------------|------------|
| `should remove non-digits from personal number` | Input sanitization | Tests digit-only filter | `"123abc45"` | `"12345"` | Mixed characters |
| `should limit OTP input length` | Input length limiting | Tests length constraints | `"1234567890"` | `"123456"` | Length limiting |
| `should trim whitespace from inputs` | Whitespace handling | Tests trimming | `"  test@email.com  "` | `"test@email.com"` | Whitespace removal |

---

## Test Implementation Notes

### Testing Framework Recommendations

- **Jest** for unit testing framework
- **React Testing Library** for component testing
- **MSW (Mock Service Worker)** for API mocking
- **userEvent** for user interaction simulation

### Common Test Patterns

#### Component Testing Pattern

```javascript
// Example test structure
describe('RegistrationForm', () => {
  it('should validate personal number input in real-time', () => {
    // Arrange: render component
    // Act: user input
    // Assert: validation result
  });
});
```

#### Validation Function Testing Pattern

```javascript
// Example validation test
describe('validatePersonalNumber', () => {
  it('should accept valid personal numbers', () => {
    const result = validatePersonalNumber('12345');
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeNull();
  });
});
```

#### Mock Setup for API Testing

```javascript
// Example API mock setup
beforeEach(() => {
  server.use(
    rest.post('/api/verify-personal-number', (req, res, ctx) => {
      return res(ctx.json({ success: true, userData: mockData }));
    })
  );
});
```

### Coverage Requirements

- **Unit Tests**: 100% coverage for validation utilities
- **Component Tests**: Full user interaction flows
- **Integration Tests**: Complete registration workflows
- **Error Handling**: All error scenarios covered

### Test Data Management

- Use consistent test data across tests
- Create factory functions for test object generation
- Mock external dependencies (Firebase, SMS services)
- Use meaningful test descriptions in Hebrew where appropriate for error messages

---

This comprehensive test suite ensures the registration feature is thoroughly validated across all functionality, user interactions, and edge cases.
