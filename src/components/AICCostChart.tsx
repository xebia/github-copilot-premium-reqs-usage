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
  AICGroupBy,
  CopilotUsageData,
  getAICData,
  getAICDataStatus,
} from "@/lib/utils";

type AICCostChartProps = {
  data: CopilotUsageData[];
};

export const AICCostChart = React.memo(function AICCostChart({ data }: AICCostChartProps) {
  const [groupBy, setGroupBy] = useState<AICGroupBy>("day");

  const status = useMemo(() => getAICDataStatus(data), [data]);
  const chartData = useMemo(() => getAICData(data, groupBy), [data, groupBy]);

  const hasAny = status.hasQuantityField || status.hasAmountField;

  if (!hasAny) {
    return (
      <div className="bg-card p-8 rounded-lg border text-center">
        <p className="text-muted-foreground text-sm">
          The uploaded data does not contain AI Credits fields (
          <code className="text-xs bg-muted px-1 py-0.5 rounded">aic_quantity</code> or{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">aic_gross_amount</code>).
          These fields are available in newer GitHub Copilot usage exports.
        </p>
      </div>
    );
  }

  if (!status.hasQuantityData && !status.hasAmountData) {
    return (
      <div className="bg-card p-8 rounded-lg border text-center">
        <p className="text-muted-foreground text-sm">
          The AIC fields are present in the data but contain no non-zero values for the selected
          period.
        </p>
      </div>
    );
  }

  const GROUP_LABELS: Record<AICGroupBy, string> = {
    day: "Day",
    week: "Week",
    month: "Month",
  };

  return (
    <div className="bg-card p-4 rounded-lg border mb-8">
      {/* Zoom controls */}
      <div className="flex gap-2 mb-4">
        {(["day", "week", "month"] as AICGroupBy[]).map((g) => (
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

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 60, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
            tickLine={{ stroke: "var(--border)" }}
          />

          {/* Left axis: AI credits quantity */}
          {status.hasQuantityField && (
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fill: "var(--foreground)" }}
              tickLine={{ stroke: "var(--border)" }}
              tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              label={{
                value: "AI Credits",
                angle: -90,
                position: "insideLeft",
                style: { fill: "var(--foreground)", fontSize: 12 },
                offset: 8,
              }}
            />
          )}

          {/* Right axis: estimated cost (USD) */}
          {status.hasAmountField && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "var(--foreground)" }}
              tickLine={{ stroke: "var(--border)" }}
              tickFormatter={(v) =>
                `$${v.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              }
              label={{
                value: "Est. Cost (USD)",
                angle: 90,
                position: "insideRight",
                style: { fill: "var(--foreground)", fontSize: 12 },
                offset: 16,
              }}
            />
          )}

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="border rounded-lg bg-background shadow-lg p-3 text-xs">
                  <div className="font-medium mb-2">{label}</div>
                  <div className="space-y-1.5">
                    {payload.map((entry) => {
                      const isAmount = entry.dataKey === "aicGrossAmount";
                      const val = Number(entry.value);
                      const formatted = isAmount
                        ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                        : val.toLocaleString(undefined, { maximumFractionDigits: 8, minimumFractionDigits: 0 });
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

          {/* Bar for estimated cost (rendered first so the line sits on top) */}
          {status.hasAmountField && (
            <Bar
              yAxisId="right"
              dataKey="aicGrossAmount"
              name="Est. Cost (USD)"
              fill="#f97316"
              opacity={0.8}
              radius={[3, 3, 0, 0]}
            />
          )}

          {/* Line for AI credits quantity */}
          {status.hasQuantityField && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="aicQuantity"
              name="AI Credits"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
