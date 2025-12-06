import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getMarketPerCoinPerWeek } from '@/utils/queries';
import type { ChartDataPoint, ApiResponse } from '@/types/database';

/**
 * GET /api/dashboard/chart-data
 * Fetches weekly chart data for stacked area chart visualization
 */
export async function GET(): Promise<NextResponse<ApiResponse<ChartDataPoint[]>>> {
  try {
    const db = getDb();

    // Get weekly market data per coin
    const weeklyMarketData = await getMarketPerCoinPerWeek(db);

    if (!weeklyMarketData || weeklyMarketData.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'No chart data available',
      });
    }

    // Transform data into stacked area chart format
    // Group by week and create coin-specific values
    const weeklyMap = new Map<string, ChartDataPoint>();

    weeklyMarketData.forEach(item => {
      const weekKey = item.week;
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          week: weekKey,
          total_market_cap: 0,
          usdt: 0,
          usdc: 0,
          dai: 0,
          busd: 0,
          frax: 0,
          tusd: 0,
          formatted_date: new Date(weekKey).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }

      const chartPoint = weeklyMap.get(weekKey)!;
      const marketCapInBillions = item.market_cap / 1e9; // Convert to billions

      // Map coin_id to chart properties using exact coin IDs
      const coinId = item.coin_id.toLowerCase();
      
      switch (coinId) {
        case 'tether':
          chartPoint.usdt += marketCapInBillions;
          break;
        case 'usd-coin':
          chartPoint.usdc += marketCapInBillions;
          break;
        case 'dai':
          chartPoint.dai += marketCapInBillions;
          break;
        case 'binance-usd':
          chartPoint.busd += marketCapInBillions;
          break;
        case 'frax':
          chartPoint.frax += marketCapInBillions;
          break;
        case 'true-usd':
          chartPoint.tusd += marketCapInBillions;
          break;
        default:
          // Skip coins that are not in our target list
          console.log(`Unknown coin_id: ${coinId} (${item.coin_name})`);
          break;
      }

      // Update total market cap only for tracked coins
      if (['tether', 'usd-coin', 'dai', 'binance-usd', 'frax', 'true-usd'].includes(coinId)) {
        chartPoint.total_market_cap += marketCapInBillions;
      }
    });

    // Convert to array and sort by week
    const chartData: ChartDataPoint[] = Array.from(weeklyMap.values())
      .sort((a, b) => a.week.localeCompare(b.week));

    return NextResponse.json({
      data: chartData,
      message: 'Chart data fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch chart data',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
} 