import { describe, it, expect } from 'vitest';
import { getPowerUsers, getPowerUserDailyData, CopilotUsageData } from '../lib/utils';

describe('Power Users Functionality', () => {
  const mockData: CopilotUsageData[] = [
    {
      timestamp: new Date('2025-01-01T10:00:00Z'),
      user: 'regular-user-1',
      model: 'gpt-4',
      requestsUsed: 5,
      exceedsQuota: false,
      totalMonthlyQuota: '100'
    },
    {
      timestamp: new Date('2025-01-01T11:00:00Z'),
      user: 'power-user-1',
      model: 'gpt-4',
      requestsUsed: 15,
      exceedsQuota: false,
      totalMonthlyQuota: '100'
    },
    {
      timestamp: new Date('2025-01-01T12:00:00Z'),
      user: 'power-user-1',
      model: 'gpt-3.5',
      requestsUsed: 8,
      exceedsQuota: false,
      totalMonthlyQuota: '100'
    },
    {
      timestamp: new Date('2025-01-02T10:00:00Z'),
      user: 'power-user-1',
      model: 'gpt-4',
      requestsUsed: 12,
      exceedsQuota: true,
      totalMonthlyQuota: '100'
    },
    {
      timestamp: new Date('2025-01-01T13:00:00Z'),
      user: 'power-user-2',
      model: 'claude',
      requestsUsed: 20,
      exceedsQuota: false,
      totalMonthlyQuota: '100'
    },
    {
      timestamp: new Date('2025-01-01T14:00:00Z'),
      user: 'regular-user-2',
      model: 'gpt-4',
      requestsUsed: 3,
      exceedsQuota: false,
      totalMonthlyQuota: '100'
    }
  ];

  it('should identify power users correctly', () => {
    const result = getPowerUsers(mockData);
    
    // With 4 users total, top 10% = Math.ceil(4 * 0.1) = 1 user
    expect(result.totalPowerUsers).toBe(1);
    expect(result.powerUsers).toHaveLength(1);
    
    // Should be sorted by total requests (descending) - only the top user
    expect(result.powerUsers[0].user).toBe('power-user-1');
    expect(result.powerUsers[0].totalRequests).toBe(35); // 15 + 8 + 12
  });

  it('should calculate total power user requests correctly', () => {
    const result = getPowerUsers(mockData);
    
    // Only power-user-1 is a power user now
    expect(result.totalPowerUserRequests).toBe(35); // Only power-user-1
  });

  it('should aggregate requests by model for power users', () => {
    const result = getPowerUsers(mockData);
    
    const powerUser1 = result.powerUsers.find(u => u.user === 'power-user-1');
    expect(powerUser1?.requestsByModel).toEqual({
      'gpt-4': 27, // 15 + 12
      'gpt-3.5': 8
    });
    
    // power-user-2 is no longer a power user (only top 10% = 1 user)
    const powerUser2 = result.powerUsers.find(u => u.user === 'power-user-2');
    expect(powerUser2).toBeUndefined();
  });

  it('should calculate daily activity for power users', () => {
    const result = getPowerUsers(mockData);
    
    const powerUser1 = result.powerUsers.find(u => u.user === 'power-user-1');
    expect(powerUser1?.dailyActivity).toEqual([
      { date: '2025-01-01', requests: 23 }, // 15 + 8
      { date: '2025-01-02', requests: 12 }
    ]);
  });

  it('should create model usage summary for power users only', () => {
    const result = getPowerUsers(mockData);
    
    // Only power-user-1 is a power user, so only models they used should be included
    expect(result.powerUserModelSummary).toHaveLength(2);
    
    // Should include models used by power users (only power-user-1)
    const gpt4Summary = result.powerUserModelSummary.find(m => m.model === 'gpt-4');
    expect(gpt4Summary?.totalRequests).toBe(27);
    expect(gpt4Summary?.compliantRequests).toBe(15);
    expect(gpt4Summary?.exceedingRequests).toBe(12);
    
    const gpt35Summary = result.powerUserModelSummary.find(m => m.model === 'gpt-3.5');
    expect(gpt35Summary?.totalRequests).toBe(8);
    
    // claude should not be included since power-user-2 is not a power user anymore
    const claudeSummary = result.powerUserModelSummary.find(m => m.model === 'claude');
    expect(claudeSummary).toBeUndefined();
  });

  it('should handle case with no power users', () => {
    const lowUsageData: CopilotUsageData[] = [
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        user: 'user-1',
        model: 'gpt-4',
        requestsUsed: 5,
        exceedsQuota: false,
        totalMonthlyQuota: '100'
      },
      {
        timestamp: new Date('2025-01-01T11:00:00Z'),
        user: 'user-2',
        model: 'gpt-4',
        requestsUsed: 3,
        exceedsQuota: false,
        totalMonthlyQuota: '100'
      }
    ];

    const result = getPowerUsers(lowUsageData);
    
    // With 2 users, top 10% = Math.ceil(2 * 0.1) = 1 user, so user-1 will be the power user
    expect(result.totalPowerUsers).toBe(1);
    expect(result.powerUsers).toHaveLength(1);
    expect(result.powerUsers[0].user).toBe('user-1'); // user with highest requests (5)
    expect(result.totalPowerUserRequests).toBe(5);
    expect(result.powerUserModelSummary).toHaveLength(1);
  });

  it('should generate daily data aggregated across all power users', () => {
    const result = getPowerUsers(mockData);
    const dailyData = getPowerUserDailyData(result.powerUsers);
    
    // Only power-user-1 is a power user now
    expect(dailyData).toEqual([
      { date: '2025-01-01', requests: 23 }, // power-user-1 only: 23
      { date: '2025-01-02', requests: 12 }  // power-user-1 only: 12
    ]);
  });

  it('should use top 10% logic for power users', () => {
    // Test with single user - should always have 1 power user
    const singleUserData: CopilotUsageData[] = [
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        user: 'only-user',
        model: 'gpt-4',
        requestsUsed: 1,
        exceedsQuota: false,
        totalMonthlyQuota: '100'
      }
    ];
    
    const result = getPowerUsers(singleUserData);
    expect(result.totalPowerUsers).toBe(1); // Should have 1 power user (top 10% of 1 user = 1)
    expect(result.powerUsers[0].user).toBe('only-user');
  });

  it('should calculate exceeding requests correctly for power users', () => {
    const result = getPowerUsers(mockData);
    
    const powerUser1 = result.powerUsers.find(u => u.user === 'power-user-1');
    
    // power-user-1 has one request with exceedsQuota: true (12 requests on 2025-01-02)
    expect(powerUser1?.exceedingRequests).toBe(12);
    
    // Verify total requests and exceeding requests are different
    expect(powerUser1?.totalRequests).toBe(35); // 15 + 8 + 12
    expect(powerUser1?.exceedingRequests).toBe(12); // Only the quota-exceeding request
  });
});