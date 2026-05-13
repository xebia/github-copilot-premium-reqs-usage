import { describe, it, expect } from 'vitest';
import {
  getExceededRequestDetails,
  getUserExceededRequestSummary,
  getExceededUsersOverview,
  CopilotUsageData,
} from '../lib/utils';

const makeItem = (
  date: string,
  user: string,
  model: string,
  requestsUsed: number,
  exceedsQuota: boolean,
): CopilotUsageData => ({
  timestamp: new Date(`${date}T10:00:00.000Z`),
  user,
  model,
  requestsUsed,
  exceedsQuota,
  totalMonthlyQuota: '300',
});

const sampleData: CopilotUsageData[] = [
  // alice: exceeds on Jan 1 and Jan 3
  makeItem('2025-01-01', 'alice', 'gpt-4', 5, false),
  makeItem('2025-01-01', 'alice', 'gpt-4', 10, true),
  makeItem('2025-01-01', 'alice', 'claude-3', 4, true),
  makeItem('2025-01-02', 'alice', 'gpt-4', 6, false),
  makeItem('2025-01-03', 'alice', 'gpt-4', 15, true),
  // bob: exceeds on Jan 2 only
  makeItem('2025-01-01', 'bob', 'gpt-4', 3, false),
  makeItem('2025-01-02', 'bob', 'gpt-4', 8, false),
  makeItem('2025-01-02', 'bob', 'claude-3', 12, true),
  // charlie: never exceeds
  makeItem('2025-01-01', 'charlie', 'gpt-4', 7, false),
];

