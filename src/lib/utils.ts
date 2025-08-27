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
  displayName: string; // For grouping default models
  totalRequests: number;
  compliantRequests: number;
  exceedingRequests: number;
  multiplier: number;
  individualPlanLimit: number;
  businessPlanLimit: number;
  enterprisePlanLimit: number;
  excessCost: number; // Cost for exceeding requests
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
      const multiplier = MODEL_MULTIPLIERS[item.model] || 1;
      const displayName = DEFAULT_MODELS.includes(item.model) ? 'Default' : item.model;
      
      summary[item.model] = {
        model: item.model,
        displayName,
        totalRequests: 0,
        compliantRequests: 0,
        exceedingRequests: 0,
        multiplier,
        individualPlanLimit: PLAN_MONTHLY_LIMITS[COPILOT_PLANS.INDIVIDUAL],
        businessPlanLimit: PLAN_MONTHLY_LIMITS[COPILOT_PLANS.BUSINESS],
        enterprisePlanLimit: PLAN_MONTHLY_LIMITS[COPILOT_PLANS.ENTERPRISE],
        excessCost: 0
      };
    }
    
    summary[item.model].totalRequests += item.requestsUsed;
    
    if (item.exceedsQuota) {
      summary[item.model].exceedingRequests += item.requestsUsed;
    } else {
      summary[item.model].compliantRequests += item.requestsUsed;
    }
  });
  
  // Calculate excess costs and group default models
  const summaryArray = Object.values(summary);
  const groupedSummary: Record<string, ModelUsageSummary> = {};
  
  summaryArray.forEach(item => {
    const key = item.displayName;
    
    if (!groupedSummary[key]) {
      groupedSummary[key] = {
        ...item,
        model: key === 'Default' ? 'Default (GPT-4o, GPT-4.1)' : item.model
      };
    } else {
      // Merge default models
      groupedSummary[key].totalRequests += item.totalRequests;
      groupedSummary[key].compliantRequests += item.compliantRequests;
      groupedSummary[key].exceedingRequests += item.exceedingRequests;
    }
    
    // For grouped default models, ensure multiplier is 0 and limits use constant values
    if (key === 'Default') {
      groupedSummary[key].multiplier = 0;
      groupedSummary[key].individualPlanLimit = PLAN_MONTHLY_LIMITS[COPILOT_PLANS.INDIVIDUAL];
      groupedSummary[key].businessPlanLimit = PLAN_MONTHLY_LIMITS[COPILOT_PLANS.BUSINESS];
      groupedSummary[key].enterprisePlanLimit = PLAN_MONTHLY_LIMITS[COPILOT_PLANS.ENTERPRISE];
    }
    
    // Calculate excess cost
    groupedSummary[key].excessCost = groupedSummary[key].exceedingRequests * groupedSummary[key].multiplier * EXCESS_REQUEST_COST;
  });
  
  // Convert to array and sort by total requests (descending)
  return Object.values(groupedSummary).sort((a, b) => b.totalRequests - a.totalRequests);
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
  exceedingRequests: number;
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

export interface PowerUserDailyBreakdown {
  date: string;
  compliantRequests: number;
  exceedingRequests: number;
  // Model breakdown - each model will have its own field for recharts stacking
  [key: string]: string | number; // Allow dynamic model fields
}

export interface ProjectedUserData {
  user: string;
  currentRequests: number;
  projectedMonthlyTotal: number;
  daysElapsed: number;
  dailyAverage: number;
}



// Copilot plan constants
export const COPILOT_PLANS = {
  INDIVIDUAL: 'Individual',
  BUSINESS: 'Business', 
  ENTERPRISE: 'Enterprise'
} as const;

export const PLAN_MONTHLY_LIMITS = {
  [COPILOT_PLANS.INDIVIDUAL]: 50,
  [COPILOT_PLANS.BUSINESS]: 300,
  [COPILOT_PLANS.ENTERPRISE]: 1000
} as const;

