import React from "react";
import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMonthCoverage, CopilotUsageData } from "@/lib/utils";
import { MonthOption, MonthCoverage } from "@/types/month";

interface MonthSelectorProps {
  availableMonths: MonthOption[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  disabled?: boolean;
  data?: CopilotUsageData[] | null; // Add data prop to calculate coverage
}

/**
 * Determines the appropriate badge text and style for a month
 */
function getMonthBadgeInfo(coverage: MonthCoverage, selectedMonth: string): { text: string; className: string } {
  if (coverage.isCurrentMonth) {
    return { text: 'Current Month', className: 'month-badge--current' };
  }
  
  // Calculate how many months ago this was
  const now = new Date();
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthDate = new Date(year, month - 1, 1);
  const currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthsDiff = (currentDate.getFullYear() - monthDate.getFullYear()) * 12 + 
                     (currentDate.getMonth() - monthDate.getMonth());
  
  if (monthsDiff === 1) {
    return { text: 'Previous Month', className: 'month-badge--previous' };
  } else {
    return { text: `${Math.abs(monthsDiff)} months ago`, className: 'month-badge--historical' };
  }
}

/**
 * Month selector component that displays available months in a dropdown
 * Shows all available months with day coverage info and appropriate time badges
 */
export function MonthSelector({ 
  availableMonths, 
  selectedMonth, 
  onMonthChange, 
  disabled = false,
  data = null
}: MonthSelectorProps) {
  // Get month coverage info for the selected month
  const coverage: MonthCoverage | null = data && selectedMonth ? getMonthCoverage(data, selectedMonth) : null;
  
  return (
    <div className="flex items-center gap-3">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select 
        value={selectedMonth} 
        onValueChange={onMonthChange}
        disabled={disabled || availableMonths.length === 0}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
            {availableMonths.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                <div className="flex items-center gap-2">
                  <span>{month.label}</span>
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      
      {/* Show day coverage info for selected month */}
      {coverage && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Days with data:</span>
          <span className="font-medium text-foreground">
            {coverage.daysWithData}/{coverage.totalDays}
          </span>
          {(() => {
            const badgeInfo = getMonthBadgeInfo(coverage, selectedMonth);
            return (
              <span className={`month-badge ${badgeInfo.className}`}>
                {badgeInfo.text}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}