import { createClient } from '@/lib/supabase/server';
import type { Database, DashboardMetrics, ChartDataPoint } from '@/types/database';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Fetches the total market capitalization for the current day
 * Uses the first record per coin for today's date (ranked by timestamp)
 */
export async function getTotalMarketCap(supabase: SupabaseClient): Promise<number> {
  // Use raw SQL query with CTE and window function
  const { data, error } = await supabase.rpc('get_current_market_cap');

  if (error) {
    console.warn('RPC function not available, falling back to manual calculation:', error.message);
    
    // Fallback to manual implementation using Supabase query builder
    // This mimics the SQL: 
    // WITH temp as (select *, RANK() OVER (partition by coin_id ORDER BY timestamp_utc) as rank
    // from stablecoin_market_caps where date_trunc('day',now()) = timestamp_utc::date)
    // select sum(market_cap_usd) as total_current_market_cap from temp where rank = 1
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const { data: todayRecords, error: fallbackError } = await supabase
      .from('stablecoin_market_caps')
      .select('coin_id, market_cap_usd, timestamp_utc')
      .gte('timestamp_utc', todayStart.toISOString())
      .lt('timestamp_utc', todayEnd.toISOString())
      .order('coin_id')
      .order('timestamp_utc');

    if (fallbackError) {
      throw new Error(`Failed to fetch current market cap: ${fallbackError.message}`);
    }

    if (!todayRecords || todayRecords.length === 0) {
      // If no data for today, fall back to the most recent data
      const { data: latestTimestamp, error: timestampError } = await supabase
        .from('stablecoin_market_caps')
        .select('timestamp_utc')
        .order('timestamp_utc', { ascending: false })
        .limit(1)
        .single();

      if (timestampError || !latestTimestamp) {
        throw new Error(`Failed to fetch latest timestamp: ${timestampError?.message}`);
      }

      const { data: latestData, error: latestError } = await supabase
        .from('stablecoin_market_caps')
        .select('market_cap_usd')
        .eq('timestamp_utc', latestTimestamp.timestamp_utc);

      if (latestError) {
        throw new Error(`Failed to fetch latest market cap: ${latestError.message}`);
      }

      return latestData?.reduce((sum, item) => sum + (item.market_cap_usd || 0), 0) || 0;
    }

    // Group by coin_id and get the first record (earliest timestamp) for each coin
    const coinMarketCaps = new Map<string, number>();
    
    todayRecords.forEach(record => {
      if (!coinMarketCaps.has(record.coin_id)) {
        // Only add the first occurrence (earliest timestamp) for each coin
        coinMarketCaps.set(record.coin_id, record.market_cap_usd);
      }
    });

    // Sum all the market caps
    return Array.from(coinMarketCaps.values()).reduce((sum, marketCap) => sum + marketCap, 0);
  }

  return data || 0;
}

/**
 * Calculates the market cap percentage change from last month
 * Uses the first record per coin for today vs same day last month
 */
export async function getTotalMarketCapChange(supabase: SupabaseClient): Promise<number> {
  // Use raw SQL query with CTEs for market cap percentage change
  const { data, error } = await supabase.rpc('get_market_cap_perc_change');

  if (error) {
    console.warn('RPC function not available, falling back to manual calculation:', error.message);
    
    // Fallback to manual implementation
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    // Calculate same day last month
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate());
    const lastMonthEnd = new Date(lastMonthStart.getTime() + 24 * 60 * 60 * 1000);

    // Get current period data
    const { data: currentRecords, error: currentError } = await supabase
      .from('stablecoin_market_caps')
      .select('coin_id, market_cap_usd, timestamp_utc')
      .gte('timestamp_utc', todayStart.toISOString())
      .lt('timestamp_utc', todayEnd.toISOString())
      .order('coin_id')
      .order('timestamp_utc');

    // Get previous period data
    const { data: previousRecords, error: previousError } = await supabase
      .from('stablecoin_market_caps')
      .select('coin_id, market_cap_usd, timestamp_utc')
      .gte('timestamp_utc', lastMonthStart.toISOString())
      .lt('timestamp_utc', lastMonthEnd.toISOString())
      .order('coin_id')
      .order('timestamp_utc');

    if (currentError || previousError) {
      throw new Error(`Failed to fetch market cap change data: ${currentError?.message || previousError?.message}`);
    }

    // Calculate current total (first record per coin)
    const currentCoinMarketCaps = new Map<string, number>();
    currentRecords?.forEach(record => {
      if (!currentCoinMarketCaps.has(record.coin_id)) {
        currentCoinMarketCaps.set(record.coin_id, record.market_cap_usd);
      }
    });
    const currentTotal = Array.from(currentCoinMarketCaps.values()).reduce((sum, cap) => sum + cap, 0);

    // Calculate previous total (first record per coin)
    const previousCoinMarketCaps = new Map<string, number>();
    previousRecords?.forEach(record => {
      if (!previousCoinMarketCaps.has(record.coin_id)) {
        previousCoinMarketCaps.set(record.coin_id, record.market_cap_usd);
      }
    });
    const previousTotal = Array.from(previousCoinMarketCaps.values()).reduce((sum, cap) => sum + cap, 0);

    // Calculate percentage change
    if (previousTotal === 0) {
      return 0;
    }

    return ((currentTotal - previousTotal) / previousTotal) * 100;
  }

  return data || 0;
}

