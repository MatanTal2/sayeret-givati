# Testing Setup and Documentation

## Overview

This document outlines the comprehensive unit testing setup added to the Sayeret Givati project. The tests cover all refactored utility functions and core business logic.

## Test Infrastructure

### Dependencies Added

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^14.2.1", 
    "@testing-library/user-event": "^14.5.2",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Configuration Files

- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Global test setup and mocks
- `tsconfig.json` - Updated to include test files

## Test Structure

### Utility Function Tests

#### 1. Cache Utilities (`src/lib/__tests__/cache.test.ts`)

Tests for localStorage-based caching system:

**Functions Tested:**
- `getCachedData()` - Retrieval with TTL validation
- `setCachedData()` - Storage with error handling

**Test Coverage:**
- ✅ Valid data retrieval
- ✅ Expired data cleanup  
- ✅ JSON parsing error handling
- ✅ localStorage error graceful handling
- ✅ Empty data storage
- ✅ Storage quota exceeded scenarios

#### 2. Date Utilities (`src/lib/__tests__/dateUtils.test.ts`)

Tests for Hebrew date/time formatting:

**Functions Tested:**
- `formatReportDate()` - Hebrew locale date formatting
- `formatReportTime()` - Hebrew locale time formatting  
- `formatLastUpdated()` - Smart relative date display
- `formatCacheErrorDate()` - Error message timestamps

**Test Coverage:**
- ✅ Hebrew locale formatting validation
- ✅ Jerusalem timezone handling
- ✅ Today vs. previous days logic
- ✅ Edge cases (midnight, year boundaries)
- ✅ Function parameter validation

#### 3. Status Utilities (`src/lib/__tests__/statusUtils.test.ts`)

Tests for soldier status mapping logic:

**Functions Tested:**
- `mapRawStatusToStructured()` - Convert sheet data to app format
- `mapStructuredStatusToRaw()` - Convert app data to sheet format
- `getAvailableStatuses()` - Status options provider

**Test Coverage:**
- ✅ Standard status mapping (בית, משמר)
- ✅ Custom status handling (אחר with customStatus)
- ✅ Round-trip conversion consistency
- ✅ Edge cases (empty strings, case sensitivity)
- ✅ Integration between mapping functions

### API Route Tests (`src/app/api/sheets/__tests__/route.test.ts`)

Tests for Google Sheets API integration:

**Test Coverage:**
- ✅ Status mapping integration with API
- ✅ Data formatting for Google Sheets
- ✅ Request validation logic
- ✅ Environment variable validation
- ✅ Error handling scenarios
- ✅ Credential parsing (JSON/Base64)

### Type Definition Tests (`src/app/types/__tests__/types.test.ts`)

Tests for TypeScript interface validation:

**Test Coverage:**
- ✅ Required field validation
- ✅ Optional field handling (customStatus, notes, isManuallyAdded)
- ✅ Different status combinations
- ✅ Array operations
- ✅ Edge cases (names, platoons)

## Running Tests

### Installation

First, install the testing dependencies:

```bash
npm install
```

### Basic Test Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test-Specific Commands

```bash
# Run only cache tests
npm test -- cache.test.ts

# Run only utility tests
npm test -- src/lib/__tests__/

# Run with verbose output
npm test -- --verbose
```

## Test Organization

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── cache.test.ts
│   │   ├── dateUtils.test.ts
│   │   └── statusUtils.test.ts
│   ├── cache.ts
│   ├── dateUtils.ts
│   └── statusUtils.ts
├── app/
│   ├── api/sheets/__tests__/
│   │   └── route.test.ts
│   └── types/__tests__/
│       └── types.test.ts
└── types/
    └── jest.d.ts
```

## Mocking Strategy

### Global Mocks (jest.setup.js)

```javascript
// localStorage mock
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

// navigator.clipboard mock
Object.assign(navigator, {
  clipboard: { writeText: jest.fn() }
})

// Console methods mocked to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(), 
  error: jest.fn(),
}
```

### Module-Specific Mocks

- **googleapis**: Mocked Google Sheets API
- **next/server**: Mocked NextResponse for API testing
- **Environment variables**: Controlled test environment

## Coverage Goals

Current coverage thresholds:

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80, 
    lines: 80,
    statements: 80
  }
}
```

## Test Principles

### 1. Unit Test Isolation
- Each test focuses on a single function
- Dependencies are mocked
- No external API calls in unit tests

### 2. Comprehensive Edge Cases  
- Empty/null inputs
- Error conditions
- Boundary values
- Hebrew text handling

### 3. Business Logic Validation
- Status mapping consistency
- Date formatting accuracy
- Cache TTL behavior
- Data persistence

### 4. Type Safety
- TypeScript interface compliance
- Required vs optional fields
- Array operations

## Troubleshooting

### Common Issues

1. **Jest types not found**
   ```bash
   npm install --save-dev @types/jest
   ```

2. **Test timeout**
   ```bash
   npm test -- --testTimeout=10000
   ```

3. **Cache between tests**
   ```bash
   npm test -- --clearCache
   ```

### Debug Mode

```bash
# Run with Node debugger
npm test -- --runInBand --no-cache
```

## Next Steps

### Additional Test Areas

1. **Custom Hooks Testing**
   - useDebounce hook
   - useSoldierData hook
   - Form validation hooks

2. **Component Testing**
   - UI component rendering
   - User interaction testing
   - Accessibility testing

3. **Integration Testing**
   - Full API workflow testing
   - End-to-end user scenarios

4. **Performance Testing**
   - Large dataset handling
   - Memory usage validation
   - Rendering performance

## Continuous Integration

Add to CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Conclusion

The testing infrastructure provides comprehensive coverage of all utility functions and core business logic. Tests are designed to be:

- **Fast**: Unit tests run in milliseconds
- **Reliable**: Consistent results across environments  
- **Maintainable**: Clear structure and naming
- **Comprehensive**: Edge cases and error scenarios covered

This foundation ensures code quality and prevents regressions as the application evolves. 