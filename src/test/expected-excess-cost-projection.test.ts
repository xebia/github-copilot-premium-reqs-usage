import { describe, expect, it } from 'vitest';
import {
  COPILOT_PLANS,
  type CopilotUsageData,
  getExpectedExcessCost,
} from '../lib/utils';

describe('getExpectedExcessCost projection behavior', () => {
  it('treats full March date-only data as full month (no projection path)', () => {
    const data: CopilotUsageData[] = [];

    // Full March (31 days), but total remains below 300.
    // If incorrectly treated as partial month (30 elapsed), this would project above 300 and return > 0.
    for (let day = 1; day <= 31; day++) {
      data.push({
        timestamp: new Date(`2026-03-${String(day).padStart(2, '0')}`),
        user: 'user-march',
        model: 'Claude Sonnet 4.6',
        requestsUsed: 9.6,
        exceedsQuota: false,
        totalMonthlyQuota: '300',
      });
    }

    const expectedCost = getExpectedExcessCost(data, COPILOT_PLANS.BUSINESS);
    expect(expectedCost).toBe(0);
  });

  it('projects excess cost for partial-month data even when users are currently below quota', () => {
    const data: CopilotUsageData[] = [];

    // June has 30 days. By June 10 this user is below 300, but projection exceeds it.
    for (let day = 1; day <= 10; day++) {
      data.push({
        timestamp: new Date(`2026-06-${String(day).padStart(2, '0')}T10:00:00Z`),
        user: 'user-a',
        model: 'Claude Sonnet 4.6',
        requestsUsed: 20,
        exceedsQuota: false,
        totalMonthlyQuota: '300',
      });
    }

    const expectedCost = getExpectedExcessCost(data, COPILOT_PLANS.BUSINESS);

    // Projected total: 200 current + (20/day * 20 remaining days) = 600
    // Projected excess over free quota: 600 - 300 = 300
    // Multiplier 1, cost $0.04/request => 300 * 1 * 0.04 = 12
    expect(expectedCost).toBeCloseTo(12, 6);
  });

  it('does not charge for projected usage when projected total stays within free quota', () => {
    const data: CopilotUsageData[] = [];

    // June has 30 days. 10/day over first 10 days projects to exactly 300.
    for (let day = 1; day <= 10; day++) {
      data.push({
        timestamp: new Date(`2026-06-${String(day).padStart(2, '0')}T10:00:00Z`),
        user: 'user-b',
        model: 'Claude Sonnet 4.6',
        requestsUsed: 10,
        exceedsQuota: false,
        totalMonthlyQuota: '300',
      });
    }

    const expectedCost = getExpectedExcessCost(data, COPILOT_PLANS.BUSINESS);
    expect(expectedCost).toBe(0);
  });

  it('keeps existing full-month behavior for users already above quota', () => {
    const data: CopilotUsageData[] = [];

    // Full June coverage; user is already above 300 and has paid-model usage throughout.
    for (let day = 1; day <= 30; day++) {
      data.push({
        timestamp: new Date(`2026-06-${String(day).padStart(2, '0')}T10:00:00Z`),
        user: 'user-c',
        model: 'Claude Sonnet 4.6',
        requestsUsed: 20,
        exceedsQuota: day > 15,
        totalMonthlyQuota: '300',
      });
    }

    const expectedCost = getExpectedExcessCost(data, COPILOT_PLANS.BUSINESS);

    // Existing algorithm: budget exhaustion at day 15, remaining 15 days at 20/day.
    // Cost = 15 * 20 * 0.04 = 12
    expect(expectedCost).toBeCloseTo(12, 6);
  });
});
