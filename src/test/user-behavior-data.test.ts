import { describe, it, expect } from 'vitest';
import { getUserBehaviorData, CopilotUsageData, COPILOT_PLANS } from '../lib/utils';

/**
 * Builds a CopilotUsageData array for a single user with controlled metrics.
 *
 * @param requests - Array of {date (YYYY-MM-DD), model, amount} tuples. All in April 2025 (30 days).
 */
function makeUserData(
  user: string,
  requests: Array<{ date: string; model: string; amount: number }>,
): CopilotUsageData[] {
  return requests.map(r => ({
    timestamp: new Date(`${r.date}T12:00:00.000Z`),
    user,
    model: r.model,
    requestsUsed: r.amount,
    exceedsQuota: false,
    totalMonthlyQuota: '300',
  }));
}

// Helper: creates N dates of uniform usage for a user, spread across the month of April 2025
function uniformUsageData(
  user: string,
  model: string,
  numDays: number,
  requestsPerDay: number,
  startDayOfMonth = 1,
): CopilotUsageData[] {
  return Array.from({ length: numDays }, (_, i) => ({
    timestamp: new Date(Date.UTC(2025, 3, startDayOfMonth + i, 12)),
    user,
    model,
    requestsUsed: requestsPerDay,
    exceedsQuota: false,
    totalMonthlyQuota: '300',
  }));
}

