import React from "react";
import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthOption, getMonthCoverage, CopilotUsageData } from "@/lib/utils";

interface MonthSelectorProps {
  availableMonths: MonthOption[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  disabled?: boolean;
  data?: CopilotUsageData[] | null; // Add data prop to calculate coverage
}

/**
 * Month selector component that displays available months in a dropdown
 * Shows current month and previous month options with day coverage info
 */
export function MonthSelector({ 
  availableMonths, 
  selectedMonth, 
  onMonthChange, 
  disabled = false,
  data = null
}: MonthSelectorProps) {
  // Get month coverage info for the selected month
  const coverage = data && selectedMonth ? getMonthCoverage(data, selectedMonth) : null;
  
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
          <span
            className={`month-badge ${coverage.isCurrentMonth ? 'month-badge--current' : 'month-badge--previous'}`}
          >
            {coverage.isCurrentMonth ? 'Current Month' : 'Previous Month'}
          </span>
        </div>
      )}
    </div>
  );
}