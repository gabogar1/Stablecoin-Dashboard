import type { Pool } from 'pg';
import type { ChartDataPoint, WeeklyMarketData } from '@/types/database';
import { getDb } from '@/lib/db';

type DbClient = Pool;

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const numeric = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

async function getLatestTimestamp(db: DbClient): Promise<Date> {
  const { rows } = await db.query<{ timestamp_utc: string }>(
    'SELECT MAX(timestamp_utc) as timestamp_utc FROM stablecoin_market_caps;'
  );

  const latest = rows[0]?.timestamp_utc;
  if (!latest) {
    throw new Error('No timestamp found in stablecoin_market_caps');
  }

  return new Date(latest);
}

export async function getTotalMarketCap(db: DbClient = getDb()): Promise<number> {
  const { rows } = await db.query<{ total_current_market_cap: string | number }>(`
    WITH temp AS (
      SELECT *,
        RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) AS rank
      FROM stablecoin_market_caps
      WHERE (SELECT date_trunc('day', MAX(timestamp_utc)) FROM stablecoin_market_caps) = timestamp_utc::date
    )
    SELECT SUM(market_cap_usd) AS total_current_market_cap
    FROM temp
    WHERE rank = 1;
  `);

  return toNumber(rows[0]?.total_current_market_cap);
}

export async function getTotalMarketCapChange(db: DbClient = getDb()): Promise<number> {
  const { rows } = await db.query<{ percentage_change: string | number }>(`
    WITH current_cap AS (
      WITH temp AS (
        SELECT *,
          RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) AS rank
        FROM stablecoin_market_caps
        WHERE (SELECT date_trunc('day', MAX(timestamp_utc)) FROM stablecoin_market_caps) = timestamp_utc::date
      )
      SELECT SUM(market_cap_usd) AS current_total
      FROM temp
      WHERE rank = 1
    ),
    previous_cap AS (
      WITH temp AS (
        SELECT *,
          RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) AS rank
        FROM stablecoin_market_caps
        WHERE (SELECT date_trunc('day', MAX(timestamp_utc)) FROM stablecoin_market_caps) - interval '1 month' = timestamp_utc::date
      )
      SELECT SUM(market_cap_usd) AS previous_total
      FROM temp
      WHERE rank = 1
    )
    SELECT
      ((current_total - previous_total) / NULLIF(previous_total, 0) * 100) AS percentage_change
    FROM current_cap, previous_cap;
  `);

  return toNumber(rows[0]?.percentage_change);
}

export async function getTotalVolume24h(db: DbClient = getDb()): Promise<number> {
  const { rows } = await db.query<{ total_current_volume: string | number }>(`
    WITH temp AS (
      SELECT *,
        RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) AS rank
      FROM stablecoin_market_caps
      WHERE (SELECT date_trunc('day', MAX(timestamp_utc)) FROM stablecoin_market_caps) = timestamp_utc::date
    )
    SELECT SUM(volume_24h_usd) AS total_current_volume
    FROM temp
    WHERE rank = 1;
  `);

  return toNumber(rows[0]?.total_current_volume);
}

export async function getTotalVolumeChange(db: DbClient = getDb()): Promise<number> {
  const { rows } = await db.query<{ percentage_change: string | number }>(`
    WITH current_cap AS (
      WITH temp AS (
        SELECT *,
          RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) AS rank
        FROM stablecoin_market_caps
        WHERE (SELECT date_trunc('day', MAX(timestamp_utc)) FROM stablecoin_market_caps) = timestamp_utc::date
      )
      SELECT SUM(volume_24h_usd) AS current_total
      FROM temp
      WHERE rank = 1
    ),
    previous_cap AS (
      WITH temp AS (
        SELECT *,
          RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) AS rank
        FROM stablecoin_market_caps
        WHERE (SELECT date_trunc('day', MAX(timestamp_utc)) FROM stablecoin_market_caps) - interval '1 month' = timestamp_utc::date
      )
      SELECT SUM(volume_24h_usd) AS previous_total
      FROM temp
      WHERE rank = 1
    )
    SELECT
      ((current_total - previous_total) / NULLIF(previous_total, 0) * 100) AS percentage_change
    FROM current_cap, previous_cap;
  `);

  return toNumber(rows[0]?.percentage_change);
}