// Model multipliers based on GitHub documentation (for paid plans)
export const MODEL_MULTIPLIERS: Record<string, number> = {
  // Default models (0x multiplier for paid plans)
  'gpt-4o-2024-11-20': 0,
  'gpt-4.1-2025-04-14': 0,
  'gpt-4o': 0,
  'gpt-4.1': 0,
  // GPT-4.5 models
  'gpt-4.5': 50,
  // Vision models
  'gpt-4.1-vision': 0,
  // Claude models
  'claude-sonnet-3.5': 1,
  'claude-sonnet-3.7': 1,
  'claude-sonnet-3.7-thinking': 1.25,
  'claude-sonnet-4': 1,
  'claude-opus-4': 10,
  // Gemini models
  'gemini-2.0-flash': 0.25,
  'gemini-2.5-pro': 1,
  // O-series models
  'o1': 10,
  'o3': 1,
  'o3-mini': 0.33,
  'o3-mini-2025-01-31': 0.33,
  'o4-mini': 0.33,
  'o4-mini-2025-04-16': 0.33,
  // Add other models as needed - fallback to 1x for unknown models
};

// Default models that should be grouped
export const DEFAULT_MODELS = ['gpt-4o-2024-11-20', 'gpt-4.1-2025-04-14'];

// Cost per excess request (in USD) for premium requests
export const EXCESS_REQUEST_COST = 0.04; // $0.04 per excess request

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
    
    // Calculate exceeding requests
    const exceedingRequests = userRequests
      .filter(item => item.exceedsQuota)
      .reduce((sum, item) => sum + item.requestsUsed, 0);
    
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
      exceedingRequests,
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

export function getPowerUserDailyBreakdown(data: CopilotUsageData[], powerUserNames: string[]): PowerUserDailyBreakdown[] {
  // Filter data to only include power users
  const powerUserData = data.filter(item => powerUserNames.includes(item.user));
  
  const dailyBreakdown: Record<string, PowerUserDailyBreakdown> = {};
  
  powerUserData.forEach(item => {
    const date = item.timestamp.toISOString().split('T')[0];
    
    if (!dailyBreakdown[date]) {
      dailyBreakdown[date] = {
        date,
        compliantRequests: 0,
        exceedingRequests: 0,
      };
    }
    
    // Track model usage - create field name for this model
    const modelFieldName = item.model;
    if (!dailyBreakdown[date][modelFieldName]) {
      dailyBreakdown[date][modelFieldName] = 0;
    }
    
    // Add to model-specific field
    dailyBreakdown[date][modelFieldName] = (dailyBreakdown[date][modelFieldName] as number) + item.requestsUsed;
    
    // Keep the existing compliant/exceeding breakdown for backwards compatibility
    if (item.exceedsQuota) {
      dailyBreakdown[date].exceedingRequests += item.requestsUsed;
    } else {
      dailyBreakdown[date].compliantRequests += item.requestsUsed;
    }
  });
  
  // Convert to array and sort by date
  return Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date));
}

// Helper function to extract all unique models from power user daily breakdown data
export function getUniqueModelsFromBreakdown(breakdownData: PowerUserDailyBreakdown[]): string[] {
  const modelSet = new Set<string>();
  
  breakdownData.forEach(dayData => {
    Object.keys(dayData).forEach(key => {
      // Skip non-model fields (date, compliantRequests, exceedingRequests)
      if (key !== 'date' && key !== 'compliantRequests' && key !== 'exceedingRequests') {
        modelSet.add(key);
      }
    });
  });
  
  return Array.from(modelSet).sort();
}

// Function to get the last date from CSV data
export function getLastDateFromData(data: CopilotUsageData[]): string | null {
  if (!data.length) return null;
  
  // Get all dates and find the maximum
  const dates = data.map(item => item.timestamp.toISOString().split('T')[0]);
  const sortedDates = dates.sort((a, b) => a.localeCompare(b));
  
  return sortedDates[sortedDates.length - 1];
}

export interface ExceededRequestDetail {
  user: string;
  date: string;
  exceededRequests: number;
  totalRequestsOnDay: number;
  compliantRequestsOnDay: number;
  modelsUsed: string[];
  exceedingByModel: Record<string, number>;
}

