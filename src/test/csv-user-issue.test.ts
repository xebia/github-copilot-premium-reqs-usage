import { describe, it, expect } from 'vitest';
import { parseCSV } from '../lib/utils';

describe('CSV Parsing Issue Reproduction', () => {
  it('should handle the exact CSV format provided by user', () => {
    const csvContent = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-06-11T05:13:27.8766440Z","xyz","gpt-4.1-2025-04-14","1","False","Unlimited"
"2025-06-11T05:09:40.8432110Z","xyz","gpt-4.1-2025-04-14","1","False","Unlimited"`;

    console.log('Testing user CSV content:');
    console.log(csvContent);
    console.log('');

    // This should parse without issues
    expect(() => parseCSV(csvContent)).not.toThrow();
    
    const result = parseCSV(csvContent);
    expect(result).toHaveLength(2);
    expect(result[0].user).toBe('xyz');
    expect(result[0].model).toBe('gpt-4.1-2025-04-14');
    expect(result[0].requestsUsed).toBe(1);
    expect(result[0].exceedsQuota).toBe(false);
    expect(result[0].totalMonthlyQuota).toBe('Unlimited');
  });

  it('should handle header with potential whitespace issues', () => {
    // Test with potential whitespace or encoding issues
    const csvWithExtraSpacing = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota" 
"2025-06-11T05:13:27.8766440Z","xyz","gpt-4.1-2025-04-14","1","False","Unlimited"`;

    expect(() => parseCSV(csvWithExtraSpacing)).not.toThrow();
    
    const result = parseCSV(csvWithExtraSpacing);
    expect(result).toHaveLength(1);
    expect(result[0].totalMonthlyQuota).toBe('Unlimited');
  });

  it('should handle header without quotes', () => {
    const csvWithoutQuotes = `Timestamp,User,Model,Requests Used,Exceeds Monthly Quota,Total Monthly Quota
2025-06-11T05:13:27.8766440Z,xyz,gpt-4.1-2025-04-14,1,False,Unlimited`;

    expect(() => parseCSV(csvWithoutQuotes)).not.toThrow();
    const result = parseCSV(csvWithoutQuotes);
    expect(result).toHaveLength(1);
  });

  it('should handle data rows with trailing spaces', () => {
    const csvWithTrailingSpaceInData = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-06-11T05:13:27.8766440Z","xyz","gpt-4.1-2025-04-14","1","False","Unlimited" `;

    expect(() => parseCSV(csvWithTrailingSpaceInData)).not.toThrow();
    const result = parseCSV(csvWithTrailingSpaceInData);
    expect(result).toHaveLength(1);
    expect(result[0].totalMonthlyQuota).toBe('Unlimited');
  });
});