describe('getUserBehaviorData', () => {
  it('should return empty array for empty input', () => {
    expect(getUserBehaviorData([])).toEqual([]);
  });

  describe('Low Engagement Users', () => {
    it('should classify user with very few requests and few active days as Low Engagement', () => {
      // April has 30 days; Business plan limit = 300
      // utilizationPct = 10/300 = 3.3% < 15%, activeDaysPct = 1/30 = 3.3% < 20%
      const data = makeUserData('alice', [{ date: '2025-04-01', model: 'gpt-4', amount: 10 }]);
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result).toHaveLength(1);
      expect(result[0].behaviorSegment).toBe('Low Engagement Users');
    });

    it('Low Engagement wins over Model Loyalist when both conditions satisfied', () => {
      // Use a single model (loyalist-eligible) but very low engagement
      const data = makeUserData('alice', [{ date: '2025-04-01', model: 'gpt-4', amount: 5 }]);
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).toBe('Low Engagement Users');
    });

    it('should NOT classify as Low Engagement when utilizationPct is at/above 15%', () => {
      // utilizationPct = 45/300 = 15% (on the boundary – not < 15%)
      const data = uniformUsageData('alice', 'gpt-4', 1, 45);
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).not.toBe('Low Engagement Users');
    });

    it('should NOT classify as Low Engagement when activeDaysPct is at/above 20%', () => {
      // 6/30 = 20% active days (on the boundary – not < 20%)
      const data = uniformUsageData('alice', 'gpt-4', 6, 1);
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).not.toBe('Low Engagement Users');
    });
  });

  describe('Steady Users', () => {
    it('should classify consistent, high-utilisation user as Steady', () => {
      // April 2025: 30 days. Business limit 300.
      // 20 days uniform usage of 12 requests = 240 total
      // utilizationPct = 240/300 = 80% >= 70% ✓
      // activeDaysPct  = 20/30 = 66.7% >= 45% ✓
      // frontloadIndex: 2 of 20 active days fall in first week (Apr 1-7) → 24/240 = 10% <= 45% ✓
      // dailyVariability = stdDev(12,12,...)/12 = 0 <= 1.35 ✓
      const data = uniformUsageData('alice', 'gpt-4', 20, 12);
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).toBe('Steady Users');
    });

    it('should NOT classify as Steady when utilizationPct is below 70%', () => {
      // 14 * 12 = 168 = 56% utilisation
      const data = uniformUsageData('alice', 'gpt-4', 14, 12);
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).not.toBe('Steady Users');
    });

    it('should NOT classify as Steady when frontloadIndex exceeds 0.45', () => {
      // All requests in week 1: 7 days × 30 = 210, frontloadIndex = 1.0 > 0.45
      const data = uniformUsageData('alice', 'gpt-4', 7, 30);
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).not.toBe('Steady Users');
    });
  });

  describe('Burst Users', () => {
    it('should classify high-utilisation user with most requests in first week as Burst', () => {
      // April has 30 days; limit = 300
      // First 7 days: 200 requests; remaining days: 80 requests total = 280 total
      // utilizationPct = 280/300 = 93% >= 70% ✓
      // frontloadIndex = 200/280 = 71% >= 55% ✓
      // activeDaysPct = (7+3)/30 = 33% – does NOT meet Steady (needs >= 45%), so falls to Burst check ✓
      const firstWeek = uniformUsageData('alice', 'gpt-4', 7, 200 / 7, 1);
      const restOfMonth = Array.from({ length: 3 }, (_, i) => ({
        timestamp: new Date(Date.UTC(2025, 3, 15 + i, 12)),
        user: 'alice',
        model: 'gpt-4',
        requestsUsed: 80 / 3,
        exceedsQuota: false,
        totalMonthlyQuota: '300',
      }));
      const data = [...firstWeek, ...restOfMonth];
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).toBe('Burst Users');
    });

    it('Burst Users NOT classified when frontloadIndex is below 0.55', () => {
      // Front-load of exactly 54% should not match Burst
      const firstWeek = uniformUsageData('alice', 'gpt-4', 7, 54 / 7, 1); // ~54% frontload
      const restOfMonth = uniformUsageData('alice', 'gpt-4', 13, 46 / 13, 8); // ~46% remaining
      const data = [...firstWeek, ...restOfMonth];
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).not.toBe('Burst Users');
    });
  });

  describe('Model Explorers', () => {
    it('should classify user using many models with no dominant model as Model Explorer', () => {
      // 4 models, each 25% of requests → topModelSharePct = 25% <= 60%, modelDiversity = 4 >= 4
      const data: CopilotUsageData[] = ['gpt-4', 'claude-3', 'gemini', 'llama'].map(model => ({
        timestamp: new Date('2025-04-05T12:00:00.000Z'),
        user: 'alice',
        model,
        requestsUsed: 25,
        exceedsQuota: false,
        totalMonthlyQuota: '300',
      }));
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).toBe('Model Explorers');
    });

    it('should NOT classify as Model Explorer when modelDiversity is below 4', () => {
      const data: CopilotUsageData[] = ['gpt-4', 'claude-3', 'gemini'].map(model => ({
        timestamp: new Date('2025-04-05T12:00:00.000Z'),
        user: 'alice',
        model,
        requestsUsed: 25,
        exceedsQuota: false,
        totalMonthlyQuota: '300',
      }));
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).not.toBe('Model Explorers');
    });

    it('should NOT classify as Model Explorer when top model share exceeds 60%', () => {
      // 4 models but gpt-4 dominates at 70%
      const data: CopilotUsageData[] = [
        { timestamp: new Date('2025-04-05T12:00:00.000Z'), user: 'alice', model: 'gpt-4', requestsUsed: 70, exceedsQuota: false, totalMonthlyQuota: '300' },
        { timestamp: new Date('2025-04-05T12:00:00.000Z'), user: 'alice', model: 'claude-3', requestsUsed: 10, exceedsQuota: false, totalMonthlyQuota: '300' },
        { timestamp: new Date('2025-04-05T12:00:00.000Z'), user: 'alice', model: 'gemini', requestsUsed: 10, exceedsQuota: false, totalMonthlyQuota: '300' },
        { timestamp: new Date('2025-04-05T12:00:00.000Z'), user: 'alice', model: 'llama', requestsUsed: 10, exceedsQuota: false, totalMonthlyQuota: '300' },
      ];
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).not.toBe('Model Explorers');
    });
  });

  describe('Model Loyalists', () => {
    it('should classify user using one model for almost all requests as Model Loyalist', () => {
      // modelDiversity = 2 <= 2, topModelSharePct = 90% >= 75%
      const data: CopilotUsageData[] = [
        { timestamp: new Date('2025-04-05T12:00:00.000Z'), user: 'alice', model: 'gpt-4', requestsUsed: 90, exceedsQuota: false, totalMonthlyQuota: '300' },
        { timestamp: new Date('2025-04-05T12:00:00.000Z'), user: 'alice', model: 'claude-3', requestsUsed: 10, exceedsQuota: false, totalMonthlyQuota: '300' },
      ];
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).toBe('Model Loyalists');
    });

    it('should NOT classify as Loyalist when topModelSharePct is below 75%', () => {
      // 2 models, 60/40 split
      const data: CopilotUsageData[] = [
        { timestamp: new Date('2025-04-05T12:00:00.000Z'), user: 'alice', model: 'gpt-4', requestsUsed: 60, exceedsQuota: false, totalMonthlyQuota: '300' },
        { timestamp: new Date('2025-04-05T12:00:00.000Z'), user: 'alice', model: 'claude-3', requestsUsed: 40, exceedsQuota: false, totalMonthlyQuota: '300' },
      ];
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).not.toBe('Model Loyalists');
    });

    it('should NOT classify as Loyalist when modelDiversity exceeds 2', () => {
      // 3 models, gpt-4 dominates at 80% but diversity is 3
      const data: CopilotUsageData[] = [
        { timestamp: new Date('2025-04-05T12:00:00.000Z'), user: 'alice', model: 'gpt-4', requestsUsed: 80, exceedsQuota: false, totalMonthlyQuota: '300' },
        { timestamp: new Date('2025-04-05T12:00:00.000Z'), user: 'alice', model: 'claude-3', requestsUsed: 10, exceedsQuota: false, totalMonthlyQuota: '300' },
        { timestamp: new Date('2025-04-05T12:00:00.000Z'), user: 'alice', model: 'gemini', requestsUsed: 10, exceedsQuota: false, totalMonthlyQuota: '300' },
      ];
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).not.toBe('Model Loyalists');
    });
  });

  describe('Mixed Behavior', () => {
    it('should classify user that meets none of the above criteria as Mixed Behavior', () => {
      // Medium utilisation with 3 models, uneven but not extreme
      // utilizationPct = 60% (not Low Engagement), not enough for Steady/Burst,
      // 3 models so not Explorer, top model 55% so not Loyalist
      const data: CopilotUsageData[] = [
        { timestamp: new Date('2025-04-01T12:00:00.000Z'), user: 'alice', model: 'gpt-4', requestsUsed: 110, exceedsQuota: false, totalMonthlyQuota: '300' },
        { timestamp: new Date('2025-04-01T12:00:00.000Z'), user: 'alice', model: 'claude-3', requestsUsed: 50, exceedsQuota: false, totalMonthlyQuota: '300' },
        { timestamp: new Date('2025-04-01T12:00:00.000Z'), user: 'alice', model: 'gemini', requestsUsed: 20, exceedsQuota: false, totalMonthlyQuota: '300' },
      ];
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      expect(result[0].behaviorSegment).toBe('Mixed Behavior');
    });
  });

  describe('multiple users', () => {
    it('should classify multiple users independently', () => {
      const lowEngagement: CopilotUsageData[] = [{
        timestamp: new Date('2025-04-01T12:00:00.000Z'),
        user: 'low-user',
        model: 'gpt-4',
        requestsUsed: 5,
        exceedsQuota: false,
        totalMonthlyQuota: '300',
      }];
      const steadyUser: CopilotUsageData[] = uniformUsageData('steady-user', 'gpt-4', 20, 12);
      const allData = [...lowEngagement, ...steadyUser];
      const result = getUserBehaviorData(allData, COPILOT_PLANS.BUSINESS);
      expect(result).toHaveLength(2);
      const lowResult = result.find(r => r.user === 'low-user');
      const steadyResult = result.find(r => r.user === 'steady-user');
      expect(lowResult?.behaviorSegment).toBe('Low Engagement Users');
      expect(steadyResult?.behaviorSegment).toBe('Steady Users');
    });

    it('should sort results by totalRequests descending', () => {
      const user1: CopilotUsageData[] = uniformUsageData('big-user', 'gpt-4', 5, 50);
      const user2: CopilotUsageData[] = uniformUsageData('small-user', 'gpt-4', 1, 1);
      const result = getUserBehaviorData([...user1, ...user2], COPILOT_PLANS.BUSINESS);
      expect(result[0].user).toBe('big-user');
      expect(result[1].user).toBe('small-user');
    });
  });

  describe('data shape', () => {
    it('should include all required fields in each output point', () => {
      const data: CopilotUsageData[] = [{
        timestamp: new Date('2025-04-15T12:00:00.000Z'),
        user: 'alice',
        model: 'gpt-4',
        requestsUsed: 50,
        exceedsQuota: false,
        totalMonthlyQuota: '300',
      }];
      const result = getUserBehaviorData(data, COPILOT_PLANS.BUSINESS);
      const point = result[0];
      expect(typeof point.user).toBe('string');
      expect(typeof point.behaviorSegment).toBe('string');
      expect(typeof point.utilizationPct).toBe('number');
      expect(typeof point.activeDaysPct).toBe('number');
      expect(typeof point.modelDiversity).toBe('number');
      expect(typeof point.topModelSharePct).toBe('number');
      expect(typeof point.frontloadIndex).toBe('number');
      expect(typeof point.totalRequests).toBe('number');
    });
  });
});
