import { describe, it, expect } from 'vitest'
import { parseCSV, getAICData, getAICDataStatus } from '@/lib/utils'

const BASE_HEADERS = '"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"'
const BASE_ROW = '"2025-06-11T05:13:27.8766440Z","alice","gpt-4.1","1","False","Unlimited"'

describe('AIC field parsing', () => {
  it('should parse records without AIC fields without error', () => {
    const csv = `${BASE_HEADERS}\n${BASE_ROW}`
    const result = parseCSV(csv)
    expect(result).toHaveLength(1)
    expect(result[0].aicQuantity).toBeUndefined()
    expect(result[0].aicGrossAmount).toBeUndefined()
  })

  it('should not include AIC keys in records when columns are absent', () => {
    const csv = `${BASE_HEADERS}\n${BASE_ROW}`
    const result = parseCSV(csv)
    expect('aicQuantity' in result[0]).toBe(false)
    expect('aicGrossAmount' in result[0]).toBe(false)
  })

  it('should parse aic_quantity and aic_gross_amount when present', () => {
    const headers = `${BASE_HEADERS},"aic_quantity","aic_gross_amount"`
    const row = '"2025-06-11T05:13:27.8766440Z","alice","gpt-4.1","1","False","Unlimited","5","0.0025"'
    const result = parseCSV(`${headers}\n${row}`)
    expect(result[0].aicQuantity).toBe(5)
    expect(result[0].aicGrossAmount).toBeCloseTo(0.0025)
  })

  it('should be case-insensitive for AIC headers', () => {
    const headers = `${BASE_HEADERS},"AIC_QUANTITY","AIC_GROSS_AMOUNT"`
    const row = '"2025-06-11T05:13:27.8766440Z","alice","gpt-4.1","1","False","Unlimited","10","0.005"'
    const result = parseCSV(`${headers}\n${row}`)
    expect(result[0].aicQuantity).toBe(10)
    expect(result[0].aicGrossAmount).toBeCloseTo(0.005)
  })

  it('should omit AIC fields when cells are empty', () => {
    const headers = `${BASE_HEADERS},"aic_quantity","aic_gross_amount"`
    const row = '"2025-06-11T05:13:27.8766440Z","alice","gpt-4.1","1","False","Unlimited","",""'
    const result = parseCSV(`${headers}\n${row}`)
    expect('aicQuantity' in result[0]).toBe(false)
    expect('aicGrossAmount' in result[0]).toBe(false)
  })

  it('should omit AIC fields when cells contain non-numeric values', () => {
    const headers = `${BASE_HEADERS},"aic_quantity","aic_gross_amount"`
    const row = '"2025-06-11T05:13:27.8766440Z","alice","gpt-4.1","1","False","Unlimited","abc","$bad"'
    const result = parseCSV(`${headers}\n${row}`)
    expect('aicQuantity' in result[0]).toBe(false)
    expect('aicGrossAmount' in result[0]).toBe(false)
  })

  it('should parse zero values correctly', () => {
    const headers = `${BASE_HEADERS},"aic_quantity","aic_gross_amount"`
    const row = '"2025-06-11T05:13:27.8766440Z","alice","gpt-4.1","1","False","Unlimited","0","0"'
    const result = parseCSV(`${headers}\n${row}`)
    expect(result[0].aicQuantity).toBe(0)
    expect(result[0].aicGrossAmount).toBe(0)
  })

  it('should parse mixed rows where some have AIC data and some do not', () => {
    const headers = `${BASE_HEADERS},"aic_quantity","aic_gross_amount"`
    const rows = [
      '"2025-06-11T05:13:27.8766440Z","alice","gpt-4.1","1","False","Unlimited","5","0.0025"',
      '"2025-06-11T06:00:00.0000000Z","bob","gpt-4.1","1","False","Unlimited","",""',
    ]
    const result = parseCSV(`${headers}\n${rows.join('\n')}`)
    expect(result[0].aicQuantity).toBe(5)
    expect('aicQuantity' in result[1]).toBe(false)
  })
})

describe('getAICDataStatus', () => {
  it('should return all false when no AIC fields present', () => {
    const csv = `${BASE_HEADERS}\n${BASE_ROW}`
    const data = parseCSV(csv)
    const status = getAICDataStatus(data)
    expect(status.hasQuantityField).toBe(false)
    expect(status.hasAmountField).toBe(false)
    expect(status.hasQuantityData).toBe(false)
    expect(status.hasAmountData).toBe(false)
  })

  it('should detect fields even when all values are zero', () => {
    const headers = `${BASE_HEADERS},"aic_quantity","aic_gross_amount"`
    const row = '"2025-06-11T05:13:27.8766440Z","alice","gpt-4.1","1","False","Unlimited","0","0"'
    const data = parseCSV(`${headers}\n${row}`)
    const status = getAICDataStatus(data)
    expect(status.hasQuantityField).toBe(true)
    expect(status.hasAmountField).toBe(true)
    expect(status.hasQuantityData).toBe(false) // zero is not > 0
    expect(status.hasAmountData).toBe(false)
  })

  it('should detect non-zero data correctly', () => {
    const headers = `${BASE_HEADERS},"aic_quantity","aic_gross_amount"`
    const row = '"2025-06-11T05:13:27.8766440Z","alice","gpt-4.1","1","False","Unlimited","5","0.0025"'
    const data = parseCSV(`${headers}\n${row}`)
    const status = getAICDataStatus(data)
    expect(status.hasQuantityField).toBe(true)
    expect(status.hasAmountField).toBe(true)
    expect(status.hasQuantityData).toBe(true)
    expect(status.hasAmountData).toBe(true)
  })
})