export function getExceededRequestDetails(data: CopilotUsageData[], targetDate?: string, targetUser?: string): ExceededRequestDetail[] {
  const exceededDetails: Record<string, ExceededRequestDetail> = {};

  // Filter data if specific date or user is provided
  let filteredData = data;
  if (targetDate) {
    filteredData = filteredData.filter(item => 
      item.timestamp.toISOString().split('T')[0] === targetDate
    );
  }
  if (targetUser) {
    filteredData = filteredData.filter(item => item.user === targetUser);
  }

  // Process all data to find users who exceeded limits
  filteredData.forEach(item => {
    const date = item.timestamp.toISOString().split('T')[0];
    const key = `${item.user}-${date}`;

    if (!exceededDetails[key]) {
      exceededDetails[key] = {
        user: item.user,
        date,
        exceededRequests: 0,
        totalRequestsOnDay: 0,
        compliantRequestsOnDay: 0,
        modelsUsed: [],
        exceedingByModel: {},
      };
    }

    const detail = exceededDetails[key];
    
    // Track total requests for this day
    detail.totalRequestsOnDay += item.requestsUsed;
    
    // Track models used
    if (!detail.modelsUsed.includes(item.model)) {
      detail.modelsUsed.push(item.model);
    }
    
    // Track exceeded vs compliant requests
    if (item.exceedsQuota) {
      detail.exceededRequests += item.requestsUsed;
      detail.exceedingByModel[item.model] = (detail.exceedingByModel[item.model] || 0) + item.requestsUsed;
    } else {
      detail.compliantRequestsOnDay += item.requestsUsed;
    }
  });

  // Filter to only return entries where users actually exceeded limits
  return Object.values(exceededDetails)
    .filter(detail => detail.exceededRequests > 0)
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date); // Most recent first
      return b.exceededRequests - a.exceededRequests; // Highest exceeded requests first
    });
}

export function getUserExceededRequestSummary(data: CopilotUsageData[], userName: string): {
  totalExceededDays: number;
  totalExceededRequests: number;
  averageExceededPerDay: number;
  worstDay: { date: string; exceededRequests: number; totalRequests: number } | null;
} {
  const userExceededDetails = getExceededRequestDetails(data, undefined, userName);
  
  if (userExceededDetails.length === 0) {
    return {
      totalExceededDays: 0,
      totalExceededRequests: 0,
      averageExceededPerDay: 0,
      worstDay: null,
    };
  }

  const totalExceededRequests = userExceededDetails.reduce((sum, detail) => sum + detail.exceededRequests, 0);
  const worstDay = userExceededDetails.reduce((worst, current) => 
    current.exceededRequests > worst.exceededRequests ? current : worst
  );

  return {
    totalExceededDays: userExceededDetails.length,
    totalExceededRequests,
    averageExceededPerDay: totalExceededRequests / userExceededDetails.length,
    worstDay: {
      date: worstDay.date,
      exceededRequests: worstDay.exceededRequests,
      totalRequests: worstDay.totalRequestsOnDay,
    },
  };
}

/**
 * Get the count of unique users who have exceeded their quota limits
 * @param data - Array of Copilot usage data
 * @param plan - The plan type to check limits against (defaults to BUSINESS)
 */
export function getUniqueUsersExceedingQuota(data: CopilotUsageData[], plan: string = COPILOT_PLANS.BUSINESS): number {
  if (!data.length) return 0;

  // Get the plan limit for comparison
  const planLimit = PLAN_MONTHLY_LIMITS[plan] || PLAN_MONTHLY_LIMITS[COPILOT_PLANS.BUSINESS];

  // Aggregate total requests per user
  const userTotals: Record<string, number> = {};
  data.forEach(item => {
    userTotals[item.user] = (userTotals[item.user] || 0) + item.requestsUsed;
  });

  // Count users who exceed the plan limit
  const usersExceedingPlan = Object.keys(userTotals).filter(user => userTotals[user] > planLimit);
  
  return usersExceedingPlan.length;
}

/**
 * Get the total requests made by users who have exceeded their quota limits
 * @param data - Array of Copilot usage data
 * @param plan - The plan type to check limits against (defaults to BUSINESS)
 */
export function getTotalRequestsForUsersExceedingQuota(data: CopilotUsageData[], plan: string = COPILOT_PLANS.BUSINESS): number {
  if (!data.length) return 0;

  // Get the plan limit for comparison
  const planLimit = PLAN_MONTHLY_LIMITS[plan] || PLAN_MONTHLY_LIMITS[COPILOT_PLANS.BUSINESS];

  // Aggregate total requests per user
  const userTotals: Record<string, number> = {};
  data.forEach(item => {
    userTotals[item.user] = (userTotals[item.user] || 0) + item.requestsUsed;
  });

  // Get users who exceed the plan limit and sum their total requests
  const usersExceedingPlan = Object.keys(userTotals).filter(user => userTotals[user] > planLimit);
  
  return usersExceedingPlan.reduce((sum, user) => sum + userTotals[user], 0);
}

