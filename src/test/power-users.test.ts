import { describe, it, expect } from 'vitest';
import { getPowerUsers, getPowerUserDailyData, POWER_USER_THRESHOLD, CopilotUsageData } from '../lib/utils';

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
    
    expect(result.totalPowerUsers).toBe(2);
    expect(result.powerUsers).toHaveLength(2);
    
    // Should be sorted by total requests (descending)
    expect(result.powerUsers[0].user).toBe('power-user-1');
    expect(result.powerUsers[0].totalRequests).toBe(35); // 15 + 8 + 12
    expect(result.powerUsers[1].user).toBe('power-user-2');
    expect(result.powerUsers[1].totalRequests).toBe(20);
  });

  it('should calculate total power user requests correctly', () => {
    const result = getPowerUsers(mockData);
    
    expect(result.totalPowerUserRequests).toBe(55); // 35 + 20
  });

  it('should aggregate requests by model for power users', () => {
    const result = getPowerUsers(mockData);
    
    const powerUser1 = result.powerUsers.find(u => u.user === 'power-user-1');
    expect(powerUser1?.requestsByModel).toEqual({
      'gpt-4': 27, // 15 + 12
      'gpt-3.5': 8
    });
    
    const powerUser2 = result.powerUsers.find(u => u.user === 'power-user-2');
    expect(powerUser2?.requestsByModel).toEqual({
      'claude': 20
    });
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
    
    expect(result.powerUserModelSummary).toHaveLength(3);
    
    // Should include models used by power users
    const gpt4Summary = result.powerUserModelSummary.find(m => m.model === 'gpt-4');
    expect(gpt4Summary?.totalRequests).toBe(27);
    expect(gpt4Summary?.compliantRequests).toBe(15);
    expect(gpt4Summary?.exceedingRequests).toBe(12);
    
    const claudeSummary = result.powerUserModelSummary.find(m => m.model === 'claude');
    expect(claudeSummary?.totalRequests).toBe(20);
    
    const gpt35Summary = result.powerUserModelSummary.find(m => m.model === 'gpt-3.5');
    expect(gpt35Summary?.totalRequests).toBe(8);
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
    
    expect(result.totalPowerUsers).toBe(0);
    expect(result.powerUsers).toHaveLength(0);
    expect(result.totalPowerUserRequests).toBe(0);
    expect(result.powerUserModelSummary).toHaveLength(0);
  });

  it('should generate daily data aggregated across all power users', () => {
    const result = getPowerUsers(mockData);
    const dailyData = getPowerUserDailyData(result.powerUsers);
    
    expect(dailyData).toEqual([
      { date: '2025-01-01', requests: 43 }, // power-user-1: 23 + power-user-2: 20
      { date: '2025-01-02', requests: 12 }  // power-user-1: 12
    ]);
  });

  it('should use correct power user threshold', () => {
    expect(POWER_USER_THRESHOLD).toBe(10);
    
    // Test with user exactly at threshold
    const thresholdData: CopilotUsageData[] = [
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        user: 'threshold-user',
        model: 'gpt-4',
        requestsUsed: 10,
        exceedsQuota: false,
        totalMonthlyQuota: '100'
      }
    ];
    
    const result = getPowerUsers(thresholdData);
    expect(result.totalPowerUsers).toBe(0); // Should not be a power user (needs > threshold)
  });
});