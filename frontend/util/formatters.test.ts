import { describe, it, expect } from 'vitest'
import { formatNumber, formatCurrency, formatAddress, truncateAddress } from '../util/formatters'

describe('formatters', () => {
  describe('formatNumber', () => {
    it('should format positive numbers', () => {
      expect(formatNumber(1234.567, 2, 2)).toBe('1,234.57')
      expect(formatNumber(1000000, 0, 0)).toBe('1,000,000')
      expect(formatNumber(99.99, 2, 2)).toBe('99.99')
    })

    it('should handle zero', () => {
      expect(formatNumber(0, 2, 2)).toBe('0.00')
    })

    it('should handle negative numbers', () => {
      expect(formatNumber(-500.5, 2, 2)).toBe('-500.50')
    })

    it('should handle min/max fraction digits', () => {
      expect(formatNumber(10.12345, 2, 4)).toBe('10.1235')
      expect(formatNumber(10.1, 2, 4)).toBe('10.10')
    })
  })

  describe('formatCurrency', () => {
    it('should format with currency symbol', () => {
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00')
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0.00')
    })
  })

  describe('truncateAddress', () => {
    it('should truncate valid Stellar addresses', () => {
      const addr = 'GDELFTXEWUV42EYZGIRL2L4BP7I72EDWOZJ47UMCQP7DZME32BGWBFEJ'
      expect(truncateAddress(addr)).toBe('GDEL...BFEJ')
      expect(truncateAddress(addr, 6)).toBe('GDELFT...BGWBFEJ')
    })

    it('should handle short addresses', () => {
      expect(truncateAddress('GABC123')).toBe('GABC123')
    })
  })

  describe('formatAddress', () => {
    it('should format with truncation', () => {
      const addr = 'GDELFTXEWUV42EYZGIRL2L4BP7I72EDWOZJ47UMCQP7DZME32BGWBFEJ'
      expect(formatAddress(addr)).toBe('GDEL...BFEJ')
    })

    it('should return empty string for invalid input', () => {
      expect(formatAddress('')).toBe('')
      expect(formatAddress('invalid')).toBe('invalid')
    })
  })
})
