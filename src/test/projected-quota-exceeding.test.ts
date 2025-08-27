import { describe, it, expect } from 'vitest';
import { parseCSV, getProjectedUsersExceedingQuota, COPILOT_PLANS } from '../lib/utils';

describe('Projected Quota Exceeding Functionality', () => {
  it('should project users who will exceed quota by month-end based on current usage rate', () => {
    // Create test data for first 10 days of June 2025
    // User1: 10 requests/day -> 300 requests/month (exactly at Business limit)
    // User2: 15 requests/day -> 450 requests/month (would exceed Business limit of 300)
    // User3: 5 requests/day -> 150 requests/month (well under limit)
    const csvContent = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-06-01T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","10","False","Unlimited"
"2025-06-02T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","10","False","Unlimited"
"2025-06-03T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","10","False","Unlimited"
"2025-06-04T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","10","False","Unlimited"
"2025-06-05T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","10","False","Unlimited"
"2025-06-06T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","10","False","Unlimited"
"2025-06-07T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","10","False","Unlimited"
"2025-06-08T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","10","False","Unlimited"
"2025-06-09T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","10","False","Unlimited"
"2025-06-10T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","10","False","Unlimited"
"2025-06-01T11:00:00.0000000Z","user2","gpt-4.1-2025-04-14","15","False","Unlimited"
"2025-06-02T11:00:00.0000000Z","user2","gpt-4.1-2025-04-14","15","False","Unlimited"
"2025-06-03T11:00:00.0000000Z","user2","gpt-4.1-2025-04-14","15","False","Unlimited"
"2025-06-04T11:00:00.0000000Z","user2","gpt-4.1-2025-04-14","15","False","Unlimited"
"2025-06-05T11:00:00.0000000Z","user2","gpt-4.1-2025-04-14","15","False","Unlimited"
"2025-06-06T11:00:00.0000000Z","user2","gpt-4.1-2025-04-14","15","False","Unlimited"
"2025-06-07T11:00:00.0000000Z","user2","gpt-4.1-2025-04-14","15","False","Unlimited"
"2025-06-08T11:00:00.0000000Z","user2","gpt-4.1-2025-04-14","15","False","Unlimited"
"2025-06-09T11:00:00.0000000Z","user2","gpt-4.1-2025-04-14","15","False","Unlimited"
"2025-06-10T11:00:00.0000000Z","user2","gpt-4.1-2025-04-14","15","False","Unlimited"
"2025-06-01T12:00:00.0000000Z","user3","gpt-4.1-2025-04-14","5","False","Unlimited"
"2025-06-02T12:00:00.0000000Z","user3","gpt-4.1-2025-04-14","5","False","Unlimited"
"2025-06-03T12:00:00.0000000Z","user3","gpt-4.1-2025-04-14","5","False","Unlimited"
"2025-06-04T12:00:00.0000000Z","user3","gpt-4.1-2025-04-14","5","False","Unlimited"
"2025-06-05T12:00:00.0000000Z","user3","gpt-4.1-2025-04-14","5","False","Unlimited"
"2025-06-06T12:00:00.0000000Z","user3","gpt-4.1-2025-04-14","5","False","Unlimited"
"2025-06-07T12:00:00.0000000Z","user3","gpt-4.1-2025-04-14","5","False","Unlimited"
"2025-06-08T12:00:00.0000000Z","user3","gpt-4.1-2025-04-14","5","False","Unlimited"
"2025-06-09T12:00:00.0000000Z","user3","gpt-4.1-2025-04-14","5","False","Unlimited"
"2025-06-10T12:00:00.0000000Z","user3","gpt-4.1-2025-04-14","5","False","Unlimited"`;

    const data = parseCSV(csvContent);
    const projectedExceedingUsers = getProjectedUsersExceedingQuota(data, COPILOT_PLANS.BUSINESS);

    // Only user2 should be projected to exceed (15*30=450 > 300)
    // user1: 10*30=300 (exactly at limit, not exceeding)
    // user3: 5*30=150 (well under limit)
    expect(projectedExceedingUsers).toBe(1);
  });

  it('should handle different plan limits correctly', () => {
    // Create test data where user has 3 requests/day for 10 days (30/month projected)
    const csvContent = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-06-01T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","3","False","Unlimited"
"2025-06-02T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","3","False","Unlimited"
"2025-06-03T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","3","False","Unlimited"
"2025-06-04T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","3","False","Unlimited"
"2025-06-05T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","3","False","Unlimited"
"2025-06-06T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","3","False","Unlimited"
"2025-06-07T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","3","False","Unlimited"
"2025-06-08T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","3","False","Unlimited"
"2025-06-09T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","3","False","Unlimited"
"2025-06-10T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","3","False","Unlimited"`;

    const data = parseCSV(csvContent);

    // User projected usage: 3*30=90
    // Individual plan (50): should exceed
    expect(getProjectedUsersExceedingQuota(data, COPILOT_PLANS.INDIVIDUAL)).toBe(1);

    // Business plan (300): should not exceed  
    expect(getProjectedUsersExceedingQuota(data, COPILOT_PLANS.BUSINESS)).toBe(0);

    // Enterprise plan (1000): should not exceed
    expect(getProjectedUsersExceedingQuota(data, COPILOT_PLANS.ENTERPRISE)).toBe(0);
  });

  it('should handle partial month data correctly with different month lengths', () => {
    // February data (28 days) - user has 2 requests/day for first 14 days
    const csvContent = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-02-01T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-02T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-03T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-04T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-05T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-06T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-07T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-08T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-09T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-10T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-11T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-12T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-13T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"
"2025-02-14T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","2","False","Unlimited"`;

    const data = parseCSV(csvContent);

    // User has 28 requests over 14 days = 2 requests/day
    // Projected for full February (28 days): 2*28 = 56 requests
    // Should exceed Individual plan (50) but not Business (300)
    expect(getProjectedUsersExceedingQuota(data, COPILOT_PLANS.INDIVIDUAL)).toBe(1);
    expect(getProjectedUsersExceedingQuota(data, COPILOT_PLANS.BUSINESS)).toBe(0);
  });

  it('should handle empty data gracefully', () => {
    const csvWithNoData = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"`;
    
    // Create empty array directly since parseCSV will throw on header-only CSV
    expect(getProjectedUsersExceedingQuota([], COPILOT_PLANS.BUSINESS)).toBe(0);
  });

  it('should only consider data from the current month', () => {
    // Mix data from different months - only June data should be considered (last date is June 3rd)
    const csvContent = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-05-30T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","100","False","Unlimited"
"2025-05-31T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","100","False","Unlimited"
"2025-06-01T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","5","False","Unlimited"
"2025-06-02T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","5","False","Unlimited"
"2025-06-03T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","5","False","Unlimited"`;

    const data = parseCSV(csvContent);

    // Only June data should be considered: 5*3=15 requests over 3 days
    // Daily average: 15/3 = 5 requests/day  
    // Projected June usage: 5*30 = 150 requests (under Business limit of 300)
    expect(getProjectedUsersExceedingQuota(data, COPILOT_PLANS.BUSINESS)).toBe(0);
    
    // But would exceed Individual limit of 50
    expect(getProjectedUsersExceedingQuota(data, COPILOT_PLANS.INDIVIDUAL)).toBe(1);
  });

  it('should handle fractional requests correctly', () => {
    // User with fractional requests 
    const csvContent = `"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-06-01T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","1.5","False","Unlimited"
"2025-06-02T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","1.5","False","Unlimited"
"2025-06-03T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","1.5","False","Unlimited"
"2025-06-04T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","1.5","False","Unlimited"
"2025-06-05T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","1.5","False","Unlimited"
"2025-06-06T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","1.5","False","Unlimited"
"2025-06-07T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","1.5","False","Unlimited"
"2025-06-08T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","1.5","False","Unlimited"
"2025-06-09T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","1.5","False","Unlimited"
"2025-06-10T10:00:00.0000000Z","user1","gpt-4.1-2025-04-14","1.5","False","Unlimited"`;

    const data = parseCSV(csvContent);

    // User has 15 requests over 10 days = 1.5 requests/day
    // Projected for full June (30 days): 1.5*30 = 45 requests
    // Should not exceed Individual plan (50)
    expect(getProjectedUsersExceedingQuota(data, COPILOT_PLANS.INDIVIDUAL)).toBe(0);
  });
});