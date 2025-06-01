"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { ChartContainer } from "@/app/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type { ChartDataPoint, ApiResponse } from "@/types/database";

interface StablecoinChartConnectedProps {
  className?: string;
}

interface TooltipPayload {
  value: number;
  dataKey: string;
  color: string;
  name: string;
}

// Define actual color values for the 6 specific coins using CSS variables
const COLORS = {
  usdt: "var(--chart-1)", // Green - Tether
  usdc: "var(--chart-2)", // Blue - USD Coin
  dai: "var(--chart-3)", // Orange - Dai
  busd: "var(--chart-4)", // Yellow - Binance USD
  frax: "var(--chart-5)", // Purple - Frax
  tusd: "var(--chart-6)", // Red - TrueUSD
};

// Chart configuration for ShadCN chart system
const chartConfig = {
  usdt: {
    label: "Tether (USDT)",
    color: COLORS.usdt,
  },
  usdc: {
    label: "USD Coin (USDC)",
    color: COLORS.usdc,
  },
  dai: {
    label: "Dai (DAI)",
    color: COLORS.dai,
  },
  busd: {
    label: "Binance USD (BUSD)",
    color: COLORS.busd,
  },
  frax: {
    label: "Frax (FRAX)",
    color: COLORS.frax,
  },
  tusd: {
    label: "TrueUSD (TUSD)",
    color: COLORS.tusd,
  },
};

// Custom tooltip content component
const CustomTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  // Calculate total for the week
  const total = (payload as TooltipPayload[]).reduce(
    (sum, entry) => sum + (entry.value || 0),
    0
  );

  // Define the order of coins to display (by typical market cap size)
  const coinOrder = ["usdt", "usdc", "dai", "busd", "frax", "tusd"];

  // Create a map for quick lookup of payload data
  const payloadMap = new Map<string, TooltipPayload>();
  (payload as TooltipPayload[]).forEach((entry) => {
    payloadMap.set(entry.dataKey, entry);
  });

  return (
    <div className="bg-background border rounded-lg p-3 shadow-lg min-w-[280px]">
      <p className="font-medium mb-2 text-center">Week of {label}</p>
      <div className="mb-3 pb-2 border-b">
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="text-muted-foreground">Total Market Cap:</span>
          <span className="font-bold">${total.toFixed(2)}B</span>
        </div>
      </div>

      <div className="space-y-2">
        {coinOrder.map((coinKey) => {
          const entry = payloadMap.get(coinKey);
          const value = entry?.value || 0;
          const color = COLORS[coinKey as keyof typeof COLORS];
          const percentage = total > 0 ? (value / total) * 100 : 0;

          // Get the proper coin name from the config
          const coinNames = {
            usdt: "Tether (USDT)",
            usdc: "USD Coin (USDC)",
            dai: "Dai (DAI)",
            busd: "Binance USD (BUSD)",
            frax: "Frax (FRAX)",
            tusd: "TrueUSD (TUSD)",
          };

          return (
            <div
              key={coinKey}
              className={`flex items-center justify-between text-sm ${
                value > 0 ? "opacity-100" : "opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">
                  {coinNames[coinKey as keyof typeof coinNames]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-medium ${
                    value > 0 ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  ${value.toFixed(2)}B
                </span>
                <span className="text-muted-foreground text-xs">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function StablecoinChartConnected({
  className,
}: StablecoinChartConnectedProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("12w"); // Default to 12 weeks

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

  // Filter data based on time range (working with weekly data)
  const filteredData = chartData.filter((item) => {
    if (!item.week) return false;

    const weekDate = new Date(item.week);
    const now = new Date();
    let weeksToSubtract = 12; // Default 12 weeks

    switch (timeRange) {
      case "4w":
        weeksToSubtract = 4;
        break;
      case "8w":
        weeksToSubtract = 8;
        break;
      case "12w":
        weeksToSubtract = 12;
        break;
      case "26w":
        weeksToSubtract = 26;
        break;
      default:
        weeksToSubtract = 12;
    }

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - weeksToSubtract * 7);
    return weekDate >= startDate;
  });

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">
              Loading chart data...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[400px]">
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
        </CardContent>
      </Card>
    );
  }

  if (filteredData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              No data available for selected time range
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Stablecoin Market Cap</CardTitle>
          <CardDescription>
            Showing weekly market capitalization for major stablecoins
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="4w" className="rounded-lg">
              Last 4 weeks
            </SelectItem>
            <SelectItem value="8w" className="rounded-lg">
              Last 8 weeks
            </SelectItem>
            <SelectItem value="12w" className="rounded-lg">
              Last 12 weeks
            </SelectItem>
            <SelectItem value="26w" className="rounded-lg">
              Last 6 months
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{
                top: 20,
                right: 30,
                left: 0,
                bottom: 60,
              }}
            >
              <defs>
                {/* Gradient definitions for each coin */}
                <linearGradient id="fillUsdt" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillUsdc" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-2)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-2)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillDai" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-3)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-3)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillBusd" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-4)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-4)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillFrax" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-5)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-5)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillTusd" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-6)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-6)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="formatted_date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                fontSize={12}
                tickFormatter={(value) => {
                  // Since formatted_date is already formatted, just return it
                  return value;
                }}
              />
              <YAxis
                tickFormatter={(value: number) => `$${value.toFixed(0)}B`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <Tooltip
                content={<CustomTooltipContent />}
                cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 1 }}
                animationDuration={200}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                content={({ payload }) => (
                  <div className="flex justify-center gap-4 mt-4 flex-wrap">
                    {payload?.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {/* Stacked areas for each coin - ordered by typical market cap size */}
              <Area
                type="natural"
                dataKey="usdt"
                stackId="1"
                stroke="var(--chart-1)"
                fill="url(#fillUsdt)"
                name="Tether (USDT)"
              />
              <Area
                type="natural"
                dataKey="usdc"
                stackId="1"
                stroke="var(--chart-2)"
                fill="url(#fillUsdc)"
                name="USD Coin (USDC)"
              />
              <Area
                type="natural"
                dataKey="dai"
                stackId="1"
                stroke="var(--chart-3)"
                fill="url(#fillDai)"
                name="Dai (DAI)"
              />
              <Area
                type="natural"
                dataKey="busd"
                stackId="1"
                stroke="var(--chart-4)"
                fill="url(#fillBusd)"
                name="Binance USD (BUSD)"
              />
              <Area
                type="natural"
                dataKey="frax"
                stackId="1"
                stroke="var(--chart-5)"
                fill="url(#fillFrax)"
                name="Frax (FRAX)"
              />
              <Area
                type="natural"
                dataKey="tusd"
                stackId="1"
                stroke="var(--chart-6)"
                fill="url(#fillTusd)"
                name="TrueUSD (TUSD)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
