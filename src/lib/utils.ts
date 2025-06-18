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
  
  // Validate header row
  const headerLine = lines[0];
  const expectedHeaders = ['Timestamp', 'User', 'Model', 'Requests Used', 'Exceeds Monthly Quota', 'Total Monthly Quota'];
  
  // Parse header row to check for expected columns
  const headerMatches = headerLine.match(/("([^"]*)"|([^,]*))(,|$)/g);
  if (!headerMatches || headerMatches.length < 6) {
    throw new Error('CSV header must contain at least 6 columns');
  }
  
  const headers = headerMatches.map(m => 
    m.endsWith(',') 
      ? m.slice(0, -1).replace(/^"(.*)"$/, '$1') 
      : m.replace(/^"(.*)"$/, '$1')
  ).filter(h => h.trim() !== '').map(h => h.trim()); // Filter empty strings and trim whitespace
  
  // Check if all expected headers are present (case-insensitive exact match)
  const missingHeaders = expectedHeaders.filter(expected => 
    !headers.some(header => header.toLowerCase() === expected.toLowerCase())
  );
  
  // Log detailed header information for debugging
  if (missingHeaders.length > 0) {
    console.log('CSV Header validation failed:');
    console.log('Expected headers:', expectedHeaders);
    console.log('Found headers:', headers);
    console.log('Missing headers:', missingHeaders);
    headers.forEach((header, i) => {
      const expectedHeader = expectedHeaders[i];
      if (expectedHeader) {
        const matches = header.toLowerCase() === expectedHeader.toLowerCase();
        console.log(`  Column ${i + 1}: "${header}" ${matches ? '✅' : '❌'} (expected: "${expectedHeader}")`);
      } else {
        console.log(`  Column ${i + 1}: "${header}" (extra column)`);
      }
    });
  }
  
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(', ')}. Expected columns: ${expectedHeaders.join(', ')}`);
  }
  
  // Skip the header row and process data rows
  return lines.slice(1).map((line, index) => {
    // Handle quoted CSV properly
    const matches = line.match(/("([^"]*)"|([^,]*))(,|$)/g);
    
    if (!matches || matches.length < 6) {
      throw new Error(`Invalid CSV row format at line ${index + 2}: expected 6 columns, got ${matches ? matches.length : 0}`);
    }
    
    const values = matches.map(m => 
      m.endsWith(',') 
        ? m.slice(0, -1).replace(/^"(.*)"$/, '$1') 
        : m.replace(/^"(.*)"$/, '$1')
    );
    
    // Validate timestamp
    const timestamp = new Date(values[0]);
    if (isNaN(timestamp.getTime())) {
      throw new Error(`Invalid timestamp format at line ${index + 2}: "${values[0]}"`);
    }
    
    // Validate requests used
    const requestsUsed = parseFloat(values[3]);
    if (isNaN(requestsUsed)) {
      throw new Error(`Invalid requests used value at line ${index + 2}: "${values[3]}" must be a number`);
    }
    
    // Validate exceeds quota
    const exceedsQuotaValue = values[4].toLowerCase();
    if (exceedsQuotaValue !== 'true' && exceedsQuotaValue !== 'false') {
      throw new Error(`Invalid exceeds quota value at line ${index + 2}: "${values[4]}" must be "true" or "false"`);
    }
    
    return {
      timestamp,
      user: values[1],
      model: values[2],
      requestsUsed,
      exceedsQuota: exceedsQuotaValue === "true",
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
