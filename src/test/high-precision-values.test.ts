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
  it('should match toLocaleString with maximumFractionDigits 2 (locale-agnostic)', () => {
    const cases = [5, 1000, 1.07, 107.03, 0.5]
    for (const v of cases) {
      const expected = v.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })
      expect(formatRequestCount(v)).toBe(expected)
    }
  })

  it('should always show 2 decimal places (including whole numbers)', () => {
    const result = formatRequestCount(5)
    const expected = (5).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })
    expect(result).toBe(expected)
  })
})

