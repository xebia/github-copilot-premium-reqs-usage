import { describe, it, expect } from 'vitest';
import { getDailyOveruserPercentage } from '@/lib/utils';
import type { CopilotUsageData } from '@/lib/utils';

const base: Omit<CopilotUsageData, 'timestamp' | 'user' | 'exceedsQuota'> = {
  model: 'gpt-4o',
  requestsUsed: 1,
  totalMonthlyQuota: '50',
};

describe('getDailyOveruserPercentage (cumulative)', () => {
  it('returns empty array for empty input', () => {
    expect(getDailyOveruserPercentage([])).toEqual([]);
  });

  it('accumulates overusers across days', () => {
    const data: CopilotUsageData[] = [
      // Day 1: user1 overages, user2 does not
      { ...base, timestamp: new Date('2025-01-01T10:00:00Z'), user: 'user1', exceedsQuota: true },
      { ...base, timestamp: new Date('2025-01-01T11:00:00Z'), user: 'user2', exceedsQuota: false },
      // Day 2: user2 now overages, user3 is new and does not overage
      { ...base, timestamp: new Date('2025-01-02T10:00:00Z'), user: 'user2', exceedsQuota: true },
      { ...base, timestamp: new Date('2025-01-02T11:00:00Z'), user: 'user3', exceedsQuota: false },
    ];

    const result = getDailyOveruserPercentage(data);

    expect(result).toHaveLength(2);

    // Day 1: 1 overuser out of 2 total users = 50%
    expect(result[0].date).toBe('2025-01-01');
    expect(result[0].overusers).toBe(1);
    expect(result[0].totalUsers).toBe(2);
    expect(result[0].percentage).toBeCloseTo(50);

    // Day 2: 2 cumulative overusers (user1 from day1, user2 from day2)
    //        out of 3 cumulative total users = 66.67%
    expect(result[1].date).toBe('2025-01-02');
    expect(result[1].overusers).toBe(2);
    expect(result[1].totalUsers).toBe(3);
    expect(result[1].percentage).toBeCloseTo(66.67, 1);
  });

  it('does not double-count a user who overages on multiple days', () => {
    const data: CopilotUsageData[] = [
      { ...base, timestamp: new Date('2025-01-01T10:00:00Z'), user: 'user1', exceedsQuota: true },
      { ...base, timestamp: new Date('2025-01-02T10:00:00Z'), user: 'user1', exceedsQuota: true },
    ];

    const result = getDailyOveruserPercentage(data);

    // Day 2: still only 1 unique cumulative overuser
    expect(result[1].overusers).toBe(1);
    expect(result[1].totalUsers).toBe(1);
    expect(result[1].percentage).toBeCloseTo(100);
  });

  it('percentage is non-decreasing when new users overage on later days', () => {
    const data: CopilotUsageData[] = [
      { ...base, timestamp: new Date('2025-01-01T10:00:00Z'), user: 'user1', exceedsQuota: false },
      { ...base, timestamp: new Date('2025-01-02T10:00:00Z'), user: 'user1', exceedsQuota: true },
    ];

    const result = getDailyOveruserPercentage(data);

    expect(result[0].percentage).toBe(0);
    expect(result[1].percentage).toBe(100);
  });

  it('returns results sorted by date', () => {
    const data: CopilotUsageData[] = [
      { ...base, timestamp: new Date('2025-01-03T10:00:00Z'), user: 'user1', exceedsQuota: false },
      { ...base, timestamp: new Date('2025-01-01T10:00:00Z'), user: 'user2', exceedsQuota: false },
      { ...base, timestamp: new Date('2025-01-02T10:00:00Z'), user: 'user3', exceedsQuota: false },
    ];

    const result = getDailyOveruserPercentage(data);
    const dates = result.map(r => r.date);
    expect(dates).toEqual(['2025-01-01', '2025-01-02', '2025-01-03']);
  });
});
