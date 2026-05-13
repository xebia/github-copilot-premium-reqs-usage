import { describe, it, expect } from 'vitest';
import {
  getProjectedUsersExceedingQuotaDetails,
  CopilotUsageData,
  COPILOT_PLANS,
} from '../lib/utils';

const makeItem = (
  date: string,
  user: string,
  model: string,
  requestsUsed: number,
): CopilotUsageData => ({
  timestamp: new Date(`${date}T10:00:00.000Z`),
  user,
  model,
  requestsUsed,
  exceedsQuota: false,
  totalMonthlyQuota: '300',
});

describe('getProjectedUsersExceedingQuotaDetails', () => {
  it('should return empty array for empty input', () => {
    expect(getProjectedUsersExceedingQuotaDetails([])).toEqual([]);
  });

  it('should return empty array when no user is on track to exceed the plan limit', () => {
    // Business plan limit = 300; user has 10 requests on day 15 of 30
    // daily avg = 10/15 ≈ 0.67; projected = 0.67 * 30 ≈ 20 << 300
    const data = [makeItem('2025-04-15', 'alice', 'gpt-4', 10)];
    const result = getProjectedUsersExceedingQuotaDetails(data, COPILOT_PLANS.BUSINESS);
    expect(result).toEqual([]);
  });

  it('should include user projected to exceed the plan limit', () => {
    // Business plan limit = 300
    // Day 10 of April (30-day month): 200 requests accumulated
    // daily avg = 200/10 = 20; projected = 20 * 30 = 600 > 300
    const data = Array.from({ length: 10 }, (_, i) =>
      makeItem(`2025-04-${String(i + 1).padStart(2, '0')}`, 'alice', 'gpt-4', 20),
    );
    const result = getProjectedUsersExceedingQuotaDetails(data, COPILOT_PLANS.BUSINESS);
    expect(result).toHaveLength(1);
    expect(result[0].user).toBe('alice');
    expect(result[0].currentRequests).toBe(200);
    expect(result[0].daysElapsed).toBe(10);
    expect(result[0].dailyAverage).toBeCloseTo(20);
    expect(result[0].projectedMonthlyTotal).toBeCloseTo(600);
  });

  it('should return correct projected details including daysElapsed and dailyAverage', () => {
    // Day 5 of April: 150 requests total
    const data = Array.from({ length: 5 }, (_, i) =>
      makeItem(`2025-04-${String(i + 1).padStart(2, '0')}`, 'alice', 'gpt-4', 30),
    );
    const result = getProjectedUsersExceedingQuotaDetails(data, COPILOT_PLANS.BUSINESS);
    expect(result).toHaveLength(1);
    expect(result[0].daysElapsed).toBe(5);
    expect(result[0].dailyAverage).toBeCloseTo(30);
    expect(result[0].projectedMonthlyTotal).toBeCloseTo(900); // 30 * 30
  });

  it('should handle multiple users and return all projected exceeders', () => {
    // alice: on track to exceed (same as above)
    // bob: low usage, will not exceed
    const aliceData = Array.from({ length: 10 }, (_, i) =>
      makeItem(`2025-04-${String(i + 1).padStart(2, '0')}`, 'alice', 'gpt-4', 20),
    );
    const bobData = [makeItem('2025-04-10', 'bob', 'gpt-4', 5)];
    const result = getProjectedUsersExceedingQuotaDetails(
      [...aliceData, ...bobData],
      COPILOT_PLANS.BUSINESS,
    );
    expect(result.length).toBe(1);
    expect(result[0].user).toBe('alice');
  });

  it('should sort results by projectedMonthlyTotal descending', () => {
    // alice: 30/day projected; bob: 25/day projected (both exceed 300)
    const aliceData = Array.from({ length: 10 }, (_, i) =>
      makeItem(`2025-04-${String(i + 1).padStart(2, '0')}`, 'alice', 'gpt-4', 30),
    );
    const bobData = Array.from({ length: 10 }, (_, i) =>
      makeItem(`2025-04-${String(i + 1).padStart(2, '0')}`, 'bob', 'gpt-4', 25),
    );
    const result = getProjectedUsersExceedingQuotaDetails(
      [...aliceData, ...bobData],
      COPILOT_PLANS.BUSINESS,
    );
    expect(result).toHaveLength(2);
    expect(result[0].user).toBe('alice');
    expect(result[1].user).toBe('bob');
  });

  it('should respect different plan limits', () => {
    // Individual plan limit = 50
    // Day 5 of April: 15 requests total → projected = (15/5)*30 = 90 > 50
    const data = Array.from({ length: 5 }, (_, i) =>
      makeItem(`2025-04-${String(i + 1).padStart(2, '0')}`, 'alice', 'gpt-4', 3),
    );
    const businessResult = getProjectedUsersExceedingQuotaDetails(data, COPILOT_PLANS.BUSINESS);
    const individualResult = getProjectedUsersExceedingQuotaDetails(data, COPILOT_PLANS.INDIVIDUAL);
    // 90 > 50 (Individual limit) but < 300 (Business limit)
    expect(businessResult).toHaveLength(0);
    expect(individualResult).toHaveLength(1);
  });
});
