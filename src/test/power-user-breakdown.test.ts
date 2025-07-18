import { describe, it, expect } from 'vitest';
import { getPowerUserDailyBreakdown, CopilotUsageData } from '../lib/utils';

describe('Power User Daily Breakdown', () => {
  const mockData: CopilotUsageData[] = [
    {
      timestamp: new Date('2025-01-01T10:00:00Z'),
      user: 'power-user-1',
      model: 'gpt-4',
      requestsUsed: 15,
      exceedsQuota: false,
      totalMonthlyQuota: '100'
    },
    {
      timestamp: new Date('2025-01-01T11:00:00Z'),
      user: 'power-user-1',
      model: 'claude-3',
      requestsUsed: 8,
      exceedsQuota: true,
      totalMonthlyQuota: '100'
    },
    {
      timestamp: new Date('2025-01-02T10:00:00Z'),
      user: 'power-user-1',
      model: 'gpt-4',
      requestsUsed: 12,
      exceedsQuota: false,
      totalMonthlyQuota: '100'
    },
    {
      timestamp: new Date('2025-01-01T12:00:00Z'),
      user: 'power-user-2',
      model: 'gpt-4',
      requestsUsed: 20,
      exceedsQuota: false,
      totalMonthlyQuota: '100'
    },
    {
      timestamp: new Date('2025-01-02T11:00:00Z'),
      user: 'power-user-2',
      model: 'claude-3',
      requestsUsed: 5,
      exceedsQuota: true,
      totalMonthlyQuota: '100'
    },
    {
      timestamp: new Date('2025-01-01T13:00:00Z'),
      user: 'regular-user',
      model: 'gpt-4',
      requestsUsed: 3,
      exceedsQuota: false,
      totalMonthlyQuota: '100'
    }
  ];

  it('should aggregate daily breakdown for specified power users only', () => {
    const powerUserNames = ['power-user-1', 'power-user-2'];
    const result = getPowerUserDailyBreakdown(mockData, powerUserNames);
    
    expect(result).toHaveLength(2);
    
    // Check 2025-01-01 aggregation
    const day1 = result.find(r => r.date === '2025-01-01');
    expect(day1).toBeDefined();
    expect(day1?.compliantRequests).toBe(35); // power-user-1: 15, power-user-2: 20
    expect(day1?.exceedingRequests).toBe(8); // power-user-1: 8
    
    // Check 2025-01-02 aggregation
    const day2 = result.find(r => r.date === '2025-01-02');
    expect(day2).toBeDefined();
    expect(day2?.compliantRequests).toBe(12); // power-user-1: 12
    expect(day2?.exceedingRequests).toBe(5); // power-user-2: 5
  });

  it('should exclude non-power users from aggregation', () => {
    const powerUserNames = ['power-user-1'];
    const result = getPowerUserDailyBreakdown(mockData, powerUserNames);
    
    const day1 = result.find(r => r.date === '2025-01-01');
    expect(day1?.compliantRequests).toBe(15); // Only power-user-1, excludes regular-user and power-user-2
    expect(day1?.exceedingRequests).toBe(8); // Only power-user-1
  });

  it('should return empty array when no power users provided', () => {
    const result = getPowerUserDailyBreakdown(mockData, []);
    expect(result).toHaveLength(0);
  });

  it('should return empty array when power users not found in data', () => {
    const powerUserNames = ['non-existent-user'];
    const result = getPowerUserDailyBreakdown(mockData, powerUserNames);
    expect(result).toHaveLength(0);
  });

  it('should sort results by date', () => {
    const powerUserNames = ['power-user-1', 'power-user-2'];
    const result = getPowerUserDailyBreakdown(mockData, powerUserNames);
    
    expect(result[0].date).toBe('2025-01-01');
    expect(result[1].date).toBe('2025-01-02');
  });

  it('should handle fractional request values', () => {
    const fractionalData: CopilotUsageData[] = [
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        user: 'power-user-1',
        model: 'gpt-4',
        requestsUsed: 1.5,
        exceedsQuota: false,
        totalMonthlyQuota: '100'
      },
      {
        timestamp: new Date('2025-01-01T11:00:00Z'),
        user: 'power-user-1',
        model: 'claude-3',
        requestsUsed: 2.3,
        exceedsQuota: true,
        totalMonthlyQuota: '100'
      }
    ];

    const powerUserNames = ['power-user-1'];
    const result = getPowerUserDailyBreakdown(fractionalData, powerUserNames);
    
    expect(result).toHaveLength(1);
    expect(result[0].compliantRequests).toBe(1.5);
    expect(result[0].exceedingRequests).toBe(2.3);
  });
});