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
    ] = await Promise.all([
      getTotalMarketCap(supabase),
      getTotalVolume24h(supabase),
      getMonthlyGrowthRate(supabase),
      getTotalMarketCapChange(supabase),
      getTotalVolumeChange(supabase),
      getMarketCapChangeFromLastYear(supabase),
    ]);

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