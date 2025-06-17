import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface CopilotUsageData {
  timestamp: Date;
  user: string;
  model: string;
  requestsUsed: number;
  exceedsQuota: boolean;
  totalMonthlyQuota: string;
}

export interface AggregatedData {
  date: string; // YYYY-MM-DD format
  model: string;
  compliantRequests: number;
  exceedingRequests: number;
}

export function parseCSV(csv: string): CopilotUsageData[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row');
  }
  
  // Skip the header row and process data rows
  return lines.slice(1).map(line => {
    // Handle quoted CSV properly
    const matches = line.match(/("([^"]*)"|([^,]*))(,|$)/g);
    
    if (!matches || matches.length < 6) {
      throw new Error('Invalid CSV row format');
    }
    
    const values = matches.map(m => 
      m.endsWith(',') 
        ? m.slice(0, -1).replace(/^"(.*)"$/, '$1') 
        : m.replace(/^"(.*)"$/, '$1')
    );
    
    return {
      timestamp: new Date(values[0]),
      user: values[1],
      model: values[2],
      requestsUsed: parseFloat(values[3]),
      exceedsQuota: values[4].toLowerCase() === "true",
      totalMonthlyQuota: values[5],
    };
  });
}

export interface ModelUsageSummary {
  model: string;
  totalRequests: number;
  compliantRequests: number;
  exceedingRequests: number;
}

export interface DailyModelData {
  date: string;
  model: string;
  requests: number;
}

export function aggregateDataByDay(data: CopilotUsageData[]): AggregatedData[] {
  const aggregated: Record<string, AggregatedData> = {};
  
  data.forEach(item => {
    const date = item.timestamp.toISOString().split('T')[0];
    const key = `${date}-${item.model}`;
    
    if (!aggregated[key]) {
      aggregated[key] = {
        date,
        model: item.model,
        compliantRequests: 0,
        exceedingRequests: 0,
      };
    }
    
    if (item.exceedsQuota) {
      aggregated[key].exceedingRequests += item.requestsUsed;
    } else {
      aggregated[key].compliantRequests += item.requestsUsed;
    }
  });
  
  // Convert to array and sort by date and model
  return Object.values(aggregated).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.model.localeCompare(b.model);
  });
}

export function getModelUsageSummary(data: CopilotUsageData[]): ModelUsageSummary[] {
  const summary: Record<string, ModelUsageSummary> = {};
  
  data.forEach(item => {
    if (!summary[item.model]) {
      summary[item.model] = {
        model: item.model,
        totalRequests: 0,
        compliantRequests: 0,
        exceedingRequests: 0
      };
    }
    
    summary[item.model].totalRequests += item.requestsUsed;
    
    if (item.exceedsQuota) {
      summary[item.model].exceedingRequests += item.requestsUsed;
    } else {
      summary[item.model].compliantRequests += item.requestsUsed;
    }
  });
  
  // Convert to array and sort by total requests (descending)
  return Object.values(summary).sort((a, b) => b.totalRequests - a.totalRequests);
}

export function getDailyModelData(data: CopilotUsageData[]): DailyModelData[] {
  const aggregated: Record<string, DailyModelData> = {};
  
  data.forEach(item => {
    const date = item.timestamp.toISOString().split('T')[0];
    const key = `${date}-${item.model}`;
    
    if (!aggregated[key]) {
      aggregated[key] = {
        date,
        model: item.model,
        requests: 0
      };
    }
    
    aggregated[key].requests += item.requestsUsed;
  });
  
  // Convert to array and sort by date
  return Object.values(aggregated).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.model.localeCompare(b.model);
  });
}
