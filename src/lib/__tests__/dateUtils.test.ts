/// <reference types="jest" />
import {
  formatReportDate,
  formatReportTime,
  formatLastUpdated,
  formatCacheErrorDate
} from '../dateUtils'

describe('Date Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('formatReportDate', () => {
    it('should format date in Hebrew locale with correct options', () => {
      const testDate = new Date('2024-01-15T10:30:00Z')
      
      // Mock toLocaleDateString to verify it's called with correct parameters
      const mockToLocaleDateString = jest.spyOn(testDate, 'toLocaleDateString')
      mockToLocaleDateString.mockReturnValue('יום ב\', 15.1.2024')
      
      const result = formatReportDate(testDate)
      
      expect(mockToLocaleDateString).toHaveBeenCalledWith('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'Asia/Jerusalem'
      })
      expect(result).toBe('יום ב\', 15.1.2024')
      
      mockToLocaleDateString.mockRestore()
    })

    it('should handle edge case dates', () => {
      const testDate = new Date('2024-12-31T23:59:59Z')
      
      const mockToLocaleDateString = jest.spyOn(testDate, 'toLocaleDateString')
      mockToLocaleDateString.mockReturnValue('יום ג\', 31.12.2024')
      
      const result = formatReportDate(testDate)
      
      expect(result).toBe('יום ג\', 31.12.2024')
      mockToLocaleDateString.mockRestore()
    })
  })

  describe('formatReportTime', () => {
    it('should format time in Hebrew locale with 2-digit hours and minutes', () => {
      const testDate = new Date('2024-01-15T10:30:00Z')
      
      const mockToLocaleTimeString = jest.spyOn(testDate, 'toLocaleTimeString')
      mockToLocaleTimeString.mockReturnValue('10:30')
      
      const result = formatReportTime(testDate)
      
      expect(mockToLocaleTimeString).toHaveBeenCalledWith('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jerusalem'
      })
      expect(result).toBe('10:30')
      
      mockToLocaleTimeString.mockRestore()
    })

    it('should handle midnight time', () => {
      const testDate = new Date('2024-01-15T00:00:00Z')
      
      const mockToLocaleTimeString = jest.spyOn(testDate, 'toLocaleTimeString')
      mockToLocaleTimeString.mockReturnValue('00:00')
      
      const result = formatReportTime(testDate)
      
      expect(result).toBe('00:00')
      mockToLocaleTimeString.mockRestore()
    })
  })

  describe('formatLastUpdated', () => {
    beforeEach(() => {
      // Mock Date.now() to return a consistent value
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T15:30:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return "היום HH:MM" for today\'s date', () => {
      const todayDate = new Date('2024-01-15T10:30:00Z')
      
      const mockToLocaleTimeString = jest.spyOn(todayDate, 'toLocaleTimeString')
      mockToLocaleTimeString.mockReturnValue('10:30')
      
      const result = formatLastUpdated(todayDate)
      
      expect(result).toBe('היום 10:30')
      mockToLocaleTimeString.mockRestore()
    })

    it('should return "DD/MM HH:MM" for previous days', () => {
      const yesterdayDate = new Date('2024-01-14T10:30:00Z')
      
      const mockToLocaleTimeString = jest.spyOn(yesterdayDate, 'toLocaleTimeString')
      mockToLocaleTimeString.mockReturnValue('10:30')
      
      const mockToLocaleDateString = jest.spyOn(yesterdayDate, 'toLocaleDateString')
      mockToLocaleDateString.mockReturnValue('14/1')
      
      const result = formatLastUpdated(yesterdayDate)
      
      expect(mockToLocaleDateString).toHaveBeenCalledWith('he-IL', {
        day: 'numeric',
        month: 'numeric',
        timeZone: 'Asia/Jerusalem'
      })
      expect(result).toBe('14/1 10:30')
      
      mockToLocaleTimeString.mockRestore()
      mockToLocaleDateString.mockRestore()
    })

    it('should handle dates from different years', () => {
      const oldDate = new Date('2023-12-25T10:30:00Z')
      
      const mockToLocaleTimeString = jest.spyOn(oldDate, 'toLocaleTimeString')
      mockToLocaleTimeString.mockReturnValue('10:30')
      
      const mockToLocaleDateString = jest.spyOn(oldDate, 'toLocaleDateString')
      mockToLocaleDateString.mockReturnValue('25/12')
      
      const result = formatLastUpdated(oldDate)
      
      expect(result).toBe('25/12 10:30')
      
      mockToLocaleTimeString.mockRestore()
      mockToLocaleDateString.mockRestore()
    })
  })

  describe('formatCacheErrorDate', () => {
    it('should format timestamp using Hebrew locale', () => {
      const timestamp = 1705320600000 // January 15, 2024 10:30:00 UTC
      const testDate = new Date(timestamp)
      
      const mockToLocaleString = jest.spyOn(testDate, 'toLocaleString')
      mockToLocaleString.mockReturnValue('15.1.2024, 10:30:00')
      
      const result = formatCacheErrorDate(timestamp)
      
      expect(mockToLocaleString).toHaveBeenCalledWith('he-IL')
      expect(result).toBe('15.1.2024, 10:30:00')
      
      mockToLocaleString.mockRestore()
    })

    it('should handle edge case timestamps', () => {
      const timestamp = 0 // Unix epoch
      const testDate = new Date(timestamp)
      
      const mockToLocaleString = jest.spyOn(testDate, 'toLocaleString')
      mockToLocaleString.mockReturnValue('1.1.1970, 02:00:00')
      
      const result = formatCacheErrorDate(timestamp)
      
      expect(result).toBe('1.1.1970, 02:00:00')
      mockToLocaleString.mockRestore()
    })
  })
}) 