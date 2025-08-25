import { describe, it, expect } from 'vitest';
import { CopilotUsageData, EXCESS_REQUEST_COST } from '../lib/utils';

describe('Potential Cost Dialog Calculations', () => {
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
      exceedsQuota: true, // This user exceeds quota
      totalMonthlyQuota: '500'
    },
    {
      timestamp: new Date('2025-01-01T13:00:00Z'),
      user: 'user3',
      model: 'gpt-4o-2024-11-20',
      requestsUsed: 8,
      exceedsQuota: true, // This user exceeds quota
      totalMonthlyQuota: '500'
    },
    {
      timestamp: new Date('2025-01-01T14:00:00Z'),
      user: 'user4',
      model: 'gpt-4.1-2025-04-14',
      requestsUsed: 12,
      exceedsQuota: true, // This user exceeds quota
      totalMonthlyQuota: '500'
    }
  ];

  it('should calculate total cost for all premium requests', () => {
    // Total: 10 + 5 + 15 + 8 + 12 = 50 requests
    const totalRequests = mockData.reduce((sum, item) => sum + item.requestsUsed, 0);
    expect(totalRequests).toBe(50);

    const totalCost = totalRequests * EXCESS_REQUEST_COST;
    expect(totalCost).toBe(2.0); // 50 * 0.04 = $2.00
  });

  it('should calculate cost for exceeding requests only', () => {
    // Exceeding requests: user3 (15 + 8) + user4 (12) = 35 requests
    const exceedingRequests = mockData
      .filter(item => item.exceedsQuota)
      .reduce((sum, item) => sum + item.requestsUsed, 0);
    
    expect(exceedingRequests).toBe(35); // 15 + 8 + 12

    const exceedingCost = exceedingRequests * EXCESS_REQUEST_COST;
    expect(exceedingCost).toBeCloseTo(1.4, 2); // 35 * 0.04 = $1.40, within 2 decimal places
  });

  it('should handle case with no exceeding requests', () => {
    const dataWithoutExceedingQuota: CopilotUsageData[] = [
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
      }
    ];

    const totalRequests = dataWithoutExceedingQuota.reduce((sum, item) => sum + item.requestsUsed, 0);
    const totalCost = totalRequests * EXCESS_REQUEST_COST;
    expect(totalCost).toBe(0.6); // 15 * 0.04 = $0.60

    const exceedingRequests = dataWithoutExceedingQuota
      .filter(item => item.exceedsQuota)
      .reduce((sum, item) => sum + item.requestsUsed, 0);
    const exceedingCost = exceedingRequests * EXCESS_REQUEST_COST;
    expect(exceedingCost).toBe(0.0); // No exceeding requests
  });

  it('should handle empty data correctly', () => {
    const emptyData: CopilotUsageData[] = [];

    const totalRequests = emptyData.reduce((sum, item) => sum + item.requestsUsed, 0);
    const totalCost = totalRequests * EXCESS_REQUEST_COST;
    expect(totalCost).toBe(0);

    const exceedingRequests = emptyData
      .filter(item => item.exceedsQuota)
      .reduce((sum, item) => sum + item.requestsUsed, 0);
    const exceedingCost = exceedingRequests * EXCESS_REQUEST_COST;
    expect(exceedingCost).toBe(0);
  });
});