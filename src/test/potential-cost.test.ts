import { describe, it, expect } from 'vitest';
import { CopilotUsageData, EXCESS_REQUEST_COST } from '../lib/utils';

describe('Potential Cost Calculation', () => {
  it('should correctly calculate potential cost for sample data', () => {
    const mockData: CopilotUsageData[] = [
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        user: 'user1',
        model: 'gpt-4o-2024-11-20',
        requestsUsed: 10,
        exceedsQuota: false,
        totalMonthlyQuota: '500'
      },
      {
        timestamp: new Date('2025-01-01T11:00:00Z'),
        user: 'user2',
        model: 'gpt-4.1-2025-04-14',
        requestsUsed: 5,
        exceedsQuota: false,
        totalMonthlyQuota: '500'
      },
      {
        timestamp: new Date('2025-01-01T12:00:00Z'),
        user: 'user3',
        model: 'o3-mini-2025-01-31',
        requestsUsed: 15,
        exceedsQuota: true,
        totalMonthlyQuota: '500'
      }
    ];

    // Calculate total requests
    const totalRequests = mockData.reduce((sum, item) => sum + item.requestsUsed, 0);
    expect(totalRequests).toBe(30); // 10 + 5 + 15

    // Calculate potential cost
    const potentialCost = totalRequests * EXCESS_REQUEST_COST;
    expect(potentialCost).toBe(1.2); // 30 * 0.04

    // Verify EXCESS_REQUEST_COST is as expected
    expect(EXCESS_REQUEST_COST).toBe(0.04);
  });

  it('should handle decimal request values correctly', () => {
    const mockData: CopilotUsageData[] = [
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        user: 'user1',
        model: 'gpt-4o-2024-11-20',
        requestsUsed: 2.5,
        exceedsQuota: false,
        totalMonthlyQuota: '500'
      },
      {
        timestamp: new Date('2025-01-01T11:00:00Z'),
        user: 'user2',
        model: 'gpt-4.1-2025-04-14',
        requestsUsed: 1.25,
        exceedsQuota: false,
        totalMonthlyQuota: '500'
      }
    ];

    const totalRequests = mockData.reduce((sum, item) => sum + item.requestsUsed, 0);
    expect(totalRequests).toBe(3.75); // 2.5 + 1.25

    const potentialCost = totalRequests * EXCESS_REQUEST_COST;
    expect(potentialCost).toBe(0.15); // 3.75 * 0.04 = 0.15
  });

  it('should return zero cost for empty data', () => {
    const mockData: CopilotUsageData[] = [];

    const totalRequests = mockData.reduce((sum, item) => sum + item.requestsUsed, 0);
    expect(totalRequests).toBe(0);

    const potentialCost = totalRequests * EXCESS_REQUEST_COST;
    expect(potentialCost).toBe(0);
  });
});