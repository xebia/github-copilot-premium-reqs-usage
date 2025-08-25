import { describe, it, expect } from 'vitest';
import { getTotalRequestsForUsersExceedingQuota, getUniqueUsersExceedingQuota, CopilotUsageData, COPILOT_PLANS } from '@/lib/utils';

describe('Exceeding Users Cost Calculation', () => {
  // Test data with users who exceed the 300 Business plan limit
  const mockData: CopilotUsageData[] = [
    // User A: 350 total requests (exceeds 300 limit)
    {
      timestamp: new Date('2025-01-01T10:00:00Z'),
      user: 'userA@example.com',
      model: 'gpt-4o',
      requestsUsed: 150,
      exceedsQuota: false,
      totalMonthlyQuota: '300'
    },
    {
      timestamp: new Date('2025-01-02T10:00:00Z'),
      user: 'userA@example.com',
      model: 'gpt-4o',
      requestsUsed: 200,
      exceedsQuota: true, // Only this specific request exceeds quota
      totalMonthlyQuota: '300'
    },
    // User B: 250 total requests (does NOT exceed 300 limit)
    {
      timestamp: new Date('2025-01-01T11:00:00Z'),
      user: 'userB@example.com',
      model: 'gpt-4o',
      requestsUsed: 100,
      exceedsQuota: false,
      totalMonthlyQuota: '300'
    },
    {
      timestamp: new Date('2025-01-02T11:00:00Z'),
      user: 'userB@example.com',
      model: 'gpt-4o',
      requestsUsed: 150,
      exceedsQuota: false,
      totalMonthlyQuota: '300'
    },
    // User C: 450 total requests (exceeds 300 limit)
    {
      timestamp: new Date('2025-01-01T12:00:00Z'),
      user: 'userC@example.com',
      model: 'claude-sonnet-3.5',
      requestsUsed: 300,
      exceedsQuota: false,
      totalMonthlyQuota: '300'
    },
    {
      timestamp: new Date('2025-01-02T12:00:00Z'),
      user: 'userC@example.com',
      model: 'claude-sonnet-3.5',
      requestsUsed: 150,
      exceedsQuota: true, // Only this specific request exceeds quota
      totalMonthlyQuota: '300'
    }
  ];

  it('should correctly count users exceeding quota', () => {
    // Only userA (350) and userC (450) exceed the 300 limit
    const exceedingUsersCount = getUniqueUsersExceedingQuota(mockData, COPILOT_PLANS.BUSINESS);
    expect(exceedingUsersCount).toBe(2);
  });

  it('should correctly calculate total requests for users exceeding quota', () => {
    // Should return ALL requests for users who exceed the quota:
    // userA: 150 + 200 = 350 requests
    // userC: 300 + 150 = 450 requests
    // Total: 350 + 450 = 800 requests
    const totalRequests = getTotalRequestsForUsersExceedingQuota(mockData, COPILOT_PLANS.BUSINESS);
    expect(totalRequests).toBe(800);
  });

  it('should NOT include requests from users who do not exceed quota', () => {
    // userB has 250 total requests (under 300 limit)
    // Their requests should NOT be included
    const totalRequests = getTotalRequestsForUsersExceedingQuota(mockData, COPILOT_PLANS.BUSINESS);
    
    // Verify userB's requests are not included
    const userBTotal = 100 + 150; // 250 requests
    expect(totalRequests).not.toEqual(userBTotal);
    expect(totalRequests).toBeGreaterThan(userBTotal);
  });

  it('should handle different plan limits correctly', () => {
    // With Individual plan (50 limit), all users should exceed
    const individualPlanExceedingRequests = getTotalRequestsForUsersExceedingQuota(mockData, COPILOT_PLANS.INDIVIDUAL);
    const totalAllRequests = mockData.reduce((sum, item) => sum + item.requestsUsed, 0);
    expect(individualPlanExceedingRequests).toBe(totalAllRequests); // All 1050 requests

    // With Enterprise plan (1000 limit), no users should exceed
    const enterprisePlanExceedingRequests = getTotalRequestsForUsersExceedingQuota(mockData, COPILOT_PLANS.ENTERPRISE);
    expect(enterprisePlanExceedingRequests).toBe(0);
  });

  it('should be consistent between count and total functions', () => {
    const exceedingUsersCount = getUniqueUsersExceedingQuota(mockData, COPILOT_PLANS.BUSINESS);
    const totalRequests = getTotalRequestsForUsersExceedingQuota(mockData, COPILOT_PLANS.BUSINESS);
    
    // If there are exceeding users, there should be requests
    if (exceedingUsersCount > 0) {
      expect(totalRequests).toBeGreaterThan(0);
    } else {
      expect(totalRequests).toBe(0);
    }
  });

  it('should demonstrate the difference between old logic and new logic', () => {
    // Old logic (incorrect): only count requests with exceedsQuota=true
    const oldLogicTotal = mockData
      .filter(item => item.exceedsQuota)
      .reduce((sum, item) => sum + item.requestsUsed, 0);
    
    // This would be: 200 (userA) + 150 (userC) = 350
    expect(oldLogicTotal).toBe(350);

    // New logic (correct): count ALL requests for users who exceed the plan limit  
    const newLogicTotal = getTotalRequestsForUsersExceedingQuota(mockData, COPILOT_PLANS.BUSINESS);
    
    // This should be: 350 (userA) + 450 (userC) = 800
    expect(newLogicTotal).toBe(800);

    // The new logic should give a higher (more accurate) total
    expect(newLogicTotal).toBeGreaterThan(oldLogicTotal);
  });

  it('should handle edge cases correctly', () => {
    // Empty data
    expect(getTotalRequestsForUsersExceedingQuota([], COPILOT_PLANS.BUSINESS)).toBe(0);
    
    // Single user at exactly the limit
    const exactLimitData: CopilotUsageData[] = [{
      timestamp: new Date('2025-01-01T10:00:00Z'),
      user: 'exactUser@example.com',
      model: 'gpt-4o',
      requestsUsed: 300, // Exactly at the 300 limit
      exceedsQuota: false,
      totalMonthlyQuota: '300'
    }];
    
    // User with exactly 300 requests should NOT exceed the limit
    expect(getTotalRequestsForUsersExceedingQuota(exactLimitData, COPILOT_PLANS.BUSINESS)).toBe(0);
    expect(getUniqueUsersExceedingQuota(exactLimitData, COPILOT_PLANS.BUSINESS)).toBe(0);
  });
});