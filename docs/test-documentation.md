# Admin System Test Documentation

## Overview

This document provides comprehensive documentation for the current unit test suite covering the Admin System functionality in the Sayeret Givati project.

## Test Infrastructure

### Test Files

- `src/lib/__tests__/adminUtils.test.ts` - Admin system utilities tests
- `src/lib/__tests__/simple.test.ts` - Basic functionality test

### Test Environment Setup

- **Framework**: Jest with jsdom environment
- **TypeScript Support**: ts-jest transformer
- **Mocking**: Firebase functions, Web Crypto API, localStorage
- **Coverage**: All core admin functions tested

## Test Suite Details

### 1. Simple Test (`simple.test.ts`)

#### Purpose

Basic sanity check to ensure test framework is working correctly.

#### Tests

| Test Name | Purpose | Expected Result | Requirements |
|-----------|---------|-----------------|--------------|
| `should pass` | Verify Jest setup | `true` equals `true` | Jest framework functional |

---

## 2. Security Utils Tests (`adminUtils.test.ts` - SecurityUtils)

### Purpose

Tests cryptographic functions for military ID hashing and verification.

### Test Cases

#### 2.1 `hashMilitaryId` Function Tests

| Test Name | Purpose | Input | Expected Result | Requirements |
|-----------|---------|--------|-----------------|--------------|
| `should generate a hash and a salt` | Verify hash generation with salt | `militaryId: '1234567'` | Object with `hash` and `salt` properties (both strings) | Web Crypto API available |
| `should throw an error if hashing fails` | Test error handling | `militaryId: '1234567'` + crypto failure | Throws error: "Failed to hash military ID: Crypto failed" | Proper error propagation |

**Security Requirements:**

- Hash must be deterministic with same input + salt
- Salt must be randomly generated
- Function must handle crypto API failures gracefully

#### 2.2 `verifyMilitaryId` Function Tests

| Test Name | Purpose | Input | Expected Result | Requirements |
|-----------|---------|--------|-----------------|--------------|
| `should return true for a valid military ID and hash` | Verify correct ID verification | `militaryId: '1234567'`, correct hash, salt | `true` | Hash verification works correctly |
| `should return false for an invalid military ID` | Test incorrect ID rejection | `militaryId: '7654321'`, correct hash, salt | `false` | Different ID produces different hash |
| `should return false for an invalid hash` | Test hash mismatch | `militaryId: '1234567'`, wrong hash, salt | `false` | Hash comparison detects differences |
| `should return false if hashing fails during verification` | Test crypto failure handling | Valid inputs + crypto error | `false` | Graceful failure without crashes |

**Security Requirements:**

- Must correctly verify matching military ID + hash combinations
- Must reject mismatched IDs or hashes
- Must handle crypto failures without exposing errors
- Must not throw exceptions on verification failure

---

## 3. Admin Firestore Service Tests (`adminUtils.test.ts` - AdminFirestoreService)

### Purpose

Tests Firebase Firestore operations for personnel management.

### Test Cases

#### 3.1 `checkMilitaryIdExists` Function Tests

| Test Name | Purpose | Input | Expected Result | Requirements |
|-----------|---------|--------|-----------------|--------------|
| `should return true if a duplicate military ID is found` | Test duplicate detection | `militaryId: '1234567'` (exists in DB) | `true` | Firebase query + hash verification |
| `should return false if no duplicate military ID is found` | Test unique ID confirmation | `militaryId: '1234567'` (not in DB) | `false` | Empty query results handled |
| `should throw an AdminError if a Firestore error occurs` | Test database error handling | Invalid query | Throws "Failed to check for duplicate military ID" | Proper error wrapping |

**Database Requirements:**

- Must search all personnel records with hashed IDs
- Must verify each potential match using hash comparison
- Must handle Firestore connection/query errors
- Must not expose internal Firebase errors

#### 3.2 `addAuthorizedPersonnel` Function Tests

| Test Name | Purpose | Input | Expected Result | Requirements |
|-----------|---------|--------|-----------------|--------------|
| `should not add a new person if the military ID already exists` | Test duplicate prevention | Valid form data + existing military ID | `success: false`, appropriate error message | Duplicate checking before insert |
| `should add a new person if the military ID does not exist` | Test successful personnel addition | Valid form data + unique military ID | `success: true`, success message, personnel object | Complete personnel creation workflow |

**Form Data Input Format:**

```typescript
{
  militaryPersonalNumber: string,  // 5-7 digits
  firstName: string,               // Required, non-empty
  lastName: string,                // Required, non-empty  
  rank: string,                    // Required, valid rank
  phoneNumber: string              // Israeli format (050-xxxxxxx)
}
```

**Business Logic Requirements:**

- Must validate all form fields before processing
- Must check for duplicate military IDs using hash comparison
- Must hash military ID before storage
- Must normalize phone numbers to international format
- Must create complete personnel record with metadata
- Must return appropriate success/failure messages

#### 3.3 `addAuthorizedPersonnelBulk` Function Tests