/**
 * Project the number of users who will exceed their quota limits by month-end
 * based on their current usage patterns
 * @param data - Array of Copilot usage data
 * @param plan - The plan type to check limits against (defaults to BUSINESS)
 */
export function getProjectedUsersExceedingQuota(data: CopilotUsageData[], plan: string = COPILOT_PLANS.BUSINESS): number {
  if (!data.length) return 0;

  // Get the plan limit for comparison
  const planLimit = PLAN_MONTHLY_LIMITS[plan] || PLAN_MONTHLY_LIMITS[COPILOT_PLANS.BUSINESS];

  // Get the last date from the data to determine the current month and days elapsed
  const lastDate = getLastDateFromData(data);
  if (!lastDate) return 0;

  const lastDateObj = new Date(lastDate);
  const year = lastDateObj.getFullYear();
  const month = lastDateObj.getMonth();
  
  // Calculate the first day of the month and days elapsed (inclusive)
  const firstDayOfMonth = new Date(year, month, 1);
  const daysElapsed = lastDateObj.getDate(); // getDate() returns day of month (1-31)
  
  // Calculate total days in this month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Aggregate total requests per user for the current month only
  const userTotals: Record<string, number> = {};
  data.forEach(item => {
    const itemDate = new Date(item.timestamp);
    // Only count data from the current month (same year and month as last date)
    if (itemDate.getFullYear() === year && itemDate.getMonth() === month) {
      userTotals[item.user] = (userTotals[item.user] || 0) + item.requestsUsed;
    }
  });

  // For each user, calculate their projected monthly usage
  let projectedExceedingUsers = 0;
  Object.entries(userTotals).forEach(([user, totalRequests]) => {
    // Calculate average daily requests for this user
    const averageDailyRequests = totalRequests / daysElapsed;
    
    // Project to full month
    const projectedMonthlyRequests = averageDailyRequests * totalDaysInMonth;
    
    // Check if they would exceed the limit
    if (projectedMonthlyRequests > planLimit) {
      projectedExceedingUsers++;
    }
  });

  return projectedExceedingUsers;
}

/**
 * Get detailed data for users projected to exceed their quota by month-end
 * @param data - Array of Copilot usage data
 * @param plan - The plan type to check limits against (defaults to BUSINESS)
 */
export function getProjectedUsersExceedingQuotaDetails(data: CopilotUsageData[], plan: string = COPILOT_PLANS.BUSINESS): ProjectedUserData[] {
  if (!data.length) return [];

  // Get the plan limit for comparison
  const planLimit = PLAN_MONTHLY_LIMITS[plan] || PLAN_MONTHLY_LIMITS[COPILOT_PLANS.BUSINESS];

  // Get the last date from the data to determine the current month and days elapsed
  const lastDate = getLastDateFromData(data);
  if (!lastDate) return [];

  const lastDateObj = new Date(lastDate);
  const year = lastDateObj.getFullYear();
  const month = lastDateObj.getMonth();
  
  // Calculate the first day of the month and days elapsed (inclusive)
  const firstDayOfMonth = new Date(year, month, 1);
  const daysElapsed = lastDateObj.getDate(); // getDate() returns day of month (1-31)
  
  // Calculate total days in this month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Aggregate total requests per user for the current month only
  const userTotals: Record<string, number> = {};
  data.forEach(item => {
    const itemDate = new Date(item.timestamp);
    // Only count data from the current month (same year and month as last date)
    if (itemDate.getFullYear() === year && itemDate.getMonth() === month) {
      userTotals[item.user] = (userTotals[item.user] || 0) + item.requestsUsed;
    }
  });

  // Build the list of users projected to exceed quota
  const projectedUsers: ProjectedUserData[] = [];
  Object.entries(userTotals).forEach(([user, totalRequests]) => {
    // Calculate average daily requests for this user
    const averageDailyRequests = totalRequests / daysElapsed;
    
    // Project to full month
    const projectedMonthlyRequests = averageDailyRequests * totalDaysInMonth;
    
    // Check if they would exceed the limit
    if (projectedMonthlyRequests > planLimit) {
      projectedUsers.push({
        user,
        currentRequests: totalRequests,
        projectedMonthlyTotal: projectedMonthlyRequests,
        daysElapsed,
        dailyAverage: averageDailyRequests
      });
    }
  });

  // Sort by projected total descending (highest projected usage first)
  return projectedUsers.sort((a, b) => b.projectedMonthlyTotal - a.projectedMonthlyTotal);
}