/**
 * Fetches the total 24h trading volume for the current day
 * Uses the first record per coin for today's date (ranked by timestamp)
 */
export async function getTotalVolume24h(supabase: SupabaseClient): Promise<number> {
  // Use raw SQL query with CTE and window function
  const { data, error } = await supabase.rpc('get_current_volume');

  if (error) {
    console.warn('RPC function not available, falling back to manual calculation:', error.message);
    
    // Fallback to manual implementation using Supabase query builder
    // This mimics the SQL: 
    // WITH temp as (select *, RANK() OVER (partition by coin_id ORDER BY timestamp_utc) as rank
    // from stablecoin_market_caps where date_trunc('day',now()) = timestamp_utc::date)
    // select sum(volume_24h_usd) as total_current_volume from temp where rank = 1
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const { data: todayRecords, error: fallbackError } = await supabase
      .from('stablecoin_market_caps')
      .select('coin_id, volume_24h_usd, timestamp_utc')
      .gte('timestamp_utc', todayStart.toISOString())
      .lt('timestamp_utc', todayEnd.toISOString())
      .order('coin_id')
      .order('timestamp_utc');

    if (fallbackError) {
      throw new Error(`Failed to fetch current volume: ${fallbackError.message}`);
    }

    if (!todayRecords || todayRecords.length === 0) {
      // If no data for today, fall back to the most recent data
      const { data: latestTimestamp, error: timestampError } = await supabase
        .from('stablecoin_market_caps')
        .select('timestamp_utc')
        .order('timestamp_utc', { ascending: false })
        .limit(1)
        .single();

      if (timestampError || !latestTimestamp) {
        throw new Error(`Failed to fetch latest timestamp: ${timestampError?.message}`);
      }

      const { data: latestData, error: latestError } = await supabase
        .from('stablecoin_market_caps')
        .select('volume_24h_usd')
        .eq('timestamp_utc', latestTimestamp.timestamp_utc);

      if (latestError) {
        throw new Error(`Failed to fetch latest volume: ${latestError.message}`);
      }

      return latestData?.reduce((sum, item) => sum + (item.volume_24h_usd || 0), 0) || 0;
    }

    // Group by coin_id and get the first record (earliest timestamp) for each coin
    const coinVolumes = new Map<string, number>();
    
    todayRecords.forEach(record => {
      if (!coinVolumes.has(record.coin_id)) {
        // Only add the first occurrence (earliest timestamp) for each coin
        coinVolumes.set(record.coin_id, record.volume_24h_usd);
      }
    });

    // Sum all the volumes
    return Array.from(coinVolumes.values()).reduce((sum, volume) => sum + volume, 0);
  }

  return data || 0;
}

/**
 * Calculates the volume percentage change from last month
 * Uses the first record per coin for today vs same day last month
 */
export async function getTotalVolumeChange(supabase: SupabaseClient): Promise<number> {
  // Use raw SQL query with CTEs for volume percentage change
  const { data, error } = await supabase.rpc('get_volume_perc_change');

  if (error) {
    console.warn('RPC function not available, falling back to manual calculation:', error.message);
    
    // Fallback to manual implementation
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    // Calculate same day last month
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate());
    const lastMonthEnd = new Date(lastMonthStart.getTime() + 24 * 60 * 60 * 1000);

    // Get current period data
    const { data: currentRecords, error: currentError } = await supabase
      .from('stablecoin_market_caps')
      .select('coin_id, volume_24h_usd, timestamp_utc')
      .gte('timestamp_utc', todayStart.toISOString())
      .lt('timestamp_utc', todayEnd.toISOString())
      .order('coin_id')
      .order('timestamp_utc');

    // Get previous period data
    const { data: previousRecords, error: previousError } = await supabase
      .from('stablecoin_market_caps')
      .select('coin_id, volume_24h_usd, timestamp_utc')
      .gte('timestamp_utc', lastMonthStart.toISOString())
      .lt('timestamp_utc', lastMonthEnd.toISOString())
      .order('coin_id')
      .order('timestamp_utc');

    if (currentError || previousError) {
      throw new Error(`Failed to fetch volume change data: ${currentError?.message || previousError?.message}`);
    }

    // Calculate current total (first record per coin)
    const currentCoinVolumes = new Map<string, number>();
    currentRecords?.forEach(record => {
      if (!currentCoinVolumes.has(record.coin_id)) {
        currentCoinVolumes.set(record.coin_id, record.volume_24h_usd);
      }
    });
    const currentTotal = Array.from(currentCoinVolumes.values()).reduce((sum, vol) => sum + vol, 0);

    // Calculate previous total (first record per coin)
    const previousCoinVolumes = new Map<string, number>();
    previousRecords?.forEach(record => {
      if (!previousCoinVolumes.has(record.coin_id)) {
        previousCoinVolumes.set(record.coin_id, record.volume_24h_usd);
      }
    });
    const previousTotal = Array.from(previousCoinVolumes.values()).reduce((sum, vol) => sum + vol, 0);

    // Calculate percentage change
    if (previousTotal === 0) {
      return 0;
    }

    return ((currentTotal - previousTotal) / previousTotal) * 100;
  }

  return data || 0;
}