describe('getExceededRequestDetails', () => {
  it('should return empty array for empty input', () => {
    expect(getExceededRequestDetails([])).toEqual([]);
  });

  it('should exclude users who never exceeded', () => {
    const result = getExceededRequestDetails(sampleData);
    const charlieEntries = result.filter(r => r.user === 'charlie');
    expect(charlieEntries).toHaveLength(0);
  });

  it('should return one entry per user per day with exceeded requests', () => {
    const result = getExceededRequestDetails(sampleData);
    const aliceEntries = result.filter(r => r.user === 'alice');
    expect(aliceEntries).toHaveLength(2); // Jan 1 and Jan 3
  });

  it('should correctly aggregate totals for a day', () => {
    const result = getExceededRequestDetails(sampleData);
    const aliceJan1 = result.find(r => r.user === 'alice' && r.date === '2025-01-01');
    expect(aliceJan1).toBeDefined();
    expect(aliceJan1!.exceededRequests).toBe(14); // 10 + 4
    expect(aliceJan1!.totalRequestsOnDay).toBe(19); // 5 + 10 + 4
    expect(aliceJan1!.compliantRequestsOnDay).toBe(5);
  });

  it('should track modelsUsed and exceedingByModel', () => {
    const result = getExceededRequestDetails(sampleData);
    const aliceJan1 = result.find(r => r.user === 'alice' && r.date === '2025-01-01');
    expect(aliceJan1!.modelsUsed).toContain('gpt-4');
    expect(aliceJan1!.modelsUsed).toContain('claude-3');
    expect(aliceJan1!.exceedingByModel['gpt-4']).toBe(10);
    expect(aliceJan1!.exceedingByModel['claude-3']).toBe(4);
  });

  it('should filter by target date', () => {
    const result = getExceededRequestDetails(sampleData, '2025-01-02');
    expect(result).toHaveLength(1);
    expect(result[0].user).toBe('bob');
    expect(result[0].date).toBe('2025-01-02');
  });

  it('should filter by target user', () => {
    const result = getExceededRequestDetails(sampleData, undefined, 'alice');
    const aliceOnly = result.every(r => r.user === 'alice');
    expect(aliceOnly).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('should filter by both date and user', () => {
    const result = getExceededRequestDetails(sampleData, '2025-01-01', 'alice');
    expect(result).toHaveLength(1);
    expect(result[0].user).toBe('alice');
    expect(result[0].date).toBe('2025-01-01');
  });

  it('should sort by date descending, then by exceeded requests descending', () => {
    const result = getExceededRequestDetails(sampleData);
    // Most recent date first
    expect(result[0].date >= result[result.length - 1].date).toBe(true);
    // For same date, highest exceeded requests first
    const jan1Entries = result.filter(r => r.date === '2025-01-01');
    if (jan1Entries.length > 1) {
      expect(jan1Entries[0].exceededRequests >= jan1Entries[1].exceededRequests).toBe(true);
    }
  });
});

describe('getUserExceededRequestSummary', () => {
  it('should return zeroed summary for user with no exceeded requests', () => {
    const result = getUserExceededRequestSummary(sampleData, 'charlie');
    expect(result.totalExceededDays).toBe(0);
    expect(result.totalExceededRequests).toBe(0);
    expect(result.averageExceededPerDay).toBe(0);
    expect(result.worstDay).toBeNull();
  });

  it('should return zeroed summary for non-existent user', () => {
    const result = getUserExceededRequestSummary(sampleData, 'nobody');
    expect(result.totalExceededDays).toBe(0);
    expect(result.worstDay).toBeNull();
  });

  it('should calculate correct summary for user with exceeded requests', () => {
    const result = getUserExceededRequestSummary(sampleData, 'alice');
    expect(result.totalExceededDays).toBe(2);
    expect(result.totalExceededRequests).toBe(29); // 14 (Jan 1) + 15 (Jan 3)
    expect(result.averageExceededPerDay).toBeCloseTo(14.5);
  });

  it('should identify the worst day correctly', () => {
    const result = getUserExceededRequestSummary(sampleData, 'alice');
    expect(result.worstDay).not.toBeNull();
    // Alice's worst day is Jan 3 with 15 exceeded requests (vs Jan 1 with 14)
    expect(result.worstDay!.date).toBe('2025-01-03');
    expect(result.worstDay!.exceededRequests).toBe(15);
  });

  it('should handle user with exactly one exceeded day', () => {
    const result = getUserExceededRequestSummary(sampleData, 'bob');
    expect(result.totalExceededDays).toBe(1);
    expect(result.totalExceededRequests).toBe(12);
    expect(result.averageExceededPerDay).toBe(12);
    expect(result.worstDay!.date).toBe('2025-01-02');
  });
});

describe('getExceededUsersOverview', () => {
  it('should return empty array for empty input', () => {
    expect(getExceededUsersOverview([])).toEqual([]);
  });

  it('should return empty array when no user has exceeded requests', () => {
    const noExceedData = sampleData.filter(item => !item.exceedsQuota);
    expect(getExceededUsersOverview(noExceedData)).toEqual([]);
  });

  it('should include only users who exceeded at least once', () => {
    const result = getExceededUsersOverview(sampleData);
    const usernames = result.map(r => r.user);
    expect(usernames).toContain('alice');
    expect(usernames).toContain('bob');
    expect(usernames).not.toContain('charlie');
  });

  it('should calculate correct per-user totals', () => {
    const result = getExceededUsersOverview(sampleData);
    const alice = result.find(r => r.user === 'alice');
    expect(alice).toBeDefined();
    expect(alice!.daysExceeded).toBe(2);
    expect(alice!.totalExceededRequests).toBe(29); // 14 + 15
    expect(alice!.totalRequestsOnExceededDays).toBe(34); // 19 (Jan 1) + 15 (Jan 3)
    expect(alice!.compliantRequestsOnExceededDays).toBe(5); // Only Jan 1 had compliant (6 on Jan 2 is not an exceeded day)
  });

  it('should track the worst day per user', () => {
    const result = getExceededUsersOverview(sampleData);
    const alice = result.find(r => r.user === 'alice');
    expect(alice!.worstDay.date).toBe('2025-01-03');
    expect(alice!.worstDay.exceededRequests).toBe(15);
  });

  it('should sort by totalExceededRequests descending', () => {
    const result = getExceededUsersOverview(sampleData);
    // alice has 29 exceeded requests, bob has 12
    expect(result[0].user).toBe('alice');
    expect(result[1].user).toBe('bob');
  });
});