export async function getMonthlyGrowthRate(db: DbClient = getDb()): Promise<number> {
  const { rows } = await db.query<{ month: string; total: string | number }>(`
    SELECT date_trunc('month', timestamp_utc) AS month, SUM(market_cap_usd) AS total
    FROM stablecoin_market_caps
    GROUP BY 1
    ORDER BY month DESC
    LIMIT 2;
  `);

  if (rows.length < 2) return 0;

  const current = toNumber(rows[0]?.total);
  const previous = toNumber(rows[1]?.total);

  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export async function getWeeklyChartData(db: DbClient = getDb()): Promise<ChartDataPoint[]> {
  const twelveMonthsAgo = await getLatestTimestamp(db);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { rows } = await db.query<{ timestamp_utc: string; market_cap_usd: number; coin_symbol: string }>(`
    SELECT timestamp_utc, market_cap_usd, coin_symbol
    FROM stablecoin_market_caps
    WHERE timestamp_utc >= $1
    ORDER BY timestamp_utc ASC;
  `, [twelveMonthsAgo.toISOString()]);

  if (rows.length === 0) return [];

  const weeklyData = new Map<string, { total: number; coins: Map<string, number> }>();

  rows.forEach(item => {
    const date = new Date(item.timestamp_utc);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1);
    const weekKey = weekStart.toISOString().slice(0, 10);

    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, { total: 0, coins: new Map() });
    }

    const weekEntry = weeklyData.get(weekKey)!;
    weekEntry.total += item.market_cap_usd;
    const symbol = item.coin_symbol.toLowerCase();
    const current = weekEntry.coins.get(symbol) || 0;
    weekEntry.coins.set(symbol, current + item.market_cap_usd);
  });

  return Array.from(weeklyData.entries())
    .map(([week, data]) => ({
      week,
      total_market_cap: data.total / 1e9,
      usdt: (data.coins.get('usdt') || 0) / 1e9,
      usdc: (data.coins.get('usdc') || 0) / 1e9,
      busd: (data.coins.get('busd') || 0) / 1e9,
      dai: (data.coins.get('dai') || 0) / 1e9,
      frax: (data.coins.get('frax') || 0) / 1e9,
      tusd: (data.coins.get('tusd') || 0) / 1e9,
      formatted_date: new Date(week).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export async function getPreviousPeriodData(db: DbClient = getDb()): Promise<{
  previousMarketCap: number;
  previousVolume: number;
}> {
  const { rows } = await db.query<{ timestamp_utc: string }>(`
    SELECT timestamp_utc
    FROM stablecoin_market_caps
    ORDER BY timestamp_utc DESC
    LIMIT 2;
  `);

  if (rows.length < 2) {
    return { previousMarketCap: 0, previousVolume: 0 };
  }

  const previousTimestamp = rows[1].timestamp_utc;

  const marketCapResult = await db.query<{ market_cap_usd: number }>(
    'SELECT market_cap_usd FROM stablecoin_market_caps WHERE timestamp_utc = $1;',
    [previousTimestamp]
  );
  const volumeResult = await db.query<{ volume_24h_usd: number }>(
    'SELECT volume_24h_usd FROM stablecoin_market_caps WHERE timestamp_utc = $1;',
    [previousTimestamp]
  );

  const previousMarketCap = marketCapResult.rows.reduce((sum, item) => sum + (item.market_cap_usd || 0), 0);
  const previousVolume = volumeResult.rows.reduce((sum, item) => sum + (item.volume_24h_usd || 0), 0);

  return { previousMarketCap, previousVolume };
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export async function getMarketPerCoinPerWeek(db: DbClient = getDb()): Promise<WeeklyMarketData[]> {
  const { rows } = await db.query<WeeklyMarketData & { week: Date | string }>(`
    WITH temp AS (
      SELECT *
      FROM stablecoin_market_caps
      WHERE timestamp_utc < (SELECT date_trunc('day', MAX(timestamp_utc)) FROM stablecoin_market_caps)
      ORDER BY timestamp_utc DESC
    )
    SELECT
      coin_name,
      coin_id,
      date_trunc('week', timestamp_utc) AS week,
      SUM(market_cap_usd) AS market_cap
    FROM temp
    WHERE timestamp_utc = (
      SELECT MAX(timestamp_utc)
      FROM temp m2
      WHERE m2.coin_id = temp.coin_id
        AND date_trunc('week', m2.timestamp_utc) = date_trunc('week', temp.timestamp_utc)
    )
    GROUP BY 1,2,3
    ORDER BY 3 DESC;
  `);

  return rows.map(row => ({
    ...row,
    week: typeof row.week === 'string'
      ? row.week
      : new Date(row.week).toISOString().slice(0, 10),
  }));
}

async function getRankedTotalForDate(db: DbClient, date: Date): Promise<number> {
  const dateOnly = date.toISOString().slice(0, 10);
  const { rows } = await db.query<{ total: string | number }>(`
    WITH ranked AS (
      SELECT
        market_cap_usd AS value,
        RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) AS rk
      FROM stablecoin_market_caps
      WHERE timestamp_utc::date = $1::date
    )
    SELECT SUM(value) AS total FROM ranked WHERE rk = 1;
  `, [dateOnly]);

  return toNumber(rows[0]?.total);
}

export async function getMarketCapChangeFromLastYear(db: DbClient = getDb()): Promise<number> {
  const latest = await getLatestTimestamp(db);
  const latestDay = new Date(Date.UTC(latest.getFullYear(), latest.getMonth(), latest.getDate()));
  const previousDay = new Date(latestDay);
  previousDay.setDate(previousDay.getDate() - 51 * 7);

  const [currentTotal, previousTotal] = await Promise.all([
    getRankedTotalForDate(db, latestDay),
    getRankedTotalForDate(db, previousDay),
  ]);

  if (previousTotal === 0) return 0;
  return ((currentTotal - previousTotal) / previousTotal) * 100;
}