import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidMonthFormat,
  parseMonthString,
  formatMonthString,
  getCurrentMonth,
  getPreviousMonth,
  createMonthLabel,
  extractMonthsFromData,
  getAvailableMonths,
  filterDataByMonth,
  getDaysInMonth,
  getUniqueDaysWithData,
  getMonthCoverage
} from '@/lib/month-utils';
import { CopilotUsageData } from '@/lib/utils';
import { MonthIdentifier } from '@/types/month';

describe('Month Utilities', () => {
  let mockData: CopilotUsageData[];

  beforeEach(() => {
    mockData = [
      {
        timestamp: new Date('2025-01-15T10:00:00Z'),
        user: 'user1',
        model: 'gpt-4',
        requestsUsed: 5,
        exceedsQuota: false,
        totalMonthlyQuota: '100'
      },
      {
        timestamp: new Date('2025-01-20T11:00:00Z'),
        user: 'user2',
        model: 'gpt-4',
        requestsUsed: 3,
        exceedsQuota: false,
        totalMonthlyQuota: '100'
      },
      {
        timestamp: new Date('2025-02-05T12:00:00Z'),
        user: 'user1',
        model: 'claude',
        requestsUsed: 8,
        exceedsQuota: true,
        totalMonthlyQuota: '100'
      },
      {
        timestamp: new Date('2025-02-05T14:00:00Z'),
        user: 'user3',
        model: 'gpt-4',
        requestsUsed: 2,
        exceedsQuota: false,
        totalMonthlyQuota: '100'
      },
      {
        timestamp: new Date('2025-02-10T09:00:00Z'),
        user: 'user2',
        model: 'gpt-3.5',
        requestsUsed: 4,
        exceedsQuota: false,
        totalMonthlyQuota: '100'
      }
    ];
  });

  describe('isValidMonthFormat', () => {
    it('should validate correct YYYY-MM format', () => {
      expect(isValidMonthFormat('2025-01')).toBe(true);
      expect(isValidMonthFormat('2025-12')).toBe(true);
      expect(isValidMonthFormat('2000-06')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidMonthFormat('25-01')).toBe(false);
      expect(isValidMonthFormat('2025-1')).toBe(false);
      expect(isValidMonthFormat('2025-13')).toBe(false);
      expect(isValidMonthFormat('2025-00')).toBe(false);
      expect(isValidMonthFormat('2025/01')).toBe(false);
      expect(isValidMonthFormat('2025-01-01')).toBe(false);
      expect(isValidMonthFormat('')).toBe(false);
      expect(isValidMonthFormat('invalid')).toBe(false);
    });

    it('should handle edge year cases', () => {
      expect(isValidMonthFormat('1999-01')).toBe(false);
      expect(isValidMonthFormat('3001-01')).toBe(false);
      expect(isValidMonthFormat('2000-01')).toBe(true);
      expect(isValidMonthFormat('3000-01')).toBe(true);
    });
  });

  describe('parseMonthString', () => {
    it('should parse valid month strings', () => {
      expect(parseMonthString('2025-01')).toEqual({ year: 2025, month: 1 });
      expect(parseMonthString('2025-12')).toEqual({ year: 2025, month: 12 });
    });

    it('should throw error for invalid formats', () => {
      expect(() => parseMonthString('invalid')).toThrow('Invalid month format: invalid. Expected YYYY-MM format.');
      expect(() => parseMonthString('2025-13')).toThrow('Invalid month format: 2025-13. Expected YYYY-MM format.');
    });
  });

  describe('formatMonthString', () => {
    it('should format month identifiers correctly', () => {
      expect(formatMonthString({ year: 2025, month: 1 })).toBe('2025-01');
      expect(formatMonthString({ year: 2025, month: 12 })).toBe('2025-12');
    });

    it('should pad single-digit months with zero', () => {
      expect(formatMonthString({ year: 2025, month: 9 })).toBe('2025-09');
    });
  });

  describe('getPreviousMonth', () => {
    it('should get previous month in same year', () => {
      const result = getPreviousMonth({ year: 2025, month: 6 });
      expect(result).toEqual({ year: 2025, month: 5 });
    });

    it('should handle year rollover', () => {
      const result = getPreviousMonth({ year: 2025, month: 1 });
      expect(result).toEqual({ year: 2024, month: 12 });
    });

    it('should work without parameters (using current month)', () => {
      const result = getPreviousMonth();
      expect(result.year).toBeTypeOf('number');
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
    });
  });

  describe('createMonthLabel', () => {
    it('should create readable month labels', () => {
      expect(createMonthLabel({ year: 2025, month: 1 })).toBe('January 2025');
      expect(createMonthLabel({ year: 2025, month: 12 })).toBe('December 2025');
    });
  });

  describe('extractMonthsFromData', () => {
    it('should extract unique months from data', () => {
      const months = extractMonthsFromData(mockData);
      expect(months).toHaveLength(2);
      expect(months[0]).toEqual({ year: 2025, month: 2 }); // Most recent first
      expect(months[1]).toEqual({ year: 2025, month: 1 });
    });

    it('should handle empty data', () => {
      expect(extractMonthsFromData([])).toEqual([]);
      expect(extractMonthsFromData(null as any)).toEqual([]);
    });

    it('should handle invalid timestamps', () => {
      const invalidData = [
        { ...mockData[0], timestamp: null as any },
        { ...mockData[1], timestamp: 'invalid' as any },
        mockData[2] // Valid one
      ];
      const months = extractMonthsFromData(invalidData);
      expect(months).toHaveLength(1);
      expect(months[0]).toEqual({ year: 2025, month: 2 });
    });
  });

  describe('getAvailableMonths', () => {
    it('should return month options for data', () => {
      const options = getAvailableMonths(mockData);
      expect(options).toHaveLength(2);
      
      expect(options[0].value).toBe('2025-02');
      expect(options[0].label).toBe('February 2025');
      
      expect(options[1].value).toBe('2025-01');
      expect(options[1].label).toBe('January 2025');
    });

    it('should mark current month correctly', () => {
      const currentMonth = getCurrentMonth();
      const currentMonthData = [{
        timestamp: new Date(),
        user: 'user1',
        model: 'gpt-4',
        requestsUsed: 1,
        exceedsQuota: false,
        totalMonthlyQuota: '100'
      }];
      
      const options = getAvailableMonths(currentMonthData);
      expect(options[0].isCurrentMonth).toBe(true);
    });

    it('should handle empty data', () => {
      expect(getAvailableMonths([])).toEqual([]);
    });

    it('should return all months with data', () => {
      const dataWith3Months = [
        ...mockData,
        {
          timestamp: new Date('2024-12-15T10:00:00Z'),
          user: 'user1',
          model: 'gpt-4',
          requestsUsed: 1,
          exceedsQuota: false,
          totalMonthlyQuota: '100'
        }
      ];
      
      const options = getAvailableMonths(dataWith3Months);
      expect(options).toHaveLength(3);
      expect(options[0].value).toBe('2025-02');
      expect(options[1].value).toBe('2025-01');
      expect(options[2].value).toBe('2024-12');
    });

    it('should handle data spanning many months', () => {
      const dataWithManyMonths = [
        { timestamp: new Date('2025-06-15T10:00:00Z'), user: 'user1', model: 'gpt-4', requestsUsed: 1, exceedsQuota: false, totalMonthlyQuota: '100' },
        { timestamp: new Date('2025-05-15T10:00:00Z'), user: 'user1', model: 'gpt-4', requestsUsed: 1, exceedsQuota: false, totalMonthlyQuota: '100' },
        { timestamp: new Date('2025-04-15T10:00:00Z'), user: 'user1', model: 'gpt-4', requestsUsed: 1, exceedsQuota: false, totalMonthlyQuota: '100' },
        { timestamp: new Date('2025-03-15T10:00:00Z'), user: 'user1', model: 'gpt-4', requestsUsed: 1, exceedsQuota: false, totalMonthlyQuota: '100' },
        { timestamp: new Date('2025-02-15T10:00:00Z'), user: 'user1', model: 'gpt-4', requestsUsed: 1, exceedsQuota: false, totalMonthlyQuota: '100' },
        { timestamp: new Date('2025-01-15T10:00:00Z'), user: 'user1', model: 'gpt-4', requestsUsed: 1, exceedsQuota: false, totalMonthlyQuota: '100' }
      ];
      
      const options = getAvailableMonths(dataWithManyMonths);
      expect(options).toHaveLength(6);
      
      // Should be sorted newest first
      expect(options[0].value).toBe('2025-06');
      expect(options[1].value).toBe('2025-05');
      expect(options[2].value).toBe('2025-04');
      expect(options[3].value).toBe('2025-03');
      expect(options[4].value).toBe('2025-02');
      expect(options[5].value).toBe('2025-01');
    });

    it('should deduplicate months correctly', () => {
      const dataWithDuplicateMonths = [
        { timestamp: new Date('2025-01-01T10:00:00Z'), user: 'user1', model: 'gpt-4', requestsUsed: 1, exceedsQuota: false, totalMonthlyQuota: '100' },
        { timestamp: new Date('2025-01-15T10:00:00Z'), user: 'user2', model: 'gpt-4', requestsUsed: 1, exceedsQuota: false, totalMonthlyQuota: '100' },
        { timestamp: new Date('2025-01-31T10:00:00Z'), user: 'user3', model: 'gpt-4', requestsUsed: 1, exceedsQuota: false, totalMonthlyQuota: '100' }
      ];
      
      const options = getAvailableMonths(dataWithDuplicateMonths);
      expect(options).toHaveLength(1);
      expect(options[0].value).toBe('2025-01');
      expect(options[0].label).toBe('January 2025');
    });
  });

  describe('filterDataByMonth', () => {
    it('should filter data by selected month', () => {
      const januaryData = filterDataByMonth(mockData, '2025-01');
      expect(januaryData).toHaveLength(2);
      januaryData.forEach(item => {
        expect(item.timestamp.getFullYear()).toBe(2025);
        expect(item.timestamp.getMonth()).toBe(0); // January is 0-indexed
      });
    });

    it('should return all data when no month selected', () => {
      expect(filterDataByMonth(mockData, '')).toEqual(mockData);
    });

    it('should handle empty data', () => {
      expect(filterDataByMonth([], '2025-01')).toEqual([]);
    });

    it('should handle invalid month format gracefully', () => {
      expect(() => filterDataByMonth(mockData, 'invalid')).toThrow();
    });

    it('should filter out items with invalid timestamps', () => {
      const dataWithInvalidTimestamp = [
        ...mockData,
        { ...mockData[0], timestamp: null as any }
      ];
      
      const result = filterDataByMonth(dataWithInvalidTimestamp, '2025-01');
      expect(result).toHaveLength(2); // Should exclude the invalid timestamp
    });
  });

  describe('getDaysInMonth', () => {
    it('should return correct days for different months', () => {
      expect(getDaysInMonth({ year: 2025, month: 1 })).toBe(31); // January
      expect(getDaysInMonth({ year: 2025, month: 2 })).toBe(28); // February (non-leap year)
      expect(getDaysInMonth({ year: 2025, month: 4 })).toBe(30); // April
    });

    it('should handle leap years', () => {
      expect(getDaysInMonth({ year: 2024, month: 2 })).toBe(29); // February (leap year)
      expect(getDaysInMonth({ year: 2000, month: 2 })).toBe(29); // February (leap year)
      expect(getDaysInMonth({ year: 1900, month: 2 })).toBe(28); // February (not leap year)
    });
  });

  describe('getUniqueDaysWithData', () => {
    it('should return unique days with data', () => {
      const januaryDays = getUniqueDaysWithData(mockData, { year: 2025, month: 1 });
      expect(januaryDays.size).toBe(2);
      expect(januaryDays.has(15)).toBe(true);
      expect(januaryDays.has(20)).toBe(true);
    });

    it('should handle empty data', () => {
      const result = getUniqueDaysWithData([], { year: 2025, month: 1 });
      expect(result.size).toBe(0);
    });

    it('should ignore invalid timestamps', () => {
      const dataWithInvalid = [
        ...mockData,
        { ...mockData[0], timestamp: null as any }
      ];
      
      const januaryDays = getUniqueDaysWithData(dataWithInvalid, { year: 2025, month: 1 });
      expect(januaryDays.size).toBe(2); // Should still be 2, ignoring invalid
    });
  });

  describe('getMonthCoverage', () => {
    it('should calculate coverage correctly', () => {
      const coverage = getMonthCoverage(mockData, '2025-01');
      
      expect(coverage.daysWithData).toBe(2); // 15th and 20th
      expect(coverage.totalDays).toBe(31); // January has 31 days
      expect(coverage.isCurrentMonth).toBe(false); // January 2025 is not current
    });

    it('should handle empty data', () => {
      const coverage = getMonthCoverage([], '2025-01');
      expect(coverage).toEqual({
        daysWithData: 0,
        totalDays: 0,
        isCurrentMonth: false
      });
    });

    it('should handle empty month', () => {
      const coverage = getMonthCoverage(mockData, '');
      expect(coverage).toEqual({
        daysWithData: 0,
        totalDays: 0,
        isCurrentMonth: false
      });
    });

    it('should identify current month correctly', () => {
      const currentMonth = getCurrentMonth();
      const currentMonthStr = formatMonthString(currentMonth);
      
      const currentMonthData = [{
        timestamp: new Date(),
        user: 'user1',
        model: 'gpt-4',
        requestsUsed: 1,
        exceedsQuota: false,
        totalMonthlyQuota: '100'
      }];
      
      const coverage = getMonthCoverage(currentMonthData, currentMonthStr);
      expect(coverage.isCurrentMonth).toBe(true);
    });

    it('should handle February leap year correctly', () => {
      const februaryData = filterDataByMonth(mockData, '2025-02');
      const coverage = getMonthCoverage(februaryData, '2025-02');
      
      expect(coverage.totalDays).toBe(28); // 2025 is not a leap year
      expect(coverage.daysWithData).toBe(2); // 5th and 10th
    });

    it('should throw error for invalid month format', () => {
      expect(() => getMonthCoverage(mockData, 'invalid')).toThrow();
    });
  });
});