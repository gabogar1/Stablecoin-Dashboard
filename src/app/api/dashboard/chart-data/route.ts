import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWeeklyChartData } from '@/utils/queries';
import type { ChartDataPoint, ApiResponse } from '@/types/database';

/**
 * GET /api/dashboard/chart-data
 * Fetches weekly market cap data for the past 12 months for chart visualization
 */
export async function GET(): Promise<NextResponse<ApiResponse<ChartDataPoint[]>>> {
  try {
    const supabase = await createClient();
    const chartData = await getWeeklyChartData(supabase);

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