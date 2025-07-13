# Testing Plan

This document outlines the test cases for the application.

## Cache Utilities (`src/lib/cache.ts`)

- `getCachedData`
  - should return null when no cached data exists
  - should return cached data when valid and not expired
  - should remove and return null when cached data is expired
  - should handle JSON parsing errors gracefully
  - should handle localStorage errors gracefully
- `setCachedData`
  - should store data in localStorage with correct format
  - should handle localStorage errors gracefully and warn
  - should handle empty data array

## Date Utilities (`src/lib/dateUtils.ts`)

- `formatReportDate`
  - should format date in Hebrew locale with correct options
  - should handle edge case dates
- `formatReportTime`
  - should format time in Hebrew locale with 2-digit hours and minutes
  - should handle midnight time
- `formatLastUpdated`
  - should return "היום HH:MM" for today's date
  - should return "DD/MM HH:MM" for previous days
  - should handle dates from different years
- `formatCacheErrorDate`
  - should format timestamp using Hebrew locale
  - should handle edge case timestamps

## Status Utilities (`src/lib/statusUtils.ts`)

- `mapRawStatusToStructured`
  - should map "בית" to structured format with no custom status
  - should map "משמר" to structured format with no custom status
  - should map custom status to "אחר" with custom status value
  - should handle empty string as custom status
  - should handle complex custom status strings
  - should be case-sensitive for standard statuses
- `mapStructuredStatusToRaw`
  - should return "בית" for standard home status
  - should return "משמר" for standard guard status
  - should return custom status for "אחר" with customStatus
  - should return "אחר" when status is "אחר" but no custom status provided
  - should return "" when status is "אחר" and custom status is empty
  - should ignore customStatus for standard statuses
  - should handle complex custom status strings
- `getAvailableStatuses`
  - should return all available status options
  - should return a new array each time (not reference)
  - should return statuses in the correct order
- Integration tests
  - should maintain consistency between mapping functions
  - should handle round-trip conversion for edge cases

## API Routes (`src/app/api/sheets/route.ts`)

- `GET`
  - should return a 500 error if credentials are not set
  - should return a 403 error if the sheet is not accessible
  - should return the sheet data on success
- `POST`
  - should return a 400 error if no soldiers are provided
  - should return a 500 error if credentials are not set
  - should return a 403 error if the sheet is not accessible
  - should append the data to the sheet on success
- `PUT`
  - should return a 400 error if no soldiers are provided
  - should return a 500 error if credentials are not set
  - should return a 403 error if the sheet is not accessible
  - should update the sheet on success
- Error handling
  - should handle malformed JSON credentials
  - should handle network errors
  - should handle API errors
- Status mapping integration
  - should correctly map statuses when writing to the sheet
  - should handle edge cases in status mapping
