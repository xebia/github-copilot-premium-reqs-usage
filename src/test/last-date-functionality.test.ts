import { describe, it, expect } from 'vitest';
import { getLastDateFromData, parseCSV } from '../lib/utils';

describe('Last Date Functionality', () => {
  const csvContent = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-06-10T05:13:27.8766440Z","user1","gpt-4.1-2025-04-14","1","False","Unlimited"
"2025-06-11T05:09:40.8432110Z","user2","gpt-4.1-2025-04-14","1","False","Unlimited"
"2025-06-09T10:30:00.0000000Z","user3","gpt-4.1-2025-04-14","2","True","Unlimited"
"2025-06-12T15:45:00.0000000Z","user1","gpt-3.5-turbo","3","False","Unlimited"`;

  it('should return the last date from CSV data', () => {
    const parsedData = parseCSV(csvContent);
    const lastDate = getLastDateFromData(parsedData);
    
    expect(lastDate).toBe('2025-06-12');
  });

  it('should return null for empty data', () => {
    const lastDate = getLastDateFromData([]);
    
    expect(lastDate).toBeNull();
  });

  it('should handle single record data', () => {
    const singleRecordCsv = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-06-15T08:00:00.0000000Z","user1","gpt-4.1-2025-04-14","1","False","Unlimited"`;
    
    const parsedData = parseCSV(singleRecordCsv);
    const lastDate = getLastDateFromData(parsedData);
    
    expect(lastDate).toBe('2025-06-15');
  });

  it('should handle multiple records on the same day', () => {
    const sameDayCsv = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-06-10T05:13:27.8766440Z","user1","gpt-4.1-2025-04-14","1","False","Unlimited"
"2025-06-10T15:30:00.0000000Z","user2","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-06-10T23:59:59.9999999Z","user3","gpt-3.5-turbo","1","True","Unlimited"`;
    
    const parsedData = parseCSV(sameDayCsv);
    const lastDate = getLastDateFromData(parsedData);
    
    expect(lastDate).toBe('2025-06-10');
  });
});