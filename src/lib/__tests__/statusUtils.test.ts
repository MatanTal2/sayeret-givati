/// <reference types="jest" />
import {
  mapRawStatusToStructured,
  mapStructuredStatusToRaw,
  getAvailableStatuses,
  StatusMapping
} from '../statusUtils'

describe('Status Utilities', () => {
  describe('mapRawStatusToStructured', () => {
    it('should map "בית" to structured format with no custom status', () => {
      const result = mapRawStatusToStructured('בית')
      
      expect(result).toEqual({
        status: 'בית',
        customStatus: undefined
      })
    })

    it('should map "משמר" to structured format with no custom status', () => {
      const result = mapRawStatusToStructured('משמר')
      
      expect(result).toEqual({
        status: 'משמר',
        customStatus: undefined
      })
    })

    it('should map custom status to "אחר" with custom status value', () => {
      const customStatus = 'חופש'
      const result = mapRawStatusToStructured(customStatus)
      
      expect(result).toEqual({
        status: 'אחר',
        customStatus: 'חופש'
      })
    })

    it('should handle empty string as custom status', () => {
      const result = mapRawStatusToStructured('')
      
      expect(result).toEqual({
        status: 'אחר',
        customStatus: ''
      })
    })

    it('should handle complex custom status strings', () => {
      const customStatus = 'חופש מחלה - 3 ימים'
      const result = mapRawStatusToStructured(customStatus)
      
      expect(result).toEqual({
        status: 'אחר',
        customStatus: 'חופש מחלה - 3 ימים'
      })
    })

    it('should be case-sensitive for standard statuses', () => {
      const result = mapRawStatusToStructured('בִיּת') // with vowels
      
      expect(result).toEqual({
        status: 'אחר',
        customStatus: 'בִיּת'
      })
    })
  })

  describe('mapStructuredStatusToRaw', () => {
    it('should return "בית" for standard home status', () => {
      const result = mapStructuredStatusToRaw('בית')
      
      expect(result).toBe('בית')
    })

    it('should return "משמר" for standard guard status', () => {
      const result = mapStructuredStatusToRaw('משמר')
      
      expect(result).toBe('משמר')
    })

    it('should return custom status for "אחר" with customStatus', () => {
      const result = mapStructuredStatusToRaw('אחר', 'חופש')
      
      expect(result).toBe('חופש')
    })

    it('should return "אחר" when status is "אחר" but no custom status provided', () => {
      const result = mapStructuredStatusToRaw('אחר')
      
      expect(result).toBe('אחר')
    })

    it('should return "אחר" when status is "אחר" and custom status is empty', () => {
      const result = mapStructuredStatusToRaw('אחר', '')
      
      expect(result).toBe('אחר')
    })

    it('should ignore customStatus for standard statuses', () => {
      const result = mapStructuredStatusToRaw('בית', 'some custom')
      
      expect(result).toBe('בית')
    })

    it('should handle complex custom status strings', () => {
      const customStatus = 'חופש מחלה - 3 ימים'
      const result = mapStructuredStatusToRaw('אחר', customStatus)
      
      expect(result).toBe('חופש מחלה - 3 ימים')
    })
  })

  describe('getAvailableStatuses', () => {
    it('should return all available status options', () => {
      const result = getAvailableStatuses()
      
      expect(result).toEqual(['בית', 'משמר', 'אחר'])
    })

    it('should return a new array each time (not reference)', () => {
      const result1 = getAvailableStatuses()
      const result2 = getAvailableStatuses()
      
      expect(result1).toEqual(result2)
      expect(result1).not.toBe(result2) // Different object references
    })

    it('should return statuses in the correct order', () => {
      const result = getAvailableStatuses()
      
      expect(result[0]).toBe('בית')
      expect(result[1]).toBe('משמר')
      expect(result[2]).toBe('אחר')
      expect(result).toHaveLength(3)
    })
  })

  describe('Integration tests', () => {
    it('should maintain consistency between mapping functions', () => {
      const testStatuses = ['בית', 'משמר', 'חופש', 'מחלה', '']
      
      testStatuses.forEach(rawStatus => {
        const structured = mapRawStatusToStructured(rawStatus)
        const backToRaw = mapStructuredStatusToRaw(structured.status, structured.customStatus)
        
        expect(backToRaw).toBe(rawStatus)
      })
    })

    it('should handle round-trip conversion for edge cases', () => {
      const edgeCases = [
        'בית בחופש', // Contains standard status as substring
        'משמר מיוחד', // Contains standard status as substring
        'אחר - מיוחד', // Contains "אחר" explicitly
      ]
      
      edgeCases.forEach(rawStatus => {
        const structured = mapRawStatusToStructured(rawStatus)
        const backToRaw = mapStructuredStatusToRaw(structured.status, structured.customStatus)
        
        expect(backToRaw).toBe(rawStatus)
      })
    })
  })
}) 