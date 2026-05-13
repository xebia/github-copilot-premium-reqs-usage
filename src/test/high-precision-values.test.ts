import { describe, it, expect } from 'vitest'
import { parseCSV, formatRequestCount } from '@/lib/utils'

const BASE_HEADERS = '"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"'

describe('High-precision numeric values', () => {
  it('should parse requestsUsed with many decimal digits without loss', () => {
    const row = `"2025-06-11T05:13:27.8766440Z","alice","gpt-4o","107.03398500000002","False","Unlimited"`
    const result = parseCSV(`${BASE_HEADERS}\n${row}`)
    // parseFloat preserves IEEE 754 double precision
    expect(result[0].requestsUsed).toBeCloseTo(107.033985, 6)
  })

  it('should parse small high-precision requestsUsed correctly', () => {
    const row = `"2025-06-11T05:13:27.8766440Z","alice","gpt-4o","1.07033985","False","Unlimited"`
    const result = parseCSV(`${BASE_HEADERS}\n${row}`)
    expect(result[0].requestsUsed).toBeCloseTo(1.07033985, 8)
  })

  it('should preserve precision through aggregation', () => {
    const rows = [
      `"2025-06-11T05:00:00.0000000Z","alice","gpt-4o","107.03398500000002","False","Unlimited"`,
      `"2025-06-11T06:00:00.0000000Z","alice","gpt-4o","1.07033985","False","Unlimited"`,
    ]
    const result = parseCSV(`${BASE_HEADERS}\n${rows.join('\n')}`)
    const total = result.reduce((sum, r) => sum + r.requestsUsed, 0)
    expect(total).toBeCloseTo(108.10432485, 6)
  })
})

describe('formatRequestCount', () => {
  it('should match toLocaleString with maximumFractionDigits 8 (locale-agnostic)', () => {
    const cases = [5, 1000, 1.07033985, 107.03398500000002, 107.03]
    for (const v of cases) {
      const expected = v.toLocaleString(undefined, { maximumFractionDigits: 8, minimumFractionDigits: 0 })
      expect(formatRequestCount(v)).toBe(expected)
    }
  })

  it('should preserve more precision than a 2-decimal format for high-precision values', () => {
    const value = 107.03398500000002
    const twoDP = value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })
    const result = formatRequestCount(value)
    // Should have more digits than the 2dp version
    expect(result).not.toBe(twoDP)
    expect(result.length).toBeGreaterThan(twoDP.length)
  })

  it('should show whole numbers without decimal part', () => {
    const result = formatRequestCount(5)
    const expected = (5).toLocaleString(undefined, { maximumFractionDigits: 8, minimumFractionDigits: 0 })
    expect(result).toBe(expected)
    // Whole numbers must not have a decimal separator
    const decSep = (1.1).toLocaleString(undefined, { maximumFractionDigits: 1 })[1]
    expect(result).not.toContain(decSep)
  })
})

