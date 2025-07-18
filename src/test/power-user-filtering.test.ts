import { describe, it, expect } from 'vitest';
import { getPowerUserDailyBreakdown, CopilotUsageData } from '../lib/utils';

describe('Power User Filtering for Chart', () => {
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

  it('should filter chart data to show only selected power user', () => {
    // Test filtering to power-user-1 only
    const powerUser1Result = getPowerUserDailyBreakdown(mockData, ['power-user-1']);
    
    expect(powerUser1Result).toHaveLength(2);
    
    // Check 2025-01-01 for power-user-1 only
    const day1 = powerUser1Result.find(r => r.date === '2025-01-01');
    expect(day1).toBeDefined();
    expect(day1?.compliantRequests).toBe(15); // Only power-user-1's compliant requests
    expect(day1?.exceedingRequests).toBe(8); // Only power-user-1's exceeding requests
    
    // Check 2025-01-02 for power-user-1 only
    const day2 = powerUser1Result.find(r => r.date === '2025-01-02');
    expect(day2).toBeDefined();
    expect(day2?.compliantRequests).toBe(12); // Only power-user-1's compliant requests
    expect(day2?.exceedingRequests).toBe(0); // power-user-1 has no exceeding requests on this day
  });

  it('should filter chart data to show only another selected power user', () => {
    // Test filtering to power-user-2 only
    const powerUser2Result = getPowerUserDailyBreakdown(mockData, ['power-user-2']);
    
    expect(powerUser2Result).toHaveLength(2);
    
    // Check 2025-01-01 for power-user-2 only
    const day1 = powerUser2Result.find(r => r.date === '2025-01-01');
    expect(day1).toBeDefined();
    expect(day1?.compliantRequests).toBe(20); // Only power-user-2's compliant requests
    expect(day1?.exceedingRequests).toBe(0); // power-user-2 has no exceeding requests on this day
    
    // Check 2025-01-02 for power-user-2 only
    const day2 = powerUser2Result.find(r => r.date === '2025-01-02');
    expect(day2).toBeDefined();
    expect(day2?.compliantRequests).toBe(0); // power-user-2 has no compliant requests on this day
    expect(day2?.exceedingRequests).toBe(5); // Only power-user-2's exceeding requests
  });

  it('should show all power users when no filter is applied', () => {
    // Test showing all power users
    const allPowerUsersResult = getPowerUserDailyBreakdown(mockData, ['power-user-1', 'power-user-2']);
    
    expect(allPowerUsersResult).toHaveLength(2);
    
    // Check 2025-01-01 for all power users
    const day1 = allPowerUsersResult.find(r => r.date === '2025-01-01');
    expect(day1).toBeDefined();
    expect(day1?.compliantRequests).toBe(35); // power-user-1: 15, power-user-2: 20
    expect(day1?.exceedingRequests).toBe(8); // power-user-1: 8
    
    // Check 2025-01-02 for all power users
    const day2 = allPowerUsersResult.find(r => r.date === '2025-01-02');
    expect(day2).toBeDefined();
    expect(day2?.compliantRequests).toBe(12); // power-user-1: 12
    expect(day2?.exceedingRequests).toBe(5); // power-user-2: 5
  });

  it('should handle filtering to non-existent user gracefully', () => {
    // Test filtering to non-existent user
    const result = getPowerUserDailyBreakdown(mockData, ['non-existent-user']);
    expect(result).toHaveLength(0);
  });

  it('should include data for all users in the filter list regardless of power user status', () => {
    // Test that all users in the filter list are included, even regular users
    const result = getPowerUserDailyBreakdown(mockData, ['power-user-1', 'regular-user']);
    
    expect(result).toHaveLength(2);
    
    // Should include both power-user-1 and regular-user data
    const day1 = result.find(r => r.date === '2025-01-01');
    expect(day1).toBeDefined();
    expect(day1?.compliantRequests).toBe(18); // power-user-1: 15, regular-user: 3
    expect(day1?.exceedingRequests).toBe(8); // Only power-user-1
  });
});