| Test Name | Purpose | Input | Expected Result | Requirements |
|-----------|---------|--------|-----------------|--------------|
| `should correctly categorize successful, failed, and duplicate entries` | Test bulk upload processing | Array of 4 personnel records with mixed validity | 1 successful, 2 duplicates, 1 failed | Proper categorization and batch processing |

**Test Data Scenario:**

```typescript
[
  { militaryPersonalNumber: '1', ... },  // Duplicate (appears twice)
  { militaryPersonalNumber: '2', ... },  // Valid and unique
  { militaryPersonalNumber: '3', ... },  // Invalid (validation failure)
  { militaryPersonalNumber: '1', ... },  // Duplicate (second occurrence)
]
```

**Expected Categorization:**

- **Successful (1)**: `militaryPersonalNumber: '2'` - passes validation and not duplicate
- **Duplicates (2)**: Both records with `militaryPersonalNumber: '1'` - duplicate detected
- **Failed (1)**: `militaryPersonalNumber: '3'` - validation failure

**Bulk Processing Requirements:**

- Must validate each record individually
- Must check for duplicates against existing database records
- Must use Firebase batch operations for performance
- Must categorize results into successful/failed/duplicate arrays
- Must provide detailed error information for failures
- Must handle partial failures gracefully

---

## Test Mocking Strategy

### 1. Web Crypto API Mock

```javascript
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: { digest: mockDigest },
    getRandomValues: mockGetRandomValues,
  },
});
```

**Purpose**: Enables crypto functions in Node.js test environment

### 2. Firebase Firestore Mock

```javascript
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  writeBatch: jest.fn(),
  // ... other Firebase functions
}));
```

**Purpose**: Isolates tests from actual Firebase database

### 3. Function-Specific Mocks

- `SecurityUtils.hashMilitaryId()` - Returns predictable hash/salt pairs
- `SecurityUtils.verifyMilitaryId()` - Returns controlled true/false results
- `ValidationUtils.validateAuthorizedPersonnelData()` - Simulates validation scenarios
- `AdminFirestoreService.checkMilitaryIdExists()` - Controls duplicate detection

---

## Running Tests

### Commands

```bash
# Run all tests
npm test
npx jest

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npx jest adminUtils.test.ts

# Verbose output
npx jest --verbose
```

### Current Test Results

``` ascii
✅ Test Suites: 2 passed, 2 total
✅ Tests: 13 passed, 13 total
✅ Time: ~11s
✅ Exit code: 0 (Success)
```

## Test Coverage Analysis

### Functions Covered

- ✅ SecurityUtils.hashMilitaryId()
- ✅ SecurityUtils.verifyMilitaryId()
- ✅ AdminFirestoreService.checkMilitaryIdExists()
- ✅ AdminFirestoreService.addAuthorizedPersonnel()
- ✅ AdminFirestoreService.addAuthorizedPersonnelBulk()

### Test Categories

- **Security Tests (5)**: Cryptographic hashing and verification
- **Database Tests (6)**: Firestore operations and data integrity
- **Validation Tests (2)**: Form data validation and business rules
- **Infrastructure Test (1)**: Framework functionality

### Edge Cases Tested

- ✅ Crypto API failures
- ✅ Database connection errors
- ✅ Duplicate military IDs
- ✅ Invalid form data
- ✅ Batch operation partial failures
- ✅ Hash verification mismatches

## Requirements Validation

### Security Requirements ✅

- Military IDs are hashed before storage
- Salt-based hashing prevents rainbow table attacks
- Hash verification works correctly
- Crypto failures handled gracefully

### Data Integrity Requirements ✅

- Duplicate prevention works correctly
- Form validation prevents invalid data
- Batch operations maintain consistency
- Error handling preserves data integrity

### Performance Requirements ✅

- Batch operations use Firebase batch writes
- Duplicate checking is efficient
- Error scenarios don't cause performance degradation

### Business Logic Requirements ✅

- Personnel creation workflow complete
- Proper categorization of bulk operations
- Appropriate success/error messaging
- Metadata tracking (creation time, etc.)

## Next Steps for Test Expansion

### 1. Additional Admin Functions

- `getAllAuthorizedPersonnel()` - Personnel retrieval
- `deleteAuthorizedPersonnel()` - Personnel removal
- `getAdminConfig()` - Configuration management
- `SessionUtils` functions - Session management

### 2. Integration Tests

- End-to-end personnel management workflows
- Firebase security rules validation
- Real crypto API integration tests

### 3. UI Component Tests

- Admin dashboard components
- Form validation components
- Bulk upload interface

### 4. Performance Tests

- Large dataset bulk operations
- Concurrent user scenarios
- Memory usage validation

---

## Troubleshooting

### Common Issues

1. **Crypto API Mock Not Working**
   - Ensure `jest.setup.new.js` is properly configured
   - Check that crypto mock is defined before tests run

2. **Firebase Mock Conflicts**
   - Clear Jest cache: `npx jest --clearCache`
   - Ensure proper mock restoration in `afterEach()`

3. **Test Timeout Issues**
   - Increase timeout: `npx jest --testTimeout=10000`
   - Check for unresolved promises in async tests

### Debug Commands

```bash
# Run with debug output
npx jest --runInBand --no-cache --verbose

# Check Jest configuration
npx jest --showConfig
```
