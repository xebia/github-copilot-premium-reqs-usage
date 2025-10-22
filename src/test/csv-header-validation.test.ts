import { describe, it, expect } from 'vitest'
import { parseCSV } from '@/lib/utils'

describe('CSV Header Validation', () => {
  const requiredHeaders = ['Timestamp', 'User', 'Model', 'Requests Used', 'Exceeds Monthly Quota', 'Total Monthly Quota']

  it('should accept CSV with correct headers in exact case', () => {
    const csvWithCorrectHeaders = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100`

    expect(() => parseCSV(csvWithCorrectHeaders)).not.toThrow()
  })

  it('should accept CSV with correct headers in different case', () => {
    const csvWithDifferentCase = `"timestamp","user","model","requests used","exceeds monthly quota","total monthly quota"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100`

    expect(() => parseCSV(csvWithDifferentCase)).not.toThrow()
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
      'CSV is missing required columns: Exceeds Monthly Quota, Total Monthly Quota. Expected columns: Timestamp, User, Model, Requests Used, Exceeds Monthly Quota, Total Monthly Quota'
    )
  })

  it('should reject CSV with too few total columns', () => {
    const csvTooFewColumns = `"Timestamp","User","Model"
2024-01-01T00:00:00Z,user1,gpt-4`

    expect(() => parseCSV(csvTooFewColumns)).toThrow('CSV header must contain at least 6 columns')
  })

  it('should reject CSV missing specific required columns with detailed error message', () => {
    const csvMissingSpecificColumns = `"Timestamp","User","Model","Requests Used","Wrong Column","Total Monthly Quota"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100`

    expect(() => parseCSV(csvMissingSpecificColumns)).toThrow(
      'CSV is missing required columns: Exceeds Monthly Quota. Expected columns: Timestamp, User, Model, Requests Used, Exceeds Monthly Quota, Total Monthly Quota'
    )
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

  it('should validate data types correctly with valid headers', () => {
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
    // This test ensures exact header matching, not substring matching
    const csvWithSimilarHeaders = `"Event Timestamp","System User","Model Type","Total Requests Used","User Exceeds Monthly Quota","Total Monthly Quota Limit"
2024-01-01T00:00:00Z,user1,gpt-4,1.5,false,100`

    expect(() => parseCSV(csvWithSimilarHeaders)).toThrow(
      'CSV is missing required columns: Timestamp, User, Model, Requests Used, Exceeds Monthly Quota, Total Monthly Quota'
    )
  })
})