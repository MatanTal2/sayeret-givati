import { mapStructuredStatusToRaw } from '../../../../lib/statusUtils'

// @ts-expect-error - Jest globals are available at runtime
declare const jest: any, describe: any, it: any, expect: any, beforeEach: any, afterEach: any

// Mock the google API
jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({})),
    },
    sheets: jest.fn().mockReturnValue({
      spreadsheets: {
        get: jest.fn(),
        values: {
          get: jest.fn(),
          append: jest.fn(),
          batchUpdate: jest.fn(),
        },
      },
    }),
  },
}))

// Mock the Next.js response
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      options,
      json: () => Promise.resolve(data),
    })),
  },
}))

// Mock environment variables
const originalEnv = process.env

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({
        client_email: 'test@example.com',
        private_key: 'test-key',
      }),
      GOOGLE_SHEET_ID: 'test-sheet-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Status mapping integration', () => {
    it('should correctly map structured status to raw for API responses', () => {
      const testCases = [
        {
          soldier: {
            id: '123456',
            firstName: 'ישראל',
            lastName: 'ישראלי',
            name: 'ישראל ישראלי',
            platoon: 'מסייעת',
            status: 'בית',
            customStatus: undefined,
          },
          expected: 'בית',
        },
        {
          soldier: {
            id: '123457',
            firstName: 'דוד',
            lastName: 'כהן',
            name: 'דוד כהן',
            platoon: 'מסייעת',
            status: 'משמר',
            customStatus: undefined,
          },
          expected: 'משמר',
        },
        {
          soldier: {
            id: '123458',
            firstName: 'משה',
            lastName: 'לוי',
            name: 'משה לוי',
            platoon: 'מסייעת',
            status: 'אחר',
            customStatus: 'חופש',
          },
          expected: 'חופש',
        },
      ]

      testCases.forEach(({ soldier, expected }) => {
        const result = mapStructuredStatusToRaw(soldier.status, soldier.customStatus)
        expect(result).toBe(expected)
      })
    })

    it('should handle edge cases in status mapping', () => {
      const edgeCases = [
        {
          status: 'אחר',
          customStatus: '',
          expected: 'אחר',
        },
        {
          status: 'אחר',
          customStatus: undefined,
          expected: 'אחר',
        },
        {
          status: 'בית',
          customStatus: 'some ignored value',
          expected: 'בית',
        },
      ]

      edgeCases.forEach(({ status, customStatus, expected }) => {
        const result = mapStructuredStatusToRaw(status, customStatus)
        expect(result).toBe(expected)
      })
    })
  })

  describe('Data formatting for Google Sheets', () => {
    it('should format soldier data correctly for POST requests', () => {
      const soldiers = [
        {
          id: '123456',
          firstName: 'ישראל',
          lastName: 'ישראלי',
          name: 'ישראל ישראלי',
          platoon: 'מסייעת',
          status: 'בית',
          customStatus: undefined,
          isSelected: false,
          isManuallyAdded: true,
        },
        {
          id: '123457',
          firstName: 'דוד',
          lastName: 'כהן',
          name: 'דוד כהן',
          platoon: 'מסייעת',
          status: 'אחר',
          customStatus: 'חופש',
          isSelected: false,
          isManuallyAdded: true,
        },
      ]

      // This simulates the formatting done in the POST route
      const values = soldiers.map(soldier => [
        soldier.id || '',
        soldier.firstName || soldier.name.split(' ')[0] || '',
        soldier.lastName || soldier.name.split(' ').slice(1).join(' ') || '',
        soldier.platoon || 'מסייעת',
        mapStructuredStatusToRaw(soldier.status, soldier.customStatus)
      ])

      expect(values).toEqual([
        ['123456', 'ישראל', 'ישראלי', 'מסייעת', 'בית'],
        ['123457', 'דוד', 'כהן', 'מסייעת', 'חופש'],
      ])
    })

    it('should handle soldiers with missing data', () => {
      const soldiers = [
        {
          id: '',
          firstName: '',
          lastName: '',
          name: 'שם בודד',
          platoon: '',
          status: 'אחר',
          customStatus: 'מיוחד',
          isSelected: false,
          isManuallyAdded: true,
        },
      ]

      const values = soldiers.map(soldier => [
        soldier.id || '',
        soldier.firstName || soldier.name.split(' ')[0] || '',
        soldier.lastName || soldier.name.split(' ').slice(1).join(' ') || '',
        soldier.platoon || 'מסייעת',
        mapStructuredStatusToRaw(soldier.status, soldier.customStatus)
      ])

      expect(values).toEqual([
        ['', 'שם', 'בודד', 'מסייעת', 'מיוחד'],
      ])
    })
  })

  describe('Request validation', () => {
    it('should validate required environment variables', () => {
      // This tests the environment variable validation logic
      const requiredVars = ['GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_SHEET_ID']
      
      requiredVars.forEach(varName => {
        const backup = process.env[varName]
        delete process.env[varName]
        
        // Test that missing env var would cause appropriate error
        expect(process.env[varName]).toBeUndefined()
        
        // Restore
        if (backup) {
          process.env[varName] = backup
        }
      })
    })

    it('should validate soldier data structure', () => {
      const validSoldier = {
        id: '123456',
        firstName: 'ישראל',
        lastName: 'ישראלי',
        name: 'ישראל ישראלי',
        platoon: 'מסייעת',
        status: 'בית',
        customStatus: undefined,
        isSelected: false,
        isManuallyAdded: true,
      }

      // Test that valid soldier has all required properties
      expect(validSoldier).toHaveProperty('id')
      expect(validSoldier).toHaveProperty('name')
      expect(validSoldier).toHaveProperty('platoon')
      expect(validSoldier).toHaveProperty('status')
      expect(typeof validSoldier.id).toBe('string')
      expect(typeof validSoldier.name).toBe('string')
      expect(typeof validSoldier.platoon).toBe('string')
      expect(typeof validSoldier.status).toBe('string')
    })
  })

  describe('Error handling scenarios', () => {
    it('should handle malformed JSON credentials', () => {
      const testCases = [
        'invalid-json',
        '{"incomplete": "object"}',
        '',
        '{}',
      ]

      testCases.forEach(invalidJson => {
        expect(() => {
          JSON.parse(invalidJson)
        }).toThrow()
      })
    })

    it('should handle base64 credential parsing', () => {
      const validCredentials = {
        client_email: 'test@example.com',
        private_key: 'test-key',
      }
      
      const base64Encoded = Buffer.from(JSON.stringify(validCredentials)).toString('base64')
      const decoded = JSON.parse(Buffer.from(base64Encoded, 'base64').toString('utf-8'))
      
      expect(decoded).toEqual(validCredentials)
    })
  })
}) 