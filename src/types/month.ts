/**
 * Type definitions for month selection functionality
 */

export interface MonthOption {
  /** Month identifier in YYYY-MM format */
  value: string;
  /** Human-readable display label (e.g., "September 2025") */
  label: string;
  /** Whether this month is the current month */
  isCurrentMonth: boolean;
}

export interface MonthCoverage {
  /** Number of unique days with data in the month */
  daysWithData: number;
  /** Total number of days in the month */
  totalDays: number;
  /** Whether this month is the current month */
  isCurrentMonth: boolean;
}

export interface MonthIdentifier {
  /** Full year (e.g., 2025) */
  year: number;
  /** Month number (1-12) */
  month: number;
}