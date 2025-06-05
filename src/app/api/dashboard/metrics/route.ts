import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();

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
      getTotalMarketCap(supabase),
      getTotalVolume24h(supabase),
      getMonthlyGrowthRate(supabase),
      getTotalMarketCapChange(supabase),
      getTotalVolumeChange(supabase),
      getMarketCapChangeFromLastYear(supabase),
      // Fetch the most recent updated_at date
      supabase
        .from('stablecoin_market_caps')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single(),
    ]);

    // Handle potential error from lastUpdatedResult
    if (lastUpdatedResult.error) {
      throw new Error(`Failed to fetch last updated date: ${lastUpdatedResult.error.message}`);
    }

    // Format the date as "Jun 3, 2025"
    const lastUpdatedDate = new Date(lastUpdatedResult.data.updated_at);
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