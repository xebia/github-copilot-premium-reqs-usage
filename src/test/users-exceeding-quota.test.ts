import { describe, it, expect } from 'vitest';
import { getUniqueUsersExceedingQuota, COPILOT_PLANS } from '@/lib/utils';
import type { CopilotUsageData } from '@/lib/utils';

describe('Users Exceeding Quota', () => {
  const mockData: CopilotUsageData[] = [
    {
      timestamp: new Date('2025-01-01T10:00:00Z'),
      user: 'user1', // 10 + 5 + 3 = 18 total requests (under all plan limits)
      model: 'gpt-4o-2024-11-20',
      requestsUsed: 10,
      exceedsQuota: false,
      totalMonthlyQuota: '50'
    },
    {
      timestamp: new Date('2025-01-01T11:00:00Z'),
      user: 'user1',
      model: 'gpt-4o-2024-11-20',
      requestsUsed: 5,
      exceedsQuota: true, // This is irrelevant now - we count total usage
      totalMonthlyQuota: '50'
    },
    {
      timestamp: new Date('2025-01-01T12:00:00Z'),
      user: 'user2', // 20 + 15 = 35 total requests (under Individual plan limit of 50)
      model: 'gpt-4.1-2025-04-14',
      requestsUsed: 20,
      exceedsQuota: true, // This is irrelevant now
      totalMonthlyQuota: '50'
    },
    {
      timestamp: new Date('2025-01-02T10:00:00Z'),
      user: 'user1',
      model: 'gpt-4o-2024-11-20',
      requestsUsed: 3,
      exceedsQuota: true, // This is irrelevant now
      totalMonthlyQuota: '50'
    },
    {
      timestamp: new Date('2025-01-01T15:00:00Z'),
      user: 'user3', // 8 + 20 = 28 total requests (under Individual plan limit of 50)
      model: 'claude-3',
      requestsUsed: 8,
      exceedsQuota: false,
      totalMonthlyQuota: '50'
    },
    {
      timestamp: new Date('2025-01-02T11:00:00Z'),
      user: 'user2',
      model: 'gpt-4o-2024-11-20',
      requestsUsed: 15,
      exceedsQuota: false,
      totalMonthlyQuota: '50'
    },
    {
      timestamp: new Date('2025-01-03T11:00:00Z'),
      user: 'user3',
      model: 'gpt-4o-2024-11-20',
      requestsUsed: 20,
      exceedsQuota: false,
      totalMonthlyQuota: '50'
    },
    {
      timestamp: new Date('2025-01-04T11:00:00Z'),
      user: 'user4', // 60 total requests (exceeds Individual plan limit of 50)
      model: 'gpt-4o-2024-11-20',
      requestsUsed: 60,
      exceedsQuota: false, // exceedsQuota flag is irrelevant now
      totalMonthlyQuota: '50'
    }
  ];

  it('should count users who exceed Individual plan limit (50 requests)', () => {
    const result = getUniqueUsersExceedingQuota(mockData, COPILOT_PLANS.INDIVIDUAL);
    
    // user1: 18 requests (under limit)
    // user2: 35 requests (under limit) 
    // user3: 28 requests (under limit)
    // user4: 60 requests (exceeds 50 limit)
    // So only 1 user (user4) exceeds Individual plan limit
    expect(result).toBe(1);
  });

  it('should count users who exceed Business plan limit (300 requests)', () => {
    const result = getUniqueUsersExceedingQuota(mockData, COPILOT_PLANS.BUSINESS);
    
    // user1: 18 requests (under 300 limit)
    // user2: 35 requests (under 300 limit)
    // user3: 28 requests (under 300 limit)
    // user4: 60 requests (under 300 limit)
    // No users exceed Business plan limit of 300
    expect(result).toBe(0);
  });

  it('should default to Business plan when no plan specified', () => {
    const result = getUniqueUsersExceedingQuota(mockData);
    
    // Should use Business plan limit (300) by default
    // No users have >300 requests, so result should be 0
    expect(result).toBe(0);
  });

  it('should count users who exceed Enterprise plan limit (1000 requests)', () => {
    const heavyUsageData: CopilotUsageData[] = [
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        user: 'heavy-user1',
        model: 'gpt-4o-2024-11-20',
        requestsUsed: 1500, // Exceeds Enterprise limit of 1000
        exceedsQuota: false,
        totalMonthlyQuota: '1000'
      },
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        user: 'normal-user',
        model: 'gpt-4o-2024-11-20',
        requestsUsed: 500, // Under Enterprise limit
        exceedsQuota: false,
        totalMonthlyQuota: '1000'
      }
    ];
    
    const result = getUniqueUsersExceedingQuota(heavyUsageData, COPILOT_PLANS.ENTERPRISE);
    
    // heavy-user1: 1500 requests (exceeds 1000 limit)
    // normal-user: 500 requests (under 1000 limit)
    // So 1 user exceeds Enterprise plan limit
    expect(result).toBe(1);
  });

  it('should return 0 when no users exceed quota', () => {
    const lightUsageData: CopilotUsageData[] = [
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        user: 'user1',
        model: 'gpt-4o-2024-11-20',
        requestsUsed: 10,
        exceedsQuota: false,
        totalMonthlyQuota: '50'
      },
      {
        timestamp: new Date('2025-01-01T11:00:00Z'),
        user: 'user2',
        model: 'gpt-4.1-2025-04-14',
        requestsUsed: 5,
        exceedsQuota: false,
        totalMonthlyQuota: '50'
      }
    ];
    
    const result = getUniqueUsersExceedingQuota(lightUsageData, COPILOT_PLANS.INDIVIDUAL);
    
    // user1: 10 requests (under 50 limit)
    // user2: 5 requests (under 50 limit)
    expect(result).toBe(0);
  });

  it('should return 0 for empty data', () => {
    const result = getUniqueUsersExceedingQuota([]);
    expect(result).toBe(0);
  });

  it('should aggregate multiple requests per user correctly', () => {
    const multipleRequestsData: CopilotUsageData[] = [
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        user: 'power-user',
        model: 'gpt-4o-2024-11-20',
        requestsUsed: 25,
        exceedsQuota: false,
        totalMonthlyQuota: '50'
      },
      {
        timestamp: new Date('2025-01-02T10:00:00Z'),
        user: 'power-user',
        model: 'gpt-4o-2024-11-20',
        requestsUsed: 20,
        exceedsQuota: false,
        totalMonthlyQuota: '50'
      },
      {
        timestamp: new Date('2025-01-03T10:00:00Z'),
        user: 'power-user',
        model: 'gpt-4.1-2025-04-14',
        requestsUsed: 10,
        exceedsQuota: false,
        totalMonthlyQuota: '50'
      }
    ];
    
    const result = getUniqueUsersExceedingQuota(multipleRequestsData, COPILOT_PLANS.INDIVIDUAL);
    
    // power-user: 25 + 20 + 10 = 55 total requests (exceeds 50 limit)
    expect(result).toBe(1);
  });
});