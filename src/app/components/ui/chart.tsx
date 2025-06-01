"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: Record<string, any>;
  }
>(({ className, config, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      style={
        {
          "--chart-1": "hsl(220 70% 50%)",
          "--chart-2": "hsl(160 60% 45%)",
          "--chart-3": "hsl(30 80% 55%)",
          "--chart-4": "hsl(280 65% 60%)",
          "--chart-5": "hsl(340 75% 55%)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
});
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = ({
  content: Content,
}: {
  content: React.ComponentType<any>;
}) => {
  return <Content />;
};

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-background p-2 shadow-md", className)}
      {...props}
    />
  );
});
ChartTooltipContent.displayName = "ChartTooltipContent";

export { ChartContainer, ChartTooltip, ChartTooltipContent };
