import { describe, it, expect } from 'vitest'
import { parseCSV, getUserAnalysisData } from '../lib/utils'

describe('User Analysis Functionality', () => {
  const testCSV = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-01-01T09:00:00.000Z","alice.smith","gpt-4o-2024-11-20","5","False","Unlimited"
"2025-01-01T10:30:00.000Z","bob.jones","gpt-4.1-2025-04-14","3","False","Unlimited"
"2025-01-01T14:15:00.000Z","alice.smith","gpt-4.1-2025-04-14","8","True","Unlimited"
"2025-01-02T08:45:00.000Z","charlie.brown","gpt-4o-2024-11-20","12","False","Unlimited"
"2025-01-02T11:20:00.000Z","alice.smith","gpt-4o-2024-11-20","6","False","Unlimited"
"2025-01-02T16:30:00.000Z","bob.jones","gpt-4.1-2025-04-14","4","True","Unlimited"
"2025-01-03T07:00:00.000Z","diana.wilson","gpt-4o-2024-11-20","2","False","Unlimited"
"2025-01-03T13:45:00.000Z","alice.smith","gpt-4.1-2025-04-14","15","True","Unlimited"
"2025-01-04T10:15:00.000Z","bob.jones","gpt-4o-2024-11-20","7","False","Unlimited"
"2025-01-04T15:30:00.000Z","charlie.brown","gpt-4.1-2025-04-14","9","True","Unlimited"
"2025-01-05T09:30:00.000Z","alice.smith","gpt-4o-2024-11-20","11","False","Unlimited"
"2025-01-05T14:00:00.000Z","diana.wilson","gpt-4.1-2025-04-14","3","False","Unlimited"
"2025-01-06T08:00:00.000Z","bob.jones","gpt-4o-2024-11-20","8","True","Unlimited"
"2025-01-06T12:45:00.000Z","alice.smith","gpt-4.1-2025-04-14","6","False","Unlimited"
"2025-01-07T16:20:00.000Z","charlie.brown","gpt-4o-2024-11-20","14","True","Unlimited"
"2025-01-08T09:15:00.000Z","alice.smith","gpt-4o-2024-11-20","4","False","Unlimited"
"2025-01-08T11:30:00.000Z","diana.wilson","gpt-4.1-2025-04-14","10","True","Unlimited"
"2025-01-09T13:00:00.000Z","bob.jones","gpt-4o-2024-11-20","5","False","Unlimited"
"2025-01-09T17:45:00.000Z","charlie.brown","gpt-4.1-2025-04-14","7","False","Unlimited"
"2025-01-10T10:30:00.000Z","alice.smith","gpt-4o-2024-11-20","12","True","Unlimited"`;

  const data = parseCSV(testCSV);

  it('should return user analysis data for alice.smith', () => {
    const userAnalysis = getUserAnalysisData(data, 'alice.smith');
    
    expect(userAnalysis).toBeDefined();
    expect(userAnalysis!.user).toBe('alice.smith');
    expect(userAnalysis!.totalRequests).toBe(67); // 5+8+6+15+11+6+4+12 = 67
    expect(userAnalysis!.compliantRequests).toBe(32); // 5+6+11+6+4 = 32
    expect(userAnalysis!.exceedingRequests).toBe(35); // 8+15+12 = 35
    expect(userAnalysis!.exceedsFreeBudget).toBe(true);
    expect(userAnalysis!.uniqueModels).toEqual(['gpt-4o-2024-11-20', 'gpt-4.1-2025-04-14']);
  });

  it('should return null for non-existent user', () => {
    const userAnalysis = getUserAnalysisData(data, 'nonexistent.user');
    expect(userAnalysis).toBeNull();
  });

  it('should calculate correct weekly breakdown for alice.smith', () => {
    const userAnalysis = getUserAnalysisData(data, 'alice.smith');
    
    expect(userAnalysis).toBeDefined();
    expect(userAnalysis!.weeklyBreakdown).toHaveLength(2);

    // Week 1 (2024-12-30 to 2025-01-05)
    const week1 = userAnalysis!.weeklyBreakdown.find(w => w.year === 2025 && w.week === 1);
    expect(week1).toBeDefined();
    expect(week1!.compliantRequests).toBe(22); // 5+6+11 = 22
    expect(week1!.exceedingRequests).toBe(23); // 8+15 = 23
    expect(week1!.totalRequests).toBe(45);
    expect(week1!.modelsUsed).toEqual(['gpt-4.1-2025-04-14', 'gpt-4o-2024-11-20']);

    // Week 2 (2025-01-06 to 2025-01-12)
    const week2 = userAnalysis!.weeklyBreakdown.find(w => w.year === 2025 && w.week === 2);
    expect(week2).toBeDefined();
    expect(week2!.compliantRequests).toBe(10); // 6+4 = 10
    expect(week2!.exceedingRequests).toBe(12); // 12 = 12
    expect(week2!.totalRequests).toBe(22);
    expect(week2!.modelsUsed).toEqual(['gpt-4.1-2025-04-14', 'gpt-4o-2024-11-20']);
  });

  it('should calculate correct daily average', () => {
    const userAnalysis = getUserAnalysisData(data, 'alice.smith');
    
    expect(userAnalysis).toBeDefined();
    // Alice has activity from 2025-01-01 to 2025-01-10 (10 days)
    // Total requests: 67, Daily average: 67/11 days (inclusive) = 6.09
    expect(userAnalysis!.dailyAverage).toBeCloseTo(6.09, 1);
  });

  it('should return correct date range for user activity', () => {
    const userAnalysis = getUserAnalysisData(data, 'alice.smith');
    
    expect(userAnalysis).toBeDefined();
    expect(userAnalysis!.firstActivityDate).toBe('2025-01-01');
    expect(userAnalysis!.lastActivityDate).toBe('2025-01-10');
  });

  it('should handle user with no exceeding requests', () => {
    const userAnalysis = getUserAnalysisData(data, 'diana.wilson');
    
    expect(userAnalysis).toBeDefined();
    expect(userAnalysis!.user).toBe('diana.wilson');
    expect(userAnalysis!.totalRequests).toBe(15); // 2+3+10 = 15
    expect(userAnalysis!.compliantRequests).toBe(5); // 2+3 = 5
    expect(userAnalysis!.exceedingRequests).toBe(10); // 10 = 10
    expect(userAnalysis!.exceedsFreeBudget).toBe(true); // Has exceeding requests
  });

  it('should return correct weekly breakdown format', () => {
    const userAnalysis = getUserAnalysisData(data, 'bob.jones');
    
    expect(userAnalysis).toBeDefined();
    
    const firstWeek = userAnalysis!.weeklyBreakdown[0];
    expect(firstWeek.year).toBe(2025);
    expect(firstWeek.week).toBe(1);
    expect(firstWeek.startDate).toBe('2024-12-30');
    expect(firstWeek.endDate).toBe('2025-01-05');
    expect(typeof firstWeek.compliantRequests).toBe('number');
    expect(typeof firstWeek.exceedingRequests).toBe('number');
    expect(typeof firstWeek.totalRequests).toBe('number');
    expect(Array.isArray(firstWeek.modelsUsed)).toBe(true);
  });

  it('should handle empty data gracefully', () => {
    const userAnalysis = getUserAnalysisData([], 'any.user');
    expect(userAnalysis).toBeNull();
  });

  it('should handle null data gracefully', () => {
    const userAnalysis = getUserAnalysisData(null as any, 'any.user');
    expect(userAnalysis).toBeNull();
  });

  it('should handle empty username gracefully', () => {
    const userAnalysis = getUserAnalysisData(data, '');
    expect(userAnalysis).toBeNull();
  });
});