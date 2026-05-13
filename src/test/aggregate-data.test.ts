import { describe, it, expect } from 'vitest';
import { aggregateDataByDay, getDailyModelData, CopilotUsageData } from '../lib/utils';

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

describe('aggregateDataByDay', () => {
  it('should return empty array for empty input', () => {
    expect(aggregateDataByDay([])).toEqual([]);
  });

  it('should aggregate a single item', () => {
    const data = [makeItem('2025-01-01', 'alice', 'gpt-4', 5, false)];
    const result = aggregateDataByDay(data);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: '2025-01-01',
      model: 'gpt-4',
      compliantRequests: 5,
      exceedingRequests: 0,
    });
  });

  it('should separate compliant and exceeding requests', () => {
    const data = [
      makeItem('2025-01-01', 'alice', 'gpt-4', 5, false),
      makeItem('2025-01-01', 'alice', 'gpt-4', 3, true),
    ];
    const result = aggregateDataByDay(data);
    expect(result).toHaveLength(1);
    expect(result[0].compliantRequests).toBe(5);
    expect(result[0].exceedingRequests).toBe(3);
  });

  it('should create separate entries for different models on the same day', () => {
    const data = [
      makeItem('2025-01-01', 'alice', 'gpt-4', 5, false),
      makeItem('2025-01-01', 'alice', 'claude-3', 8, false),
    ];
    const result = aggregateDataByDay(data);
    expect(result).toHaveLength(2);
    const gpt4 = result.find(r => r.model === 'gpt-4');
    const claude3 = result.find(r => r.model === 'claude-3');
    expect(gpt4?.compliantRequests).toBe(5);
    expect(claude3?.compliantRequests).toBe(8);
  });

  it('should create separate entries for different days', () => {
    const data = [
      makeItem('2025-01-01', 'alice', 'gpt-4', 5, false),
      makeItem('2025-01-02', 'alice', 'gpt-4', 10, false),
    ];
    const result = aggregateDataByDay(data);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2025-01-01');
    expect(result[1].date).toBe('2025-01-02');
  });

  it('should merge requests from different users into the same date/model bucket', () => {
    const data = [
      makeItem('2025-01-01', 'alice', 'gpt-4', 5, false),
      makeItem('2025-01-01', 'bob', 'gpt-4', 7, false),
      makeItem('2025-01-01', 'charlie', 'gpt-4', 2, true),
    ];
    const result = aggregateDataByDay(data);
    expect(result).toHaveLength(1);
    expect(result[0].compliantRequests).toBe(12);
    expect(result[0].exceedingRequests).toBe(2);
  });

  it('should sort results by date then model', () => {
    const data = [
      makeItem('2025-01-02', 'alice', 'gpt-4', 5, false),
      makeItem('2025-01-01', 'alice', 'zzz-model', 3, false),
      makeItem('2025-01-01', 'alice', 'aaa-model', 4, false),
    ];
    const result = aggregateDataByDay(data);
    expect(result[0]).toMatchObject({ date: '2025-01-01', model: 'aaa-model' });
    expect(result[1]).toMatchObject({ date: '2025-01-01', model: 'zzz-model' });
    expect(result[2]).toMatchObject({ date: '2025-01-02', model: 'gpt-4' });
  });

  it('should handle fractional request values', () => {
    const data = [
      makeItem('2025-01-01', 'alice', 'gpt-4', 1.5, false),
      makeItem('2025-01-01', 'alice', 'gpt-4', 2.25, true),
    ];
    const result = aggregateDataByDay(data);
    expect(result[0].compliantRequests).toBeCloseTo(1.5);
    expect(result[0].exceedingRequests).toBeCloseTo(2.25);
  });
});

describe('getDailyModelData', () => {
  it('should return empty array for empty input', () => {
    expect(getDailyModelData([])).toEqual([]);
  });

  it('should aggregate total requests for a single item', () => {
    const data = [makeItem('2025-01-01', 'alice', 'gpt-4', 5, false)];
    const result = getDailyModelData(data);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ date: '2025-01-01', model: 'gpt-4', requests: 5 });
  });

  it('should sum both compliant and exceeding requests together', () => {
    const data = [
      makeItem('2025-01-01', 'alice', 'gpt-4', 5, false),
      makeItem('2025-01-01', 'bob', 'gpt-4', 3, true),
    ];
    const result = getDailyModelData(data);
    expect(result).toHaveLength(1);
    expect(result[0].requests).toBe(8);
  });

  it('should create separate entries for different models on the same day', () => {
    const data = [
      makeItem('2025-01-01', 'alice', 'gpt-4', 5, false),
      makeItem('2025-01-01', 'alice', 'claude-3', 8, false),
    ];
    const result = getDailyModelData(data);
    expect(result).toHaveLength(2);
  });

  it('should sort by date then model', () => {
    const data = [
      makeItem('2025-01-02', 'alice', 'gpt-4', 1, false),
      makeItem('2025-01-01', 'alice', 'zzz-model', 2, false),
      makeItem('2025-01-01', 'alice', 'aaa-model', 3, false),
    ];
    const result = getDailyModelData(data);
    expect(result[0]).toMatchObject({ date: '2025-01-01', model: 'aaa-model' });
    expect(result[1]).toMatchObject({ date: '2025-01-01', model: 'zzz-model' });
    expect(result[2]).toMatchObject({ date: '2025-01-02', model: 'gpt-4' });
  });
});
