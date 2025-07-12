/// <reference types="jest" />
import { getCachedData, setCachedData } from '../cache'
import { Soldier } from '../../app/types'

const mockSoldier: Soldier = {
  id: '123456',
  firstName: 'ישראל',
  lastName: 'ישראלי',
  name: 'ישראל ישראלי',
  platoon: 'מסייעת',
  status: 'בית',
  isSelected: false,
}

describe('Cache Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('getCachedData', () => {
    it('should return null when no cached data exists', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null)
      
      const result = getCachedData()
      
      expect(result).toBeNull()
      expect(localStorage.getItem).toHaveBeenCalledWith('sayeret-givati-soldiers-data')
    })

    it('should return cached data when valid and not expired', () => {
      const testData = [mockSoldier]
      const timestamp = Date.now() - 1000 // 1 second ago
      const cachedValue = JSON.stringify({ data: testData, timestamp })
      
      ;(localStorage.getItem as jest.Mock).mockReturnValue(cachedValue)
      
      const result = getCachedData()
      
      expect(result).toEqual({ data: testData, timestamp })
    })

    it('should remove and return null when cached data is expired', () => {
      const testData = [mockSoldier]
      const expiredTimestamp = Date.now() - (13 * 60 * 60 * 1000) // 13 hours ago (expired)
      const cachedValue = JSON.stringify({ data: testData, timestamp: expiredTimestamp })
      
      ;(localStorage.getItem as jest.Mock).mockReturnValue(cachedValue)
      
      const result = getCachedData()
      
      expect(result).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalledWith('sayeret-givati-soldiers-data')
    })

    it('should handle JSON parsing errors gracefully', () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue('invalid-json')
      
      const result = getCachedData()
      
      expect(result).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalledWith('sayeret-givati-soldiers-data')
    })

    it('should handle localStorage errors gracefully', () => {
      ;(localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const result = getCachedData()
      
      expect(result).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalledWith('sayeret-givati-soldiers-data')
    })
  })

  describe('setCachedData', () => {
    it('should store data in localStorage with correct format', () => {
      const testData = [mockSoldier]
      const timestamp = Date.now()
      
      setCachedData(testData, timestamp)
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'sayeret-givati-soldiers-data',
        JSON.stringify({ data: testData, timestamp })
      )
    })

    it('should handle localStorage errors gracefully and warn', () => {
      const testData = [mockSoldier]
      const timestamp = Date.now()
      
      ;(localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage full')
      })
      
      setCachedData(testData, timestamp)
      
      expect(console.warn).toHaveBeenCalledWith('Failed to cache data:', expect.any(Error))
    })

    it('should handle empty data array', () => {
      const testData: Soldier[] = []
      const timestamp = Date.now()
      
      setCachedData(testData, timestamp)
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'sayeret-givati-soldiers-data',
        JSON.stringify({ data: testData, timestamp })
      )
    })
  })
}) 