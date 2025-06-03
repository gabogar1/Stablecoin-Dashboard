"use client";

import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  DollarSign,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { StablecoinChartConnected } from "@/app/components/StablecoinChartConnected";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

/**
 * Formats a number to display in billions with appropriate suffix
 */
function formatToBillions(value: number): string {
  return `$${(value / 1e9).toFixed(1)}B`;
}

/**
 * Formats a percentage change with appropriate sign and color
 */
function formatPercentageChange(value: number): {
  formatted: string;
  isPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
} {
  const isPositive = value >= 0;
  return {
    formatted: `${isPositive ? "+" : ""}${value.toFixed(1)}%`,
    isPositive,
    icon: isPositive ? ArrowUp : ArrowDown,
  };
}

/**
 * Loading skeleton component for metric cards
 */
function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2"></div>
        <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
      </CardContent>
    </Card>
  );
}

/**
 * Error state component for metric cards
 */
function MetricCardError({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="pt-6">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">
            Data temporarily unavailable
          </p>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { metrics, loading, error, refetch } = useDashboardMetrics();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div className="flex flex-col gap-2 ">
            <h2 className="text-3xl font-bold tracking-tight">
              Stablecoin Market Dashboard
            </h2>
            <div className="flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">
                Made by{" "}
                <a
                  href="https://www.linkedin.com/in/gabriel-garcia-suarez/"
                  className="text-primary hover:underline"
                  target="_blank"
                >
                  Gabriel García Suárez
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Last updated: 2025-06-03
              </p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={refetch}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {loading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : error ? (
            <>
              <MetricCardError onRefresh={refetch} />
              <MetricCardError onRefresh={refetch} />
              <MetricCardError onRefresh={refetch} />
            </>
          ) : metrics ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Market Cap
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatToBillions(metrics.totalMarketCap)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={`flex items-center ${
                        formatPercentageChange(metrics.totalMarketCapChange)
                          .isPositive
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {(() => {
                        const { formatted, icon: Icon } =
                          formatPercentageChange(metrics.totalMarketCapChange);
                        return (
                          <>
                            <Icon className="mr-1 h-4 w-4" />
                            {formatted}
                          </>
                        );
                      })()}
                    </span>{" "}
                    from same day last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Volume (24h)
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatToBillions(metrics.totalVolume24h)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={`flex items-center ${
                        formatPercentageChange(metrics.totalVolumeChange)
                          .isPositive
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {(() => {
                        const { formatted, icon: Icon } =
                          formatPercentageChange(metrics.totalVolumeChange);
                        return (
                          <>
                            <Icon className="mr-1 h-4 w-4" />
                            {formatted}
                          </>
                        );
                      })()}
                    </span>{" "}
                    from same day last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Market Cap (YoY)
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      formatPercentageChange(metrics.totalMarketCapChangeYoy)
                        .formatted
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={`flex items-center ${
                        formatPercentageChange(metrics.totalMarketCapChangeYoy)
                          .isPositive
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {(() => {
                        const { icon: Icon } = formatPercentageChange(
                          metrics.totalMarketCapChangeYoy
                        );
                        return (
                          <>
                            <Icon className="mr-1 h-4 w-4" />
                            {/* {formatted} */}
                          </>
                        );
                      })()}
                    </span>{" "}
                    from same day last year
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <div className="grid gap-4 grid-cols-1">
          <Card className="col-span-4">
            <StablecoinChartConnected className="h-[415px]" />
          </Card>
        </div>
      </div>
    </div>
  );
}
