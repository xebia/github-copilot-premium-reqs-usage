import React, { useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  PremiumCostGroupBy,
  CopilotUsageData,
  getPremiumCostData,
  getPremiumCostDataStatus,
} from "@/lib/utils";

type PremiumCostChartProps = {
  data: CopilotUsageData[];
};

export const PremiumCostChart = React.memo(function PremiumCostChart({ data }: PremiumCostChartProps) {
  const [groupBy, setGroupBy] = useState<PremiumCostGroupBy>("day");

  const status = useMemo(() => getPremiumCostDataStatus(data), [data]);
  const chartData = useMemo(() => getPremiumCostData(data, groupBy), [data, groupBy]);

  if (!status.hasAnyCostData) {
    return (
      <div className="bg-card p-8 rounded-lg border text-center">
        <p className="text-muted-foreground text-sm">
          The uploaded data does not contain cost fields (
          <code className="text-xs bg-muted px-1 py-0.5 rounded">gross_amount</code>,{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">net_amount</code>, or{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">discount_amount</code>).
        </p>
      </div>
    );
  }

  const GROUP_LABELS: Record<PremiumCostGroupBy, string> = {
    day: "Day",
    week: "Week",
    month: "Month",
  };

  return (
    <div className="bg-card p-4 rounded-lg border mb-8">
      <div className="flex gap-2 mb-4">
        {(["day", "week", "month"] as PremiumCostGroupBy[]).map((g) => (
          <Button
            key={g}
            variant={groupBy === g ? "default" : "outline"}
            size="sm"
            onClick={() => setGroupBy(g)}
          >
            {GROUP_LABELS[g]}
          </Button>
        ))}
      </div>

      <div className="flex items-stretch">
        <div className="flex items-center justify-center w-5 flex-shrink-0">
          <span
            className="text-xs text-foreground whitespace-nowrap"
            style={{ transform: "rotate(-90deg)", display: "block" }}
          >
            Amount (USD)
          </span>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
              tickLine={{ stroke: "var(--border)" }}
            />

            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fill: "var(--foreground)" }}
              tickLine={{ stroke: "var(--border)" }}
              tickFormatter={(v) =>
                `$${v.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              }
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="border rounded-lg bg-background shadow-lg p-3 text-xs">
                    <div className="font-medium mb-2">{label}</div>
                    <div className="space-y-1.5">
                      {payload.map((entry) => {
                        const val = Number(entry.value);
                        const formatted = `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        return (
                          <div key={String(entry.dataKey)} className="flex justify-between items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color as string }}
                              />
                              <span>{entry.name}:</span>
                            </div>
                            <div className="font-medium">{formatted}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />
            <Legend />

            {status.hasGrossAmount && (
              <Bar
                yAxisId="left"
                dataKey="grossAmount"
                name="Gross Amount"
                fill="#3b82f6"
                opacity={0.7}
                radius={[3, 3, 0, 0]}
              />
            )}
            {status.hasDiscountAmount && (
              <Bar
                yAxisId="left"
                dataKey="discountAmount"
                name="Included"
                fill="#f97316"
                opacity={0.7}
                radius={[3, 3, 0, 0]}
              />
            )}
            {status.hasNetAmount && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="netAmount"
                name="Net Amount"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