describe('getAICData aggregation', () => {
  const makeCSV = (rows: string[]) => {
    const headers = `${BASE_HEADERS},"aic_quantity","aic_gross_amount"`
    return `${headers}\n${rows.join('\n')}`
  }

  it('should return empty array for empty data', () => {
    expect(getAICData([], 'day')).toEqual([])
  })

  it('should aggregate by day correctly', () => {
    const csv = makeCSV([
      '"2025-06-11T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","5","0.0025"',
      '"2025-06-11T06:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","3","0.0015"',
      '"2025-06-12T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","4","0.002"',
    ])
    const data = parseCSV(csv)
    const result = getAICData(data, 'day')
    expect(result).toHaveLength(2)
    expect(result[0].period).toBe('2025-06-11')
    expect(result[0].aicQuantity).toBe(8)
    expect(result[0].aicGrossAmount).toBeCloseTo(0.004)
    expect(result[1].period).toBe('2025-06-12')
    expect(result[1].aicQuantity).toBe(4)
  })

  it('should aggregate by week correctly', () => {
    // June 9, 2025 is a Monday; June 11 is a Wednesday of the same week
    const csv = makeCSV([
      '"2025-06-09T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","5","0.0025"',
      '"2025-06-11T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","3","0.0015"',
      '"2025-06-16T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","4","0.002"',
    ])
    const data = parseCSV(csv)
    const result = getAICData(data, 'week')
    expect(result).toHaveLength(2)
    // First week starts on June 9 (Monday)
    expect(result[0].period).toBe('2025-06-09')
    expect(result[0].aicQuantity).toBe(8)
    // Second week starts on June 16 (Monday)
    expect(result[1].period).toBe('2025-06-16')
    expect(result[1].aicQuantity).toBe(4)
  })

  it('should aggregate by month correctly', () => {
    const csv = makeCSV([
      '"2025-06-11T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","5","0.0025"',
      '"2025-06-15T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","3","0.0015"',
      '"2025-07-01T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","4","0.002"',
    ])
    const data = parseCSV(csv)
    const result = getAICData(data, 'month')
    expect(result).toHaveLength(2)
    expect(result[0].period).toBe('2025-06')
    expect(result[0].aicQuantity).toBe(8)
    expect(result[1].period).toBe('2025-07')
    expect(result[1].aicQuantity).toBe(4)
  })

  it('should handle records without AIC fields (contribute 0)', () => {
    // Mix of records with and without AIC fields
    const headers = `${BASE_HEADERS},"aic_quantity","aic_gross_amount"`
    const rows = [
      '"2025-06-11T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","5","0.0025"',
      '"2025-06-11T06:00:00.0000000Z","bob","gpt-4.1","1","False","Unlimited","",""',
    ]
    const data = parseCSV(`${headers}\n${rows.join('\n')}`)
    const result = getAICData(data, 'day')
    expect(result).toHaveLength(1)
    expect(result[0].aicQuantity).toBe(5) // Only alice's record contributes
    expect(result[0].aicGrossAmount).toBeCloseTo(0.0025)
  })

  it('should sort results by period ascending', () => {
    const csv = makeCSV([
      '"2025-06-13T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","1","0.001"',
      '"2025-06-11T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","2","0.002"',
      '"2025-06-12T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","3","0.003"',
    ])
    const data = parseCSV(csv)
    const result = getAICData(data, 'day')
    expect(result.map(r => r.period)).toEqual(['2025-06-11', '2025-06-12', '2025-06-13'])
  })

  it('should use UTC-based week start (Monday) consistent with WeeklyTopModelsChart', () => {
    // Saturday June 14, 2025 should belong to the week starting Monday June 9, 2025
    // Sunday June 15, 2025 should belong to the week starting Monday June 9, 2025 (ISO Sun = end of previous week)
    // Monday June 16, 2025 should start a new week
    const csv = makeCSV([
      '"2025-06-14T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","1","0.001"', // Sat - week of Jun 9
      '"2025-06-15T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","2","0.002"', // Sun - week of Jun 9
      '"2025-06-16T05:00:00.0000000Z","alice","gpt-4.1","1","False","Unlimited","4","0.004"', // Mon - new week
    ])
    const data = parseCSV(csv)
    const result = getAICData(data, 'week')
    expect(result).toHaveLength(2)
    expect(result[0].period).toBe('2025-06-09') // Mon Jun 9 is week start
    expect(result[0].aicQuantity).toBe(3) // Sat + Sun
    expect(result[1].period).toBe('2025-06-16') // Mon Jun 16 starts new week
    expect(result[1].aicQuantity).toBe(4)
  })
})
