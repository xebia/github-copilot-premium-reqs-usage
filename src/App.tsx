import React, { useState, useCallback, useRef, DragEvent, useEffect } from "react";
import { Upload, GithubLogo, CircleNotch } from "@phosphor-icons/react";
import { toast, Toaster } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeploymentFooter } from "@/components/DeploymentFooter";
import { 
  AggregatedData, 
  CopilotUsageData, 
  ModelUsageSummary,
  DailyModelData,
  PowerUserSummary,
  PowerUserDailyBreakdown,
  ExceededRequestDetail,
  ProjectedUserData,
  aggregateDataByDay, 
  parseCSV,
  getModelUsageSummary,
  getDailyModelData,
  getPowerUsers,
  getPowerUserDailyData,
  COPILOT_PLANS,
  getPowerUserDailyBreakdown,
  getUniqueModelsFromBreakdown,
  getLastDateFromData,
  getExceededRequestDetails,
  getUserExceededRequestSummary,
  getUniqueUsersExceedingQuota,
  getTotalRequestsForUsersExceedingQuota,
  getProjectedUsersExceedingQuota,
  getProjectedUsersExceedingQuotaDetails,
  EXCESS_REQUEST_COST
} from "@/lib/utils";

function App() {
  const [data, setData] = useState<CopilotUsageData[] | null>(null);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[]>([]);
  const [uniqueModels, setUniqueModels] = useState<string[]>([]);
  const [modelSummary, setModelSummary] = useState<ModelUsageSummary[]>([]);
  const [dailyModelData, setDailyModelData] = useState<DailyModelData[]>([]);
  const [powerUserSummary, setPowerUserSummary] = useState<PowerUserSummary | null>(null);
  const [powerUserDailyBreakdown, setPowerUserDailyBreakdown] = useState<PowerUserDailyBreakdown[]>([]);
  const [selectedPowerUser, setSelectedPowerUser] = useState<string | null>(null);
  const [lastDateAvailable, setLastDateAvailable] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>(COPILOT_PLANS.BUSINESS); // Default to Business
  const [isProcessing, setIsProcessing] = useState(false);
  const [visibleBars, setVisibleBars] = useState(['compliantRequests', 'exceedingRequests']);
  const [showExceededDetails, setShowExceededDetails] = useState(false);
  const [exceededDetailsData, setExceededDetailsData] = useState<ExceededRequestDetail[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [usersExceedingQuota, setUsersExceedingQuota] = useState<number>(0);
  const [projectedUsersExceedingQuota, setProjectedUsersExceedingQuota] = useState<number>(0);
  const [showPotentialCostDetails, setShowPotentialCostDetails] = useState(false);
  const [showProjectedUsersDialog, setShowProjectedUsersDialog] = useState(false);
  const [projectedUsersData, setProjectedUsersData] = useState<ProjectedUserData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Recalculate users exceeding quota when plan selection changes
  useEffect(() => {
    if (data && data.length > 0) {
      const exceedingUsersCount = getUniqueUsersExceedingQuota(data, selectedPlan);
      setUsersExceedingQuota(exceedingUsersCount);
      
      const projectedExceedingUsersCount = getProjectedUsersExceedingQuota(data, selectedPlan);
      setProjectedUsersExceedingQuota(projectedExceedingUsersCount);
      
      const projectedDetails = getProjectedUsersExceedingQuotaDetails(data, selectedPlan);
      setProjectedUsersData(projectedDetails);
    }
  }, [selectedPlan, data]);
  
  const handlePowerUserSelect = useCallback((userName: string | null) => {
    setSelectedPowerUser(userName);
  }, []);

  // Generate filtered power user daily breakdown based on selected user
  const getFilteredPowerUserBreakdown = useCallback(() => {
    if (!selectedPowerUser || !data) {
      return powerUserDailyBreakdown;
    }
    
    // Filter the original data to only include the selected user, then regenerate breakdown
    return getPowerUserDailyBreakdown(data, [selectedPowerUser]);
  }, [selectedPowerUser, data, powerUserDailyBreakdown]);

  // Get unique models from the power user breakdown data
  const getPowerUserModels = useCallback(() => {
    const breakdown = getFilteredPowerUserBreakdown();
    return getUniqueModelsFromBreakdown(breakdown);
  }, [getFilteredPowerUserBreakdown]);

  const processFile = useCallback((file: File) => {
    if (!file) return;
    
    // Add basic file validation
    if (!file.type.includes('text') && !file.type.includes('csv') && !file.name.endsWith('.csv')) {
      toast.error("Please upload a valid CSV or text file.");
      return;
    }
    
    setIsProcessing(true);
    
    const reader = new FileReader();
    
    reader.onerror = () => {
      setIsProcessing(false);
      toast.error("Failed to read the file. The file may be corrupted or unreadable.");
    };
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        if (!csvContent) throw new Error("Failed to read file content");
        
        // Check if the content looks like text (not binary)
        if (csvContent.includes('\0')) {
          throw new Error("File appears to be binary. Please upload a text-based CSV file.");
        }
        
        // Check for minimum content
        if (csvContent.trim().length === 0) {
          throw new Error("File is empty. Please upload a CSV file with data.");
        }
        
        const parsedData = parseCSV(csvContent);
        setData(parsedData);
        
        // Get unique models
        const models = Array.from(new Set(parsedData.map(item => item.model)));
        setUniqueModels(models);
        
        // Aggregate data by day and model
        const aggregated = aggregateDataByDay(parsedData);
        setAggregatedData(aggregated);
        
        // Get model usage summary
        const summary = getModelUsageSummary(parsedData);
        setModelSummary(summary);
        
        // Get daily model data for bar chart
        const dailyData = getDailyModelData(parsedData);
        setDailyModelData(dailyData);
        
        // Get power users data
        const powerUsers = getPowerUsers(parsedData);
        setPowerUserSummary(powerUsers);
        
        // Get power user daily breakdown for the stacked bar chart
        const powerUserNames = powerUsers.powerUsers.map(user => user.user);
        const powerUserBreakdown = getPowerUserDailyBreakdown(parsedData, powerUserNames);
        setPowerUserDailyBreakdown(powerUserBreakdown);
        
        // Get count of users exceeding quota for top bar display
        const exceedingUsersCount = getUniqueUsersExceedingQuota(parsedData, selectedPlan);
        setUsersExceedingQuota(exceedingUsersCount);
        
        // Get projected count of users who will exceed quota by month-end
        const projectedExceedingUsersCount = getProjectedUsersExceedingQuota(parsedData, selectedPlan);
        setProjectedUsersExceedingQuota(projectedExceedingUsersCount);
        
        // Get projected users details
        const projectedDetails = getProjectedUsersExceedingQuotaDetails(parsedData, selectedPlan);
        setProjectedUsersData(projectedDetails);
        
        // Get the last date available in the CSV
        const lastDate = getLastDateFromData(parsedData);
        setLastDateAvailable(lastDate);
        
        // Reset selected power user when new data is loaded
        setSelectedPowerUser(null);
        
        setIsProcessing(false);
        toast.success(`Loaded ${parsedData.length} records successfully`);
      } catch (error) {
        // Provide user-friendly error messages  
        let errorMessage = "Failed to parse CSV file. Please check the format.";
        
        if (error instanceof Error) {
          // Log detailed error information to console for debugging
          console.error("CSV parsing error details:", error);
          
          // Provide more specific error messages based on the error type
          if (error.message.includes("missing required columns")) {
            errorMessage = "Invalid CSV format: " + error.message;
          } else if (error.message.includes("Invalid timestamp")) {
            errorMessage = "Invalid data format: " + error.message;
          } else if (error.message.includes("Invalid requests used")) {
            errorMessage = "Invalid data format: " + error.message;
          } else if (error.message.includes("Invalid exceeds quota")) {
            errorMessage = "Invalid data format: " + error.message;
          } else if (error.message.includes("Invalid CSV row format")) {
            errorMessage = "Invalid CSV structure: " + error.message;
          } else if (error.message.includes("binary")) {
            errorMessage = error.message;
          } else if (error.message.includes("empty")) {
            errorMessage = error.message;
          } else if (error.message.includes("header")) {
            errorMessage = "Invalid CSV format: " + error.message;
          } else {
            errorMessage = error.message;
          }
        }
        
        setIsProcessing(false);
        toast.error(errorMessage);
        setData(null);
        setAggregatedData([]);
        setModelSummary([]);
        setDailyModelData([]);
        setPowerUserSummary(null);
        setPowerUserDailyBreakdown([]);
        setSelectedPowerUser(null);
        setUsersExceedingQuota(0);
        setLastDateAvailable(null);
      }
    };
    
    reader.readAsText(file);
  }, []);
  
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset the input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  }, [processFile, isProcessing]);
  
  const handleButtonClick = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };
  
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (isProcessing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [isProcessing]);
  
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (isProcessing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, [isProcessing]);
  
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (isProcessing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "text/csv" || file.name.endsWith('.csv') || file.type.includes('text')) {
        processFile(file);
      } else {
        toast.error("Please upload a CSV file. Supported formats: .csv files or text files with CSV content.");
      }
    }
  }, [processFile, isProcessing]);
  
  // Generate chart data grouped by date with total compliant and exceeding requests
  const chartData = useCallback(() => {
    if (!aggregatedData.length) return [];
    
    // Group by date first
    const groupedByDate: Record<string, any> = {};
    
    aggregatedData.forEach(item => {
      if (!groupedByDate[item.date]) {
        groupedByDate[item.date] = { 
          date: item.date,
          compliant: 0,
          exceeding: 0
        };
      }
      
      // Add to total compliant and exceeding requests
      groupedByDate[item.date].compliant += item.compliantRequests;
      groupedByDate[item.date].exceeding += item.exceedingRequests;
    });
    
    // Convert to array sorted by date
    return Object.values(groupedByDate).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
  }, [aggregatedData]);
  
  // Generate bar chart data grouped by date and model
  const barChartData = useCallback(() => {
    if (!dailyModelData.length) return [];
    
    // Group by date first
    const groupedByDate: Record<string, any> = {};
    
    // Get all unique dates and models
    const dates = new Set<string>();
    const models = new Set<string>();
    
    dailyModelData.forEach(item => {
      dates.add(item.date);
      models.add(item.model);
    });
    
    // Create entries for each date
    dates.forEach(date => {
      groupedByDate[date] = { 
        date,
      };
      
      // Initialize models with zero
      models.forEach(model => {
        groupedByDate[date][model] = 0;
      });
    });
    
    // Fill in the actual data
    dailyModelData.forEach(item => {
      groupedByDate[item.date][item.model] = item.requests;
    });
    
    // Convert to array sorted by date
    return Object.values(groupedByDate).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    );
  }, [dailyModelData]);

  // Get unique model names for bar chart
  const getUniqueModelsForBarChart = useCallback(() => {
    return uniqueModels;
  }, [uniqueModels]);
  
  // Generate colors for models in bar chart
  const getModelColors = useCallback(() => {
    // Use a set of predefined colors that are visually distinct from exceeding requests red (#ef4444)
    const colors = [
      "#8B5CF6", // Purple
      "#9C27B0", // Purple (changed from red to avoid confusion with exceeding requests)
      "#FBBC05", // Yellow
      "#9333ea", // Purple
      "#8E44AD", // Purple
      "#F39C12", // Orange
      "#16A085", // Teal
      "#FF9800", // Amber (changed from red-orange to avoid confusion with exceeding requests)
      "#A855F7", // Light Purple
      "#1ABC9C"  // Turquoise
    ];
    
    return uniqueModels.reduce((acc, model, index) => {
      acc[model] = colors[index % colors.length];
      return acc;
    }, {} as Record<string, string>);
  }, [uniqueModels]);

  // Helper function to get plan limit based on selected plan
  const getPlanLimit = useCallback((item: ModelUsageSummary) => {
    let limit: number;
    switch (selectedPlan) {
      case COPILOT_PLANS.INDIVIDUAL:
        limit = item.individualPlanLimit;
        break;
      case COPILOT_PLANS.BUSINESS:
        limit = item.businessPlanLimit;
        break;
      case COPILOT_PLANS.ENTERPRISE:
        limit = item.enterprisePlanLimit;
        break;
      default:
        limit = item.businessPlanLimit;
    }
    
    // For 0x multiplier models, show "Unlimited" despite having constant plan limits
    return item.multiplier === 0 ? "Unlimited" : limit.toLocaleString();
  }, [selectedPlan]);

  const handleLegendClick = (barKey) => {
    if (barKey === 'all') {
      setVisibleBars(['compliantRequests', 'exceedingRequests']);
    } else {
      // Map the display names back to data keys
      const dataKeyMap = {
        'Compliant Requests': 'compliantRequests',
        'Exceeding Requests': 'exceedingRequests'
      };
      const actualKey = dataKeyMap[barKey] || barKey;
      setVisibleBars([actualKey]);
    }
  };

  const handleExceedingBarClick = (barData) => {
    if (!data || !selectedPowerUser) return;
    
    // Get the date from the clicked bar for display purposes
    const clickedDate = barData.date;
    setSelectedDate(clickedDate);
    
    // Get exceeded request details for the selected power user across ALL dates
    const exceededDetails = getExceededRequestDetails(data, null, selectedPowerUser);
    setExceededDetailsData(exceededDetails);
    setShowExceededDetails(true);
  };

  const CustomLegend = ({ payload }) => {
    // Define all possible bars
    const allPossibleBars = ['compliantRequests', 'exceedingRequests'];
    const showAllOption = allPossibleBars.length > 1 && visibleBars.length === 1;
    
    return (
      <ul className="flex gap-4">
        {/* Only show "All Requests" if there are multiple filter options and not all are currently visible */}
        {showAllOption && (
          <li
            className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-black"
            onClick={() => handleLegendClick('all')}
          >
            <span className="w-4 h-4 bg-gray-400"></span>
            All Requests
          </li>
        )}
        {payload.map((entry) => (
          <li
            key={entry.dataKey}
            className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-black"
            onClick={() => handleLegendClick(entry.dataKey)}
          >
            <span className="w-4 h-4" style={{ backgroundColor: entry.color }}></span>
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 min-h-screen">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="xebia-logo.png" alt="Xebia Logo" className="h-10" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              GitHub Copilot Premium Requests Usage Analyzer
            </h1>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://github.com/devops-actions/github-copilot-premium-reqs-usage" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <GithubLogo size={16} />
              Contribute
            </a>
          </Button>
        </div>
      </header>
      
      {!(data && data.length > 0) && (
        <Card className="mb-8">
          <div 
            className={`p-6 text-center ${isDragging ? 'bg-secondary/50' : ''} ${isProcessing ? 'opacity-50 pointer-events-none' : ''} transition-colors duration-200`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mb-4">
              {isProcessing ? (
                <CircleNotch size={48} weight="thin" className="mx-auto text-muted-foreground animate-spin" />
              ) : (
                <Upload size={48} weight="thin" className="mx-auto text-muted-foreground" />
              )}
            </div>
            
            <h2 className="text-xl font-medium mb-2">
              {isProcessing ? "Processing CSV..." : "Upload CSV File"}
            </h2>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {isProcessing 
                ? "Please wait while we process your file..." 
                : isDragging 
                  ? "Drop your file here..." 
                  : "Upload your GitHub Copilot premium requests usage CSV export to visualize the data. Drag and drop or select a file."}
            </p>
            
            <Button 
              onClick={handleButtonClick} 
              className="cursor-pointer"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Select CSV File"}
            </Button>
            <input
              ref={fileInputRef}
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isProcessing}
            />
          </div>
        </Card>
      )}
      
      {data && data.length > 0 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Usage Statistics</h2>
            <Separator className="mb-4" />
            <div className="mb-4">
              <Card>
                <div className="p-5">
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Total Requests:</span>
                      <span className="text-lg font-bold">
                        {data.reduce((sum, item) => sum + item.requestsUsed, 0).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Unique Users:</span>
                      <span className="text-lg font-bold">
                        {new Set(data.map(item => item.user)).size.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Models Used:</span>
                      <span className="text-lg font-bold">
                        {uniqueModels.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Users Exceeding Quota:</span>
                      <span className="text-lg font-bold text-red-600">
                        {usersExceedingQuota.toLocaleString()}
                      </span>
                    </div>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:bg-purple-100/80 dark:hover:bg-purple-900/20 transition-colors rounded-md -m-1 p-1"
                      onClick={() => setShowProjectedUsersDialog(true)}
                      title="Click to see detailed list"
                    >
                      <span className="text-sm text-muted-foreground">Projected to Exceed by Month-End:</span>
                      <span className="text-lg font-bold text-orange-600">
                        {projectedUsersExceedingQuota.toLocaleString()}
                      </span>
                    </div>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:bg-purple-100/80 dark:hover:bg-purple-900/20 transition-colors rounded-md -m-1 p-1"
                      onClick={() => setShowPotentialCostDetails(true)}
                      title="Click to see cost breakdown"
                    >
                      <span className="text-sm text-muted-foreground">Potential Cost:</span>
                      <span className="text-lg font-bold text-orange-600">
                        ${(data.reduce((sum, item) => sum + item.requestsUsed, 0) * EXCESS_REQUEST_COST).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    {powerUserSummary && (
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Sheet>
                            <SheetTrigger asChild>
                              <div className="flex items-center gap-2 cursor-pointer hover:bg-purple-100/80 dark:hover:bg-purple-900/20 transition-colors rounded-md -m-1 p-1">
                                <span className="text-sm text-muted-foreground">Power Users:</span>
                                <span className="text-lg font-bold">{powerUserSummary.totalPowerUsers}</span>
                              </div>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[90vh] max-w-[90%] mx-auto overflow-y-auto">
                              <div className="p-7">
                                <SheetHeader>
                                  <SheetTitle className="text-xl">Power Users Analysis</SheetTitle>
                                </SheetHeader>
                                <div className="mt-6 space-y-6">
                            {/* Power User Summary */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <Card className="p-4">
                                <h3 className="text-md font-medium mb-3">Total Requests by Power Users</h3>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Total Requests:</span>
                                    <span className="font-bold">
                                      {powerUserSummary.totalPowerUserRequests.toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Power Users Count:</span>
                                    <span className="font-bold">{powerUserSummary.totalPowerUsers}</span>
                                  </div>
                                </div>
                              </Card>
                              
                              <Card className="p-4">
                                <h3 className="text-md font-medium mb-3">Requests per Model</h3>
                                <div className="overflow-auto max-h-40">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Model</TableHead>
                                        <TableHead className="text-right">Requests</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {powerUserSummary.powerUserModelSummary.map((item) => (
                                        <TableRow key={item.model}>
                                          <TableCell className="font-medium">{item.model}</TableCell>
                                          <TableCell className="text-right">{item.totalRequests.toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </Card>
                            </div>
                            
                            {/* Power User Activity Chart */}
                            <Card className="p-4">
                              <h3 className="text-md font-medium mb-3">Power User Activity Over Time</h3>
                              <div className="h-[300px]">
                                <ChartContainer 
                                  config={{
                                    requests: { color: "#3b82f6" },
                                  }}
                                  className="h-full w-full"
                                >
                                  <LineChart data={getPowerUserDailyData(powerUserSummary.powerUsers)}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis 
                                      dataKey="date" 
                                      tick={{ fill: 'var(--foreground)' }}
                                      tickLine={{ stroke: 'var(--border)' }}
                                      domain={['dataMin', lastDateAvailable || 'dataMax']}
                                    />
                                    <YAxis 
                                      tick={{ fill: 'var(--foreground)' }}
                                      tickLine={{ stroke: 'var(--border)' }} 
                                    />
                                    <ChartTooltip
                                      content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="border rounded-lg bg-background shadow-lg p-3 text-xs">
                                              <div className="font-medium mb-2">{label}</div>
                                              <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                                                <span>Requests: {Number(payload[0].value).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}</span>
                                              </div>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="requests"
                                      name="Requests"
                                      stroke="#3b82f6" 
                                      strokeWidth={2}
                                      activeDot={{ r: 6 }}
                                    />
                                  </LineChart>
                                </ChartContainer>
                              </div>
                            </Card>
                            
                            {/* Power User Requests Breakdown - Stacked Bar Chart */}
                            <Card className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-md font-medium ${selectedPowerUser ? 'cursor-pointer hover:bg-purple-100/80 dark:hover:bg-purple-900/20 transition-colors rounded-md -m-1 p-1' : ''}`}
                                  onClick={() => selectedPowerUser && handlePowerUserSelect(null)}
                                  title={selectedPowerUser ? 'Click to show all power users' : undefined}
                                >
                                  Power User Requests Breakdown (By Model & Compliance)
                                  {selectedPowerUser && (
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                      - {selectedPowerUser}
                                    </span>
                                  )}
                                  {selectedPowerUser && (
                                    <div className="text-xs text-muted-foreground font-normal mt-1">
                                      💡 Click on red bars to see all exceeded request details for this user
                                    </div>
                                  )}
                                </h3>
                                {selectedPowerUser && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handlePowerUserSelect(null)}
                                  >
                                    Show All
                                  </Button>
                                )}
                              </div>
                              <div className="h-[300px]">
                                <ChartContainer 
                                  config={(() => {
                                    const models = getPowerUserModels();
                                    const modelColors = getModelColors();
                                    const config: Record<string, { color: string }> = {
                                      compliantRequests: { color: "#10b981" }, // green
                                      exceedingRequests: { color: "#ef4444" }, // red
                                    };
                                    
                                    // Add each model with its color
                                    models.forEach((model, index) => {
                                      config[model] = { color: modelColors[model] || "#94a3b8" };
                                    });
                                    
                                    return config;
                                  })()}
                                  className="h-full w-full"
                                >
                                  <BarChart data={getFilteredPowerUserBreakdown()}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis 
                                      dataKey="date" 
                                      tick={{ fill: 'var(--foreground)' }}
                                      tickLine={{ stroke: 'var(--border)' }}
                                      domain={['dataMin', lastDateAvailable || 'dataMax']}
                                    />
                                    <YAxis 
                                      tick={{ fill: 'var(--foreground)' }}
                                      tickLine={{ stroke: 'var(--border)' }} 
                                    />
                                    <ChartTooltip
                                      content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        
                                        // Filter to only show data for visible bars
                                        const visibleData = payload.filter(p => visibleBars.includes(p.dataKey));
                                        if (!visibleData.length) return null;
                                        
                                        // Configuration for tooltip items
                                        const tooltipConfig = {
                                          compliantRequests: { 
                                            label: 'Compliant', 
                                            color: 'bg-[#10b981]' 
                                          },
                                          exceedingRequests: { 
                                            label: 'Exceeding', 
                                            color: 'bg-[#ef4444]' 
                                          }
                                        };
                                        
                                        const formatNumber = (value) => 
                                          Number(value).toLocaleString(undefined, {
                                            maximumFractionDigits: 2, 
                                            minimumFractionDigits: 0
                                          });

                                        // Single filter view - show only the filtered data
                                        if (visibleData.length === 1) {
                                          const item = visibleData[0];
                                          const config = tooltipConfig[item.dataKey];
                                          
                                          return (
                                            <div className="border rounded-lg bg-background shadow-lg p-3 text-xs">
                                              <div className="font-medium mb-2">{label}</div>
                                              <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                                                <span>{config.label}: {formatNumber(item.value)}</span>
                                              </div>
                                            </div>
                                          );
                                        }

                                        // Multi-filter view - show detailed breakdown
                                        const values = visibleData.reduce((acc, item) => {
                                          acc[item.dataKey] = Number(item.value);
                                          return acc;
                                        }, {} as Record<string, number>);
                                        
                                        const total = Object.values(values).reduce((sum: number, val: number) => sum + val, 0);

                                        return (
                                          <div className="border rounded-lg bg-background shadow-lg p-3 text-xs">
                                            <div className="font-medium mb-2">{label}</div>
                                            <div className="grid grid-cols-2 gap-2">
                                              {visibleData.map(item => {
                                                const config = tooltipConfig[item.dataKey];
                                                return (
                                                  <React.Fragment key={item.dataKey}>
                                                    <div className="flex items-center gap-1.5">
                                                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                                                      <span>{config.label}:</span>
                                                    </div>
                                                    <div className="text-right">{formatNumber(item.value)}</div>
                                                  </React.Fragment>
                                                );
                                              })}
                                              <div className="font-medium">Total:</div>
                                              <div className="text-right font-medium">{formatNumber(total)}</div>
                                            </div>
                                          </div>
                                        );
                                      }}
                                    />
                                    <Legend content={(props) => <CustomLegend payload={props.payload} />} />
                                    
                                    {/* Dynamic stacked bars for each model */}
                                    {getPowerUserModels().map((model) => {
                                      const modelColors = getModelColors();
                                      return (
                                        <Bar
                                          key={model}
                                          dataKey={model}
                                          name={model}
                                          stackId="models"
                                          fill={modelColors[model] || "#94a3b8"}
                                        />
                                      );
                                    })}
                                    
                                    {/* Keep the original compliant/exceeding bars but make them toggleable */}
                                    {visibleBars.includes('compliantRequests') && (
                                      <Bar
                                        dataKey="compliantRequests"
                                        name="Compliant Requests"
                                        stackId="requests"
                                        fill="#10b981"
                                        onMouseOver={(e) => console.log('Hovered Compliant', e)}
                                      />
                                    )}
                                    {visibleBars.includes('exceedingRequests') && (
                                      <Bar
                                        dataKey="exceedingRequests"
                                        name="Exceeding Requests"
                                        stackId="requests"
                                        fill="#ef4444"
                                        onClick={handleExceedingBarClick}
                                        style={{ cursor: selectedPowerUser ? 'pointer' : 'default' }}
                                        onMouseOver={(e) => console.log('Hovered Exceeding', e)}
                                      />
                                    )}
                                  </BarChart>
                                </ChartContainer>
                              </div>
                            </Card>
                            
                            {/* Individual Power Users List */}
                            <Card className="p-4">
                              <h3 className="text-md font-medium mb-3">Individual Power Users</h3>
                              <div className="overflow-auto max-h-60">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">#</TableHead>
                                      <TableHead>User</TableHead>
                                      <TableHead className="text-right">Total Requests</TableHead>
                                      <TableHead className="text-right">Exceeding Requests</TableHead>
                                      <TableHead className="text-right">Models Used</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {powerUserSummary.powerUsers.map((user, index) => (
                                      <TableRow key={user.user}>
                                        <TableCell className="text-center text-muted-foreground font-medium">
                                          {index + 1}
                                        </TableCell>
                                        <TableCell 
                                          className={`font-medium cursor-pointer hover:text-blue-600 transition-colors ${selectedPowerUser === user.user ? 'text-blue-600 font-bold' : ''}`}
                                          onClick={() => handlePowerUserSelect(user.user)}
                                          title="Click to filter chart to this user"
                                        >
                                          {user.user}
                                        </TableCell>
                                        <TableCell className="text-right">{user.totalRequests.toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}</TableCell>
                                        <TableCell className="text-right">{user.exceedingRequests.toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}</TableCell>
                                        <TableCell className="text-right">{Object.keys(user.requestsByModel).length}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </Card>
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Power users are the top 10% of users by request count.<br/>
                          These users make the most requests to GitHub Copilot.</p>
                        </TooltipContent>
                      </UITooltip>
                    )}
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Model Usage Table */}
            <div className="mb-6">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-medium">Requests per Model</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Plan Type:</span>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={COPILOT_PLANS.INDIVIDUAL}>Individual</SelectItem>
                        <SelectItem value={COPILOT_PLANS.BUSINESS}>Business</SelectItem>
                        <SelectItem value={COPILOT_PLANS.ENTERPRISE}>Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="overflow-auto max-h-60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">Total Requests</TableHead>
                        <TableHead className="text-right">Compliant</TableHead>
                        <TableHead className="text-right">Exceeding</TableHead>
                        <TableHead className="text-right">Multiplier</TableHead>
                        <TableHead className="text-right">Plan Limit</TableHead>
                        <TableHead className="text-right">Excess Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modelSummary.map((item) => (
                        <TableRow key={item.model}>
                          <TableCell className="font-medium">{item.model}</TableCell>
                          <TableCell className="text-right">{item.totalRequests.toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}</TableCell>
                          <TableCell className="text-right">{item.compliantRequests.toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}</TableCell>
                          <TableCell className="text-right">{item.exceedingRequests.toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}</TableCell>
                          <TableCell className="text-right">{item.multiplier}x</TableCell>
                          <TableCell className="text-right">{getPlanLimit(item)}</TableCell>
                          <TableCell className="text-right">${item.excessCost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-accent/20">
                        <TableCell className="font-medium">Total</TableCell>
                        <TableCell className="text-right font-medium">
                          {modelSummary.reduce((sum, item) => sum + item.totalRequests, 0).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {modelSummary.reduce((sum, item) => sum + item.compliantRequests, 0).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {modelSummary.reduce((sum, item) => sum + item.exceedingRequests, 0).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}
                        </TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">${modelSummary.reduce((sum, item) => sum + item.excessCost, 0).toFixed(2)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </Card>
            </div>
            

          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-semibold">Daily Usage Overview</h2>
              {lastDateAvailable && (
                <div className="text-sm text-muted-foreground">
                  Data available through: <span className="font-medium">{lastDateAvailable}</span>
                </div>
              )}
            </div>
            <Separator className="mb-6" />
            <div className="bg-card p-4 rounded-lg border mb-8">
              <ChartContainer 
                config={{
                  compliant: { color: "#10b981" }, // green
                  exceeding: { color: "#ef4444" }, // red
                }} 
                className="h-[400px] w-full"
              >
                <LineChart data={chartData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'var(--foreground)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                    domain={['dataMin', lastDateAvailable || 'dataMax']}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--foreground)' }}
                    tickLine={{ stroke: 'var(--border)' }} 
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const compliant = payload.find(p => p.dataKey === 'compliant')?.value || 0;
                        const exceeding = payload.find(p => p.dataKey === 'exceeding')?.value || 0;
                        const total = Number(compliant) + Number(exceeding);
                        
                        return (
                          <div className="border rounded-lg bg-background shadow-lg p-3 text-xs">
                            <div className="font-medium mb-2">{label}</div>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                                  <span>Compliant:</span>
                                </div>
                                <div className="text-right">{Number(compliant).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}</div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                                  <span>Exceeding:</span>
                                </div>
                                <div className="text-right">{Number(exceeding).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}</div>
                                <div className="font-medium">Total:</div>
                                <div className="text-right font-medium">{Number(total).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}</div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  
                  {/* Show only two lines: compliant and exceeding */}
                  <Line
                    key="compliant"
                    type="monotone"
                    dataKey="compliant"
                    name="Compliant Requests"
                    stroke="#10b981" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    key="exceeding"
                    type="monotone"
                    dataKey="exceeding"
                    name="Exceeding Requests"
                    stroke="#ef4444" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
            
            {/* Bar Chart - Requests per Model per Day */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-semibold">Requests per Model per Day</h2>
              {lastDateAvailable && (
                <div className="text-sm text-muted-foreground">
                  Data available through: <span className="font-medium">{lastDateAvailable}</span>
                </div>
              )}
            </div>
            <Separator className="mb-6" />
            <div className="bg-card p-4 rounded-lg border">
              <ChartContainer 
                config={Object.entries(getModelColors()).reduce((acc, [model, color]) => {
                  acc[model] = { color };
                  return acc;
                }, {} as Record<string, { color: string }>)}
                className="h-[500px] w-full"
              >
                <BarChart data={barChartData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="date"
                    tick={{ fill: 'var(--foreground)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                    domain={['dataMin', lastDateAvailable || 'dataMax']}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--foreground)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="border rounded-lg bg-background shadow-lg p-3">
                            <div className="font-medium mb-2">{label}</div>
                            <div className="space-y-2">
                              {payload.map((entry, index) => (
                                <div key={`item-${index}`} className="flex justify-between items-center gap-4">
                                  <div className="flex items-center gap-1.5">
                                    <div 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span>{entry.name}:</span>
                                  </div>
                                  <div className="font-medium">{Number(entry.value).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  
                  {/* Generate a bar for each model */}
                  {getUniqueModelsForBarChart().map((model, index) => (
                    <Bar 
                      key={model}
                      dataKey={model}
                      name={model}
                      fill={getModelColors()[model]}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </div>
      )}

      {/* Exceeded Request Details Dialog */}
      <Dialog open={showExceededDetails} onOpenChange={setShowExceededDetails}>
        <DialogContent className="w-[98vw] max-w-none max-h-[85vh] overflow-y-auto" style={{ width: '98vw', maxWidth: 'none' }}>
          <DialogHeader>
            <DialogTitle>
              Exceeded Request Details
              {selectedPowerUser && ` - ${selectedPowerUser}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {exceededDetailsData.length > 0 ? (
              <>
                {/* Summary Card */}
                {selectedPowerUser && data && (
                  <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">User Summary</h3>
                    {(() => {
                      const userSummary = getUserExceededRequestSummary(data, selectedPowerUser);
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Total Days with Exceeded Requests</div>
                            <div className="text-lg font-bold">{userSummary.totalExceededDays}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Total Exceeded Requests</div>
                            <div className="text-lg font-bold">{userSummary.totalExceededRequests.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Average Exceeded per Day</div>
                            <div className="text-lg font-bold">{userSummary.averageExceededPerDay.toFixed(1)}</div>
                          </div>
                          {userSummary.worstDay && (
                            <div>
                              <div className="text-sm text-muted-foreground">Worst Day</div>
                              <div className="text-sm font-bold">{userSummary.worstDay.date}</div>
                              <div className="text-xs text-muted-foreground">
                                {userSummary.worstDay.exceededRequests} exceeded of {userSummary.worstDay.totalRequests} total
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </Card>
                )}

                {/* Detailed Table */}
                <Card className="p-4">
                  <h3 className="text-md font-medium mb-3">
                    All Exceeded Request Days ({exceededDetailsData.length} days)
                  </h3>
                  <div className="overflow-auto" style={{ minWidth: '100%' }}>
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Date</TableHead>
                          <TableHead className="text-right min-w-[140px]">Exceeded Requests</TableHead>
                          <TableHead className="text-right min-w-[160px]">Total Requests (Day)</TableHead>
                          <TableHead className="text-right min-w-[150px]">Compliant Requests</TableHead>
                          <TableHead className="min-w-[200px]">Models Used</TableHead>
                          <TableHead className="min-w-[200px]">Exceeding by Model</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exceededDetailsData.map((detail, index) => (
                          <TableRow key={`${detail.user}-${detail.date}-${index}`}>
                            <TableCell>{detail.date}</TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              {detail.exceededRequests.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {detail.totalRequestsOnDay.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {detail.compliantRequestsOnDay.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {detail.modelsUsed.map((model, idx) => (
                                  <span 
                                    key={idx} 
                                    className="inline-block bg-secondary px-2 py-1 rounded text-xs"
                                  >
                                    {model}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {Object.entries(detail.exceedingByModel).map(([model, requests]) => (
                                  <div key={model} className="text-xs">
                                    <span className="font-medium">{model}:</span> {requests.toLocaleString()}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No exceeded request details found for the selected criteria.</p>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Potential Cost Details Dialog */}
      <Dialog open={showPotentialCostDetails} onOpenChange={setShowPotentialCostDetails}>
        <DialogContent className="!max-w-none w-[80vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Potential Cost Breakdown</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data && (
              <>
                {/* Left Column */}
                <div className="space-y-6">
                  {/* All Premium Requests */}
                  <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">All Premium Requests</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Requests:</span>
                        <span className="font-bold">
                          {data.reduce((sum, item) => sum + item.requestsUsed, 0).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cost per Request:</span>
                        <span className="font-bold">${EXCESS_REQUEST_COST.toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Hypothetical Cost:</span>
                        <span className="font-bold text-orange-600 text-lg">
                          ${(data.reduce((sum, item) => sum + item.requestsUsed, 0) * EXCESS_REQUEST_COST).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Projected Users Extra Cost */}
                  <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">Projected Users Extra Cost by Month-End</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Users Projected to Exceed:</span>
                        <span className="font-bold text-orange-600">
                          {projectedUsersData.length.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Projected Extra Requests:</span>
                        <span className="font-bold text-orange-600">
                          {(() => {
                            const planLimit = selectedPlan === COPILOT_PLANS.INDIVIDUAL ? 50 : 
                                            selectedPlan === COPILOT_PLANS.BUSINESS ? 300 : 1000;
                            const totalExceeding = projectedUsersData.reduce((sum, user) => 
                              sum + Math.max(0, user.projectedMonthlyTotal - planLimit), 0);
                            return totalExceeding.toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cost per Request:</span>
                        <span className="font-bold">${EXCESS_REQUEST_COST.toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Projected Extra Cost:</span>
                        <span className="font-bold text-orange-600 text-lg">
                          {(() => {
                            const planLimit = selectedPlan === COPILOT_PLANS.INDIVIDUAL ? 50 : 
                                            selectedPlan === COPILOT_PLANS.BUSINESS ? 300 : 1000;
                            const totalExceeding = projectedUsersData.reduce((sum, user) => 
                              sum + Math.max(0, user.projectedMonthlyTotal - planLimit), 0);
                            const totalCost = totalExceeding * EXCESS_REQUEST_COST;
                            return `$${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Exceeding Users Only */}
                  <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">Users Exceeding {selectedPlan === COPILOT_PLANS.INDIVIDUAL ? '50' : selectedPlan === COPILOT_PLANS.BUSINESS ? '300' : '1,000'} Request Limit Only</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Exceeding Requests:</span>
                        <span className="font-bold text-red-600">
                          {getTotalRequestsForUsersExceedingQuota(data, selectedPlan).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cost per Request:</span>
                        <span className="font-bold">${EXCESS_REQUEST_COST.toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Cost for Exceeding Requests Only:</span>
                        <span className="font-bold text-red-600 text-lg">
                          ${(getTotalRequestsForUsersExceedingQuota(data, selectedPlan) * EXCESS_REQUEST_COST).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Summary */}
                  <Card className="p-4 bg-secondary/20">
                    <h3 className="text-md font-medium mb-3">Summary</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>All Premium Requests:</strong> Shows the hypothetical cost if all premium requests were charged at ${EXCESS_REQUEST_COST} each, regardless of user quotas.</p>
                      <p><strong>Exceeding Users Only:</strong> Shows the cost for all requests made by users who have exceeded the {selectedPlan === COPILOT_PLANS.INDIVIDUAL ? '50' : selectedPlan === COPILOT_PLANS.BUSINESS ? '300' : '1000'} monthly request limit per user.</p>
                      <p><strong>Projected Users Extra Cost:</strong> Shows the projected cost for users who are likely to exceed their monthly quota by month-end based on current usage patterns.</p>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Projected Users Dialog */}
      <Dialog open={showProjectedUsersDialog} onOpenChange={setShowProjectedUsersDialog}>
        <DialogContent className="!max-w-none w-[80vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Users Projected to Exceed Monthly Quota by Month-End
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {projectedUsersData.length > 0 ? (
              <>
                {/* Summary Card */}
                <Card className="p-4">
                  <h3 className="text-md font-medium mb-3">Projection Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Users at Risk</div>
                      <div className="text-lg font-bold text-orange-600">{projectedUsersData.length}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Plan Limit</div>
                      <div className="text-lg font-bold">
                        {selectedPlan === COPILOT_PLANS.INDIVIDUAL ? '50' : 
                         selectedPlan === COPILOT_PLANS.BUSINESS ? '300' : '1,000'} requests/month
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Days Elapsed</div>
                      <div className="text-lg font-bold">{projectedUsersData[0]?.daysElapsed || 0} days</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Projected Monthly Total</div>
                      <div className="text-lg font-bold text-orange-600">
                        {projectedUsersData.reduce((sum, user) => sum + user.projectedMonthlyTotal, 0)
                          .toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0})}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                      <div className="text-lg font-bold text-red-600">
                        {(() => {
                          const planLimit = selectedPlan === COPILOT_PLANS.INDIVIDUAL ? 50 : 
                                          selectedPlan === COPILOT_PLANS.BUSINESS ? 300 : 1000;
                          const totalExceeding = projectedUsersData.reduce((sum, user) => 
                            sum + Math.max(0, user.projectedMonthlyTotal - planLimit), 0);
                          const totalCost = totalExceeding * EXCESS_REQUEST_COST;
                          return `$${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">Based on Current Month Data</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Projection assumes consistent usage patterns through month-end
                    </div>
                  </div>
                </Card>

                {/* Users Table */}
                <Card className="p-4">
                  <h3 className="text-md font-medium mb-3">
                    User Details ({projectedUsersData.length} users)
                  </h3>
                  <div className="overflow-auto max-h-[60vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead className="min-w-[120px]">User</TableHead>
                          <TableHead className="text-right min-w-[80px]">Current</TableHead>
                          <TableHead className="text-right min-w-[80px]">Daily Avg</TableHead>
                          <TableHead className="text-right min-w-[80px]">Projected</TableHead>
                          <TableHead className="text-right min-w-[80px]">Exceeding</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectedUsersData.map((user, index) => {
                          const planLimit = selectedPlan === COPILOT_PLANS.INDIVIDUAL ? 50 : 
                                          selectedPlan === COPILOT_PLANS.BUSINESS ? 300 : 1000;
                          const exceedingBy = user.projectedMonthlyTotal - planLimit;
                          
                          return (
                            <TableRow key={user.user}>
                              <TableCell className="text-center text-muted-foreground font-medium text-xs">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium text-sm" title={user.user}>{user.user}</TableCell>
                              <TableCell className="text-right text-sm">
                                {user.currentRequests.toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0})}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {user.dailyAverage.toLocaleString(undefined, {maximumFractionDigits: 1, minimumFractionDigits: 1})}
                              </TableCell>
                              <TableCell className="text-right font-medium text-orange-600 text-sm">
                                {user.projectedMonthlyTotal.toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0})}
                              </TableCell>
                              <TableCell className="text-right font-medium text-red-600 text-sm">
                                +{exceedingBy.toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0})}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFooter>
                        <TableRow className="bg-muted/50">
                          <TableCell className="text-center font-bold text-xs">
                            Total
                          </TableCell>
                          <TableCell className="font-bold text-sm">
                            {projectedUsersData.length} users
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm">
                            {projectedUsersData.reduce((sum, user) => sum + user.currentRequests, 0)
                              .toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0})}
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm">
                            {(projectedUsersData.reduce((sum, user) => sum + user.dailyAverage, 0))
                              .toLocaleString(undefined, {maximumFractionDigits: 1, minimumFractionDigits: 1})}
                          </TableCell>
                          <TableCell className="text-right font-bold text-orange-600 text-sm">
                            {projectedUsersData.reduce((sum, user) => sum + user.projectedMonthlyTotal, 0)
                              .toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0})}
                          </TableCell>
                          <TableCell className="text-right font-bold text-red-600 text-sm">
                            {(() => {
                              const planLimit = selectedPlan === COPILOT_PLANS.INDIVIDUAL ? 50 : 
                                              selectedPlan === COPILOT_PLANS.BUSINESS ? 300 : 1000;
                              const totalExceeding = projectedUsersData.reduce((sum, user) => 
                                sum + Math.max(0, user.projectedMonthlyTotal - planLimit), 0);
                              const totalCost = totalExceeding * EXCESS_REQUEST_COST;
                              
                              return (
                                <div className="flex flex-col items-end">
                                  <div>+{totalExceeding.toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0})}</div>
                                  <div className="text-xs text-muted-foreground">
                                    ${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} cost
                                  </div>
                                </div>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No users are currently projected to exceed their monthly quota based on current usage patterns.
                </p>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" />
      <DeploymentFooter />
    </div>
  );
}

export default App;
