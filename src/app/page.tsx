import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  DollarSign,
  LineChart,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { StablecoinChart } from "@/app/components/stablecoin-chart";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Stablecoin Market Dashboard
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Market Cap
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$138.2B</div>
              <p className="text-xs text-muted-foreground">
                <span className="flex items-center text-green-500">
                  <ArrowUp className="mr-1 h-4 w-4" />
                  2.5%
                </span>{" "}
                from last month
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
              <div className="text-2xl font-bold">$42.8B</div>
              <p className="text-xs text-muted-foreground">
                <span className="flex items-center text-red-500">
                  <ArrowDown className="mr-1 h-4 w-4" />
                  4.2%
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Growth Rate (MoM)
              </CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+18.3%</div>
              <p className="text-xs text-muted-foreground">
                <span className="flex items-center text-green-500">
                  <ArrowUp className="mr-1 h-4 w-4" />
                  5.1%
                </span>{" "}
                from previous month
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 grid-cols-1">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Stablecoin Market Cap Development</CardTitle>
              <CardDescription>
                Historical market capitalization of major stablecoins over the
                past 12 months
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <StablecoinChart className="h-[350px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
