"use client";

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

const data = [
  { month: "Jan", usdt: 78.2, usdc: 42.1, busd: 15.3, dai: 5.2, total: 140.8 },
  { month: "Feb", usdt: 79.5, usdc: 43.2, busd: 14.8, dai: 5.3, total: 142.8 },
  { month: "Mar", usdt: 81.3, usdc: 44.5, busd: 14.2, dai: 5.4, total: 145.4 },
  { month: "Apr", usdt: 82.7, usdc: 45.1, busd: 13.5, dai: 5.5, total: 146.8 },
  { month: "May", usdt: 83.9, usdc: 44.8, busd: 12.9, dai: 5.6, total: 147.2 },
  { month: "Jun", usdt: 85.2, usdc: 43.5, busd: 12.3, dai: 5.7, total: 146.7 },
  { month: "Jul", usdt: 84.8, usdc: 42.9, busd: 11.8, dai: 5.8, total: 145.3 },
  { month: "Aug", usdt: 83.5, usdc: 41.7, busd: 11.2, dai: 5.9, total: 142.3 },
  { month: "Sep", usdt: 82.1, usdc: 40.5, busd: 10.7, dai: 6.0, total: 139.3 },
  { month: "Oct", usdt: 81.4, usdc: 39.8, busd: 10.1, dai: 6.1, total: 137.4 },
  { month: "Nov", usdt: 82.8, usdc: 40.2, busd: 9.6, dai: 6.2, total: 138.8 },
  { month: "Dec", usdt: 83.5, usdc: 41.5, busd: 9.0, dai: 6.3, total: 140.3 },
];

export function StablecoinChart({ className }: { className?: string }) {
  return (
    <ChartContainer
      config={{
        total: {
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
      className={className || "h-[500px]"}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(value: number) => `$${value}B`}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <ChartTooltip content={ChartTooltipContent} />
          <Area
            type="monotone"
            dataKey="total"
            stackId="1"
            stroke="var(--color-total)"
            fill="var(--color-total)"
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
