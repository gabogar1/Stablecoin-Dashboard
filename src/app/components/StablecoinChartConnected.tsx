"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/components/ui/chart";
import type { ChartDataPoint, ApiResponse } from "@/types/database";

interface StablecoinChartConnectedProps {
  className?: string;
}

interface TooltipPayload {
  value: number;
  dataKey: string;
  color: string;
}

export function StablecoinChartConnected({
  className,
}: StablecoinChartConnectedProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChartData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard/chart-data");
        const result: ApiResponse<ChartDataPoint[]> = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch chart data");
        }

        if (result.data) {
          setChartData(result.data);
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load chart data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchChartData();
  }, []);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${
          className || "h-[350px]"
        }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center ${
          className || "h-[350px]"
        }`}
      >
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">
            Data temporarily unavailable
          </p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${
          className || "h-[350px]"
        }`}
      >
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      config={{
        total_market_cap: {
          label: "Total Market Cap",
          color: "hsl(var(--chart-1))",
        },
        usdt: {
          label: "USDT",
          color: "hsl(var(--chart-2))",
        },
        usdc: {
          label: "USDC",
          color: "hsl(var(--chart-3))",
        },
        busd: {
          label: "BUSD",
          color: "hsl(var(--chart-4))",
        },
        dai: {
          label: "DAI",
          color: "hsl(var(--chart-5))",
        },
      }}
      className={className || "h-[350px]"}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="formatted_date"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            tickFormatter={(value: number) => `$${value.toFixed(1)}B`}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <ChartTooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium mb-2">{label}</p>
                    {(payload as TooltipPayload[]).map(
                      (entry: TooltipPayload, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-muted-foreground">
                            {entry.dataKey}:
                          </span>
                          <span className="font-medium">
                            $
                            {entry.value
                              ? Number(entry.value).toFixed(2)
                              : "0.00"}
                            B
                          </span>
                        </div>
                      )
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="total_market_cap"
            stackId="1"
            stroke="var(--color-total_market_cap)"
            fill="var(--color-total_market_cap)"
            fillOpacity={0.2}
          />
          <Area
            type="monotone"
            dataKey="usdt"
            stackId="2"
            stroke="var(--color-usdt)"
            fill="var(--color-usdt)"
            fillOpacity={0.5}
          />
          <Area
            type="monotone"
            dataKey="usdc"
            stackId="2"
            stroke="var(--color-usdc)"
            fill="var(--color-usdc)"
            fillOpacity={0.5}
          />
          <Area
            type="monotone"
            dataKey="busd"
            stackId="2"
            stroke="var(--color-busd)"
            fill="var(--color-busd)"
            fillOpacity={0.5}
          />
          <Area
            type="monotone"
            dataKey="dai"
            stackId="2"
            stroke="var(--color-dai)"
            fill="var(--color-dai)"
            fillOpacity={0.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
