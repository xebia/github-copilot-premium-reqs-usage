import { useState, useCallback, useRef, DragEvent } from "react";
import { Upload } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AggregatedData, CopilotUsageData, aggregateDataByDay, parseCSV } from "@/lib/utils";

function App() {
  const [data, setData] = useState<CopilotUsageData[] | null>(null);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[]>([]);
  const [uniqueModels, setUniqueModels] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const processFile = useCallback((file: File) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        if (!csvContent) throw new Error("Failed to read file");
        
        const parsedData = parseCSV(csvContent);
        setData(parsedData);
        
        // Get unique models
        const models = Array.from(new Set(parsedData.map(item => item.model)));
        setUniqueModels(models);
        
        // Aggregate data by day and model
        const aggregated = aggregateDataByDay(parsedData);
        setAggregatedData(aggregated);
        
        toast.success(`Loaded ${parsedData.length} records successfully`);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast.error("Failed to parse CSV file. Please check the format.");
        setData(null);
        setAggregatedData([]);
      }
    };
    
    reader.readAsText(file);
  }, []);
  
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset the input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  }, [processFile]);
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "text/csv" || file.name.endsWith('.csv')) {
        processFile(file);
      } else {
        toast.error("Please upload a CSV file.");
      }
    }
  }, [processFile]);
  
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

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          GitHub Copilot Usage Analyzer
        </h1>
        <p className="text-muted-foreground">
          Upload your Copilot usage CSV export to visualize request patterns
        </p>
      </header>
      
      <Card className="mb-8">
        <div 
          className={`p-6 text-center ${isDragging ? 'bg-secondary/50' : ''} transition-colors duration-200`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mb-4">
            <Upload size={48} weight="thin" className="mx-auto text-muted-foreground" />
          </div>
          
          <h2 className="text-xl font-medium mb-2">Upload CSV File</h2>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            {isDragging 
              ? "Drop your file here..." 
              : "Upload your GitHub Copilot premium requests usage CSV export to visualize the data. Drag and drop or select a file."}
          </p>
          
          <Button onClick={handleButtonClick} className="cursor-pointer">
            Select CSV File
          </Button>
          <input
            ref={fileInputRef}
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </Card>
      
      {data && data.length > 0 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Usage Statistics</h2>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Requests</h3>
                  <p className="text-2xl font-bold">
                    {data.reduce((sum, item) => sum + item.requestsUsed, 0).toLocaleString()}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Unique Users</h3>
                  <p className="text-2xl font-bold">
                    {new Set(data.map(item => item.user)).size.toLocaleString()}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Models Used</h3>
                  <p className="text-2xl font-bold">
                    {uniqueModels.length}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {uniqueModels.join(", ")}
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-2">Daily Usage Overview</h2>
            <Separator className="mb-6" />
            <div className="bg-card p-4 rounded-lg border">
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
                                <div className="text-right">{compliant}</div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                                  <span>Exceeding:</span>
                                </div>
                                <div className="text-right">{exceeding}</div>
                                <div className="font-medium">Total:</div>
                                <div className="text-right font-medium">{total}</div>
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
                    stackId="1"
                  />
                  <Line
                    key="exceeding"
                    type="monotone"
                    dataKey="exceeding"
                    name="Exceeding Requests"
                    stroke="#ef4444" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    stackId="1"
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;