/**
 * Calculates the month-over-month growth rate for total market capitalization
 */
export async function getMonthlyGrowthRate(supabase: SupabaseClient): Promise<number> {
  // Get monthly totals for the last 2 months using SQL
  const { data, error } = await supabase.rpc('get_monthly_growth_rate');

  if (error) {
    console.warn('RPC function not available, falling back to manual calculation:', error.message);
    
    // Fallback to manual calculation
    const { data: monthlyData, error: fallbackError } = await supabase
      .from('stablecoin_market_caps')
      .select('timestamp_utc, market_cap_usd')
      .gte('timestamp_utc', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()) // Last 60 days
      .order('timestamp_utc', { ascending: false });

    if (fallbackError) {
      throw new Error(`Failed to fetch monthly data: ${fallbackError.message}`);
    }

    if (!monthlyData || monthlyData.length === 0) {
      return 0;
    }

    // Group by month and calculate totals
    const monthlyTotals = new Map<string, number>();
    
    monthlyData.forEach(item => {
      const month = new Date(item.timestamp_utc).toISOString().slice(0, 7); // YYYY-MM format
      const current = monthlyTotals.get(month) || 0;
      monthlyTotals.set(month, current + item.market_cap_usd);
    });

    const months = Array.from(monthlyTotals.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    
    if (months.length < 2) {
      return 0;
    }

    const currentMonth = months[0][1];
    const previousMonth = months[1][1];

    if (previousMonth === 0) {
      return 0;
    }

    return ((currentMonth - previousMonth) / previousMonth) * 100;
  }

  return data || 0;
}

/**
 * Fetches weekly market cap data for the last 12 months for chart visualization
 */
export async function getWeeklyChartData(supabase: SupabaseClient): Promise<ChartDataPoint[]> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data, error } = await supabase
    .from('stablecoin_market_caps')
    .select('timestamp_utc, market_cap_usd, coin_symbol')
    .gte('timestamp_utc', twelveMonthsAgo.toISOString())
    .order('timestamp_utc', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch weekly chart data: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Group by week and coin symbol
  const weeklyData = new Map<string, { total: number; coins: Map<string, number> }>();

  data.forEach(item => {
    const date = new Date(item.timestamp_utc);
    // Calculate week start (Monday)
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1);
    const weekKey = weekStart.toISOString().slice(0, 10); // YYYY-MM-DD format

    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, { total: 0, coins: new Map() });
    }

    const weekData = weeklyData.get(weekKey)!;
    weekData.total += item.market_cap_usd;
    
    const currentCoinValue = weekData.coins.get(item.coin_symbol.toLowerCase()) || 0;
    weekData.coins.set(item.coin_symbol.toLowerCase(), currentCoinValue + item.market_cap_usd);
  });

  // Convert to chart format
  const chartData: ChartDataPoint[] = Array.from(weeklyData.entries())
    .map(([week, data]) => ({
      week,
      total_market_cap: data.total / 1e9, // Convert to billions
      usdt: (data.coins.get('usdt') || 0) / 1e9,
      usdc: (data.coins.get('usdc') || 0) / 1e9,
      busd: (data.coins.get('busd') || 0) / 1e9,
      dai: (data.coins.get('dai') || 0) / 1e9,
      formatted_date: new Date(week).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  return chartData;
}

/**
 * Fetches previous period data for calculating percentage changes
 */
export async function getPreviousPeriodData(supabase: SupabaseClient): Promise<{
  previousMarketCap: number;
  previousVolume: number;
}> {
  // Get the last two timestamps
  const { data: timestamps, error: timestampError } = await supabase
    .from('stablecoin_market_caps')
    .select('timestamp_utc')
    .order('timestamp_utc', { ascending: false })
    .limit(2);

  if (timestampError || !timestamps || timestamps.length < 2) {
    return { previousMarketCap: 0, previousVolume: 0 };
  }

  const previousTimestamp = timestamps[1].timestamp_utc;

  // Get market cap for previous period
  const { data: marketCapData, error: marketCapError } = await supabase
    .from('stablecoin_market_caps')
    .select('market_cap_usd')
    .eq('timestamp_utc', previousTimestamp);

  // Get volume for previous period  
  const { data: volumeData, error: volumeError } = await supabase
    .from('stablecoin_market_caps')
    .select('volume_24h_usd')
    .eq('timestamp_utc', previousTimestamp);

  if (marketCapError || volumeError) {
    return { previousMarketCap: 0, previousVolume: 0 };
  }

  const previousMarketCap = marketCapData?.reduce((sum, item) => sum + (item.market_cap_usd || 0), 0) || 0;
  const previousVolume = volumeData?.reduce((sum, item) => sum + (item.volume_24h_usd || 0), 0) || 0;

  return { previousMarketCap, previousVolume };
}

/**
 * Calculates percentage change between current and previous values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
} 