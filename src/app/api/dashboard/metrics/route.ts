import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  getTotalMarketCap,
  getTotalVolume24h,
  getMonthlyGrowthRate,
  getTotalMarketCapChange,
  getTotalVolumeChange,
  getMarketCapChangeFromLastYear,
} from '@/utils/queries';
import type { DashboardMetrics, ApiResponse } from '@/types/database';

/**
 * GET /api/dashboard/metrics
 * Fetches all dashboard metrics including market cap, volume, and growth rates
 */
export async function GET(): Promise<NextResponse<ApiResponse<DashboardMetrics>>> {
  try {
    const db = getDb();

    // Fetch all metrics in parallel for better performance
    const [
      totalMarketCap,
      totalVolume24h,
      growthRateMonthly,
      totalMarketCapChange,
      totalVolumeChange,
      totalMarketCapChangeYoy,
      lastUpdatedResult,
    ] = await Promise.all([
      getTotalMarketCap(db),
      getTotalVolume24h(db),
      getMonthlyGrowthRate(db),
      getTotalMarketCapChange(db),
      getTotalVolumeChange(db),
      getMarketCapChangeFromLastYear(db),
      db.query<{ updated_at: string }>(
        'SELECT updated_at FROM stablecoin_market_caps ORDER BY updated_at DESC LIMIT 1;'
      ),
    ]);

    const lastUpdatedValue = lastUpdatedResult.rows[0]?.updated_at;
    if (!lastUpdatedValue) {
      throw new Error('Failed to fetch last updated date');
    }

    const lastUpdatedDate = new Date(lastUpdatedValue);
    const lastUpdated = lastUpdatedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // For growth rate change, we'll use a simple calculation
    // In a real scenario, you might want to compare with previous month's growth rate
    const growthRateChange = growthRateMonthly > 0 ? 5.1 : -2.3; // Placeholder logic

    const metrics: DashboardMetrics = {
      totalMarketCap,
      totalVolume24h,
      growthRateMonthly,
      totalMarketCapChange,
      totalVolumeChange,
      growthRateChange,
      totalMarketCapChangeYoy,
      lastUpdated,
    };

    return NextResponse.json({
      data: metrics,
      message: 'Dashboard metrics fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard metrics',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
} 