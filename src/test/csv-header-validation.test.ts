import { describe, it, expect } from 'vitest'
import { parseCSV } from '@/lib/utils'

describe('CSV Header Validation', () => {
  const requiredHeaders = ['Timestamp', 'User', 'Model', 'Requests Used', 'Total Monthly Quota']

  it('should accept CSV with correct headers in exact case (old format)', () => {
    const csvWithCorrectHeaders = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100`

    expect(() => parseCSV(csvWithCorrectHeaders)).not.toThrow()
  })

  it('should accept CSV with correct headers in different case (old format)', () => {
    const csvWithDifferentCase = `"timestamp","user","model","requests used","exceeds monthly quota","total monthly quota"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100`

    expect(() => parseCSV(csvWithDifferentCase)).not.toThrow()
  })

  it('should accept CSV with correct headers in new format', () => {
    const csvNewFormat = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","total_monthly_quota","organization","repository","cost_center_name","aic_quantity","aic_gross_amount"
"2026-06-01","silvio-sawicki_liantis","copilot","copilot_ai_credit","Auto: Claude Haiku 4.5","19.678995","ai-credits","0.01","0.19678995","0.19678995","0","3900","liantisit-common","","","0","0"`

    expect(() => parseCSV(csvNewFormat)).not.toThrow()
  })

  it('should parse new format data correctly with default exceedsQuota', () => {
    const csvNewFormat = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","total_monthly_quota","organization","repository","cost_center_name","aic_quantity","aic_gross_amount"
"2026-06-01","silvio-sawicki_liantis","copilot","copilot_ai_credit","Auto: Claude Haiku 4.5","19.678995","ai-credits","0.01","0.19678995","0.19678995","0","3900","liantisit-common","","","0","0"`

    const result = parseCSV(csvNewFormat)
    expect(result).toHaveLength(1)
    expect(result[0].timestamp).toEqual(new Date('2026-06-01'))
    expect(result[0].user).toBe('silvio-sawicki_liantis')
    expect(result[0].model).toBe('Auto: Claude Haiku 4.5')
    expect(result[0].requestsUsed).toBe(19.678995)
    expect(result[0].exceedsQuota).toBe(false) // default when column absent
    expect(result[0].totalMonthlyQuota).toBe('3900')
    expect(result[0].product).toBe('copilot')
    expect(result[0].sku).toBe('copilot_ai_credit')
    expect(result[0].unitType).toBe('ai-credits')
    expect(result[0].appliedCostPerQuantity).toBe(0.01)
    expect(result[0].grossAmount).toBeCloseTo(0.19678995)
    expect(result[0].discountAmount).toBeCloseTo(0.19678995)
    expect(result[0].netAmount).toBe(0)
    expect(result[0].organization).toBe('liantisit-common')
    expect(result[0].repository).toBe('')
    expect(result[0].costCenterName).toBe('')
    expect(result[0].aicQuantity).toBe(0)
    expect(result[0].aicGrossAmount).toBe(0)
  })

  it('should accept CSV with extra columns beyond required ones', () => {
    const csvWithExtraColumns = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota","Extra Column"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100,extra-data`

    expect(() => parseCSV(csvWithExtraColumns)).not.toThrow()
  })

  it('should reject CSV missing required columns', () => {
    const csvMissingColumns = `"Timestamp","User","Model","Requests Used","Wrong Column","Another Column"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100`

    expect(() => parseCSV(csvMissingColumns)).toThrow(
      'CSV is missing required columns: Total Monthly Quota. Expected columns: Timestamp, User, Model, Requests Used, Total Monthly Quota'
    )
  })

  it('should reject CSV with too few total columns', () => {
    const csvTooFewColumns = `"Timestamp","User","Model"
2024-01-01T00:00:00Z,user1,gpt-4`

    expect(() => parseCSV(csvTooFewColumns)).toThrow('CSV header must contain at least 5 columns')
  })

  it('should handle CSV with mixed case headers and validate correctly', () => {
    const csvMixedCase = `"TIMESTAMP","user","Model","REQUESTS USED","exceeds monthly quota","Total Monthly Quota"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100`

    expect(() => parseCSV(csvMixedCase)).not.toThrow()
  })

  it('should handle CSV with whitespace in headers', () => {
    const csvWithWhitespace = `" Timestamp "," User "," Model "," Requests Used "," Exceeds Monthly Quota "," Total Monthly Quota "
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100`

    expect(() => parseCSV(csvWithWhitespace)).not.toThrow()
    
    const result = parseCSV(csvWithWhitespace)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      timestamp: new Date('2024-01-01T00:00:00Z'),
      user: 'user1',
      model: 'gpt-4',
      requestsUsed: 1.5,
      exceedsQuota: false,
      totalMonthlyQuota: '100'
    })
  })

  it('should validate data types correctly with valid headers (old format)', () => {
    const validCsv = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100`

    const result = parseCSV(validCsv)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      timestamp: new Date('2024-01-01T00:00:00Z'),
      user: 'user1',
      model: 'gpt-4',
      requestsUsed: 1.5,
      exceedsQuota: false,
      totalMonthlyQuota: '100'
    })
  })

  it('should validate multiple data rows with correct headers', () => {
    const csvMultipleRows = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100
2024-01-01T01:00:00Z,user2,gpt-3.5-turbo,2.0,true,50`

    const result = parseCSV(csvMultipleRows)
    expect(result).toHaveLength(2)
    expect(result[1]).toEqual({
      timestamp: new Date('2024-01-01T01:00:00Z'),
      user: 'user2',
      model: 'gpt-3.5-turbo',
      requestsUsed: 2.0,
      exceedsQuota: true,
      totalMonthlyQuota: '50'
    })
  })

  it('should reject CSV with headers that contain required words but are not exact matches', () => {
    const csvWithSimilarHeaders = `"Event Timestamp","System User","Model Type","Total Requests Used","User Exceeds Monthly Quota","Total Monthly Quota Limit"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100`

    expect(() => parseCSV(csvWithSimilarHeaders)).toThrow(
      'CSV is missing required columns: Timestamp, User, Model, Requests Used, Total Monthly Quota'
    )
  })
})