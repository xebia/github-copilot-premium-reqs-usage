/**
 * Utility functions for month selection and date handling
 * Focused, tested utilities with proper error handling and validation
 */

import { CopilotUsageData } from '@/lib/utils';
import { MonthOption, MonthCoverage, MonthIdentifier } from '@/types/month';

/**
 * Validates if a month string is in the correct YYYY-MM format
 */
export function isValidMonthFormat(monthStr: string): boolean {
  const pattern = /^\d{4}-\d{2}$/;
  if (!pattern.test(monthStr)) return false;
  
  const [year, month] = monthStr.split('-').map(Number);
  return year >= 2000 && year <= 3000 && month >= 1 && month <= 12;
}

/**
 * Parses a month string into year and month numbers
 * @throws Error if format is invalid
 */
export function parseMonthString(monthStr: string): MonthIdentifier {
  if (!isValidMonthFormat(monthStr)) {
    throw new Error(`Invalid month format: ${monthStr}. Expected YYYY-MM format.`);
  }
  
  const [year, month] = monthStr.split('-').map(Number);
  return { year, month };
}

/**
 * Formats a MonthIdentifier into YYYY-MM string
 */
export function formatMonthString(identifier: MonthIdentifier): string {
  const { year, month } = identifier;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Gets the current month identifier
 */
export function getCurrentMonth(): MonthIdentifier {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1 // JavaScript months are 0-indexed
  };
}

/**
 * Gets the previous month identifier
 */
export function getPreviousMonth(from?: MonthIdentifier): MonthIdentifier {
  const base = from || getCurrentMonth();
  const { year, month } = base;
  
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Creates a human-readable label for a month
 */
export function createMonthLabel(identifier: MonthIdentifier): string {
  const { year, month } = identifier;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Extracts unique month identifiers from usage data
 */
export function extractMonthsFromData(data: CopilotUsageData[]): MonthIdentifier[] {
  if (!data || data.length === 0) return [];
  
  const monthsSet = new Set<string>();
  
  for (const item of data) {
    if (!item.timestamp || !(item.timestamp instanceof Date)) continue;
    
    const identifier: MonthIdentifier = {
      year: item.timestamp.getFullYear(),
      month: item.timestamp.getMonth() + 1
    };
    
    monthsSet.add(formatMonthString(identifier));
  }
  
  return Array.from(monthsSet)
    .sort()
    .reverse() // Most recent first
    .map(parseMonthString);
}

/**
 * Gets available month options for the month selector
 * Returns all months that have data in the export
 */
export function getAvailableMonths(data: CopilotUsageData[]): MonthOption[] {
  if (!data || data.length === 0) return [];
  
  const monthsWithData = extractMonthsFromData(data);
  const currentMonth = getCurrentMonth();
  const currentMonthStr = formatMonthString(currentMonth);
  
  // Return all months with data (already sorted newest to oldest)
  return monthsWithData.map(identifier => ({
    value: formatMonthString(identifier),
    label: createMonthLabel(identifier),
    isCurrentMonth: formatMonthString(identifier) === currentMonthStr
  }));
}

/**
 * Filters usage data by the specified month
 */
export function filterDataByMonth(data: CopilotUsageData[], selectedMonth: string): CopilotUsageData[] {
  if (!data || data.length === 0) return [];
  if (!selectedMonth) return data;
  
  const monthIdentifier = parseMonthString(selectedMonth);
  const { year, month } = monthIdentifier;
  
  return data.filter(item => {
    if (!item.timestamp || !(item.timestamp instanceof Date)) return false;
    
    return item.timestamp.getFullYear() === year && 
           item.timestamp.getMonth() === month - 1;
  });
}

/**
 * Calculates the number of days in a given month
 */
export function getDaysInMonth(identifier: MonthIdentifier): number {
  const { year, month } = identifier;
  return new Date(year, month, 0).getDate();
}

/**
 * Gets unique days with data for a specific month
 */
export function getUniqueDaysWithData(data: CopilotUsageData[], monthIdentifier: MonthIdentifier): Set<number> {
  const { year, month } = monthIdentifier;
  const daysSet = new Set<number>();
  
  for (const item of data) {
    if (!item.timestamp || !(item.timestamp instanceof Date)) continue;
    
    if (item.timestamp.getFullYear() === year && 
        item.timestamp.getMonth() === month - 1) {
      daysSet.add(item.timestamp.getDate());
    }
  }
  
  return daysSet;
}

/**
 * Calculates month coverage information
 */
export function getMonthCoverage(data: CopilotUsageData[], selectedMonth: string): MonthCoverage {
  if (!data || data.length === 0 || !selectedMonth) {
    return { daysWithData: 0, totalDays: 0, isCurrentMonth: false };
  }
  
  const monthIdentifier = parseMonthString(selectedMonth);
  const currentMonth = getCurrentMonth();
  const isCurrentMonth = formatMonthString(monthIdentifier) === formatMonthString(currentMonth);
  
  const totalDays = getDaysInMonth(monthIdentifier);
  const uniqueDays = getUniqueDaysWithData(data, monthIdentifier);
  
  return {
    daysWithData: uniqueDays.size,
    totalDays,
    isCurrentMonth
  };
}