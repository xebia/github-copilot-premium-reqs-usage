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
  // First, trim any trailing whitespace from the header line
  const trimmedHeaderLine = headerLine.trim();
  const headerMatches = trimmedHeaderLine.match(/("([^"]*)"|([^,]*))(,|$)/g);
  if (!headerMatches || headerMatches.length < 6) {
    throw new Error('CSV header must contain at least 6 columns');
  }
  
  const headers = headerMatches.map(m => {
    // Remove trailing comma if present
    let processed = m.endsWith(',') ? m.slice(0, -1) : m;
    // Remove surrounding quotes if present
    processed = processed.replace(/^"(.*)"$/, '$1');
    return processed;
  }).filter(h => h.trim() !== '').map(h => h.trim()); // Filter empty strings and trim whitespace
  
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
    // Handle quoted CSV properly - trim any trailing whitespace first
    const trimmedLine = line.trim();
    const matches = trimmedLine.match(/("([^"]*)"|([^,]*))(,|$)/g);
    
    if (!matches || matches.length < 6) {
      throw new Error(`Invalid CSV row format at line ${index + 2}: expected 6 columns, got ${matches ? matches.length : 0}`);
    }
    
    const values = matches.map(m => {
      // Remove trailing comma if present
      let processed = m.endsWith(',') ? m.slice(0, -1) : m;
      // Remove surrounding quotes if present
      processed = processed.replace(/^"(.*)"$/, '$1');
      return processed;
    }).filter(v => v.trim() !== ''); // Filter out empty values
    
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

// Power user interfaces and functions
export interface PowerUserData {
  user: string;
  totalRequests: number;
  requestsByModel: Record<string, number>;
  dailyActivity: Array<{
    date: string;
    requests: number;
  }>;
}

export interface PowerUserSummary {
  powerUsers: PowerUserData[];
  totalPowerUsers: number;
  totalPowerUserRequests: number;
  powerUserModelSummary: ModelUsageSummary[];
}



export function getPowerUsers(data: CopilotUsageData[]): PowerUserSummary {
  // First, aggregate total requests per user
  const userTotals: Record<string, number> = {};
  data.forEach(item => {
    userTotals[item.user] = (userTotals[item.user] || 0) + item.requestsUsed;
  });
  
  // Get all users sorted by total requests (descending)
  const allUsersSorted = Object.keys(userTotals).sort(
    (a, b) => userTotals[b] - userTotals[a]
  );
  
  // Calculate top 10% of users (at least 1 user if any users exist)
  const powerUserCount = Math.max(1, Math.ceil(allUsersSorted.length * 0.1));
  
  // Take the top 10% of users as power users
  const powerUserNames = allUsersSorted.slice(0, powerUserCount);
  
  // Filter data to only power users
  const powerUserData = data.filter(item => powerUserNames.includes(item.user));
  
  // Create detailed power user objects
  const powerUsers: PowerUserData[] = powerUserNames.map(userName => {
    const userRequests = powerUserData.filter(item => item.user === userName);
    
    // Aggregate by model
    const requestsByModel: Record<string, number> = {};
    userRequests.forEach(item => {
      requestsByModel[item.model] = (requestsByModel[item.model] || 0) + item.requestsUsed;
    });
    
    // Aggregate daily activity
    const dailyActivity: Record<string, number> = {};
    userRequests.forEach(item => {
      const date = item.timestamp.toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + item.requestsUsed;
    });
    
    const dailyActivityArray = Object.entries(dailyActivity)
      .map(([date, requests]) => ({ date, requests }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      user: userName,
      totalRequests: userTotals[userName],
      requestsByModel,
      dailyActivity: dailyActivityArray
    };
  });
  
  // Sort power users by total requests (descending)
  powerUsers.sort((a, b) => b.totalRequests - a.totalRequests);
  
  // Calculate total power user requests
  const totalPowerUserRequests = powerUsers.reduce((sum, user) => sum + user.totalRequests, 0);
  
  // Get model usage summary for power users
  const powerUserModelSummary = getModelUsageSummary(powerUserData);
  
  return {
    powerUsers,
    totalPowerUsers: powerUsers.length,
    totalPowerUserRequests,
    powerUserModelSummary
  };
}

export function getPowerUserDailyData(powerUsers: PowerUserData[]): Array<{
  date: string;
  requests: number;
}> {
  const dailyTotals: Record<string, number> = {};
  
  powerUsers.forEach(user => {
    user.dailyActivity.forEach(day => {
      dailyTotals[day.date] = (dailyTotals[day.date] || 0) + day.requests;
    });
  });
  
  return Object.entries(dailyTotals)
    .map(([date, requests]) => ({ date, requests }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Function to get the last date from CSV data
export function getLastDateFromData(data: CopilotUsageData[]): string | null {
  if (!data.length) return null;
  
  // Get all dates and find the maximum
  const dates = data.map(item => item.timestamp.toISOString().split('T')[0]);
  const sortedDates = dates.sort((a, b) => a.localeCompare(b));
  
  return sortedDates[sortedDates.length - 1];
}
