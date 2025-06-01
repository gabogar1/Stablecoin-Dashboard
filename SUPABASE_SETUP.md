# Supabase Integration Setup Guide

This guide will help you set up the Supabase integration for the Stablecoin Market Dashboard.

## Prerequisites

1. A Supabase account and project
2. The `stablecoin_market_caps` table created in your database
3. Node.js and npm/yarn installed

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Getting Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Database Schema

Ensure your Supabase database has the `stablecoin_market_caps` table with this structure:

```sql
CREATE TABLE stablecoin_market_caps (
    id BIGSERIAL PRIMARY KEY,
    coin_id VARCHAR NOT NULL,
    coin_name VARCHAR NOT NULL,
    coin_symbol VARCHAR NOT NULL,
    timestamp_utc TIMESTAMPTZ NOT NULL,
    market_cap_usd NUMERIC NOT NULL,
    price_usd NUMERIC NOT NULL,
    volume_24h_usd NUMERIC NOT NULL,
    data_granularity VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Recommended Indexes

For optimal performance, create these indexes:

```sql
-- Index for timestamp queries (most recent data)
CREATE INDEX idx_stablecoin_market_caps_timestamp_desc
ON stablecoin_market_caps (timestamp_utc DESC);

-- Index for coin symbol lookups
CREATE INDEX idx_stablecoin_market_caps_coin_symbol
ON stablecoin_market_caps (coin_symbol);

-- Composite index for time-based coin queries
CREATE INDEX idx_stablecoin_market_caps_timestamp_coin
ON stablecoin_market_caps (timestamp_utc, coin_symbol);

-- Index for current day queries (coin_id and date)
CREATE INDEX idx_stablecoin_market_caps_coin_date
ON stablecoin_market_caps (coin_id, (timestamp_utc::date));

-- Index for weekly queries (coin_id and week)
CREATE INDEX idx_stablecoin_market_caps_coin_week
ON stablecoin_market_caps (coin_id, (date_trunc('week', timestamp_utc)));
```

## Sample Data

For testing purposes, you can insert sample data:

```sql
INSERT INTO stablecoin_market_caps (
    coin_id, coin_name, coin_symbol, timestamp_utc,
    market_cap_usd, price_usd, volume_24h_usd, data_granularity
) VALUES
    ('tether', 'Tether', 'USDT', NOW(), 83500000000, 1.00, 25000000000, 'daily'),
    ('usd-coin', 'USD Coin', 'USDC', NOW(), 41500000000, 1.00, 8500000000, 'daily'),
    ('binance-usd', 'Binance USD', 'BUSD', NOW(), 9000000000, 1.00, 3200000000, 'daily'),
    ('dai', 'Dai', 'DAI', NOW(), 6300000000, 1.00, 1200000000, 'daily');
```

## Installation

1. Install dependencies:

```bash
npm install @supabase/ssr @supabase/supabase-js
```

2. Create your `.env.local` file with the Supabase credentials
3. Start the development server:

```bash
npm run dev
```

## API Endpoints

The dashboard uses these API endpoints:

- `GET /api/dashboard/metrics` - Returns total market cap, volume, and growth rates
- `GET /api/dashboard/chart-data` - Returns weekly chart data for the past 12 months

## Security Considerations

1. **Row Level Security (RLS)**: If your data is sensitive, enable RLS on your table:

```sql
ALTER TABLE stablecoin_market_caps ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow read access
CREATE POLICY "Allow read access" ON stablecoin_market_caps
FOR SELECT USING (true);
```

2. **Environment Variables**: Never commit your `.env.local` file to version control
3. **API Keys**: The anon key is safe to use in client-side code as it only has limited permissions

## Troubleshooting

### Common Issues

1. **"Failed to fetch" errors**: Check that your Supabase URL and key are correct
2. **Empty data**: Ensure your table has data and the table name matches exactly
3. **CORS errors**: Supabase should handle CORS automatically, but check your project settings if issues persist

### Testing Database Connection

You can test your connection in the browser console:

```javascript
// In browser console
const { createClient } = supabase;
const client = createClient("YOUR_URL", "YOUR_ANON_KEY");
const { data, error } = await client
  .from("stablecoin_market_caps")
  .select("*")
  .limit(1);
console.log(data, error);
```

## Performance Optimization

For production deployments:

1. **Database Indexes**: Ensure proper indexes are created (see above)
2. **Connection Pooling**: Supabase handles this automatically
3. **Caching**: Consider implementing Redis or similar for frequently accessed data
4. **Query Optimization**: Use `select()` to limit columns returned

## Optional Enhancements

### Database Functions

For better performance on complex queries, create PostgreSQL functions:

```sql
-- Function to get current market cap using the exact query pattern requested
CREATE OR REPLACE FUNCTION get_current_market_cap()
RETURNS NUMERIC AS $$
DECLARE
    result NUMERIC;
BEGIN
    WITH temp as (
        SELECT
            *,
            RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) as rank
        FROM stablecoin_market_caps
        WHERE date_trunc('day', NOW()) = timestamp_utc::date
    )
    SELECT
        COALESCE(SUM(market_cap_usd), 0) INTO result
    FROM temp
    WHERE rank = 1;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get current volume using the exact query pattern requested
CREATE OR REPLACE FUNCTION get_current_volume()
RETURNS NUMERIC AS $$
DECLARE
    result NUMERIC;
BEGIN
    WITH temp as (
        SELECT
            *,
            RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) as rank
        FROM stablecoin_market_caps
        WHERE date_trunc('day', NOW()) = timestamp_utc::date
    )
    SELECT
        COALESCE(SUM(volume_24h_usd), 0) INTO result
    FROM temp
    WHERE rank = 1;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get market cap percentage change from last month
CREATE OR REPLACE FUNCTION get_market_cap_perc_change()
RETURNS NUMERIC AS $$
DECLARE
    result NUMERIC;
BEGIN
    WITH current_cap as (
        WITH temp as (
            SELECT *,
            RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) as rank
            FROM stablecoin_market_caps
            WHERE date_trunc('day', NOW()) = timestamp_utc::date
        )
        SELECT SUM(market_cap_usd) as current_total
        FROM temp
        WHERE rank = 1
    ),
    previous_cap as (
        WITH temp as (
            SELECT *,
            RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) as rank
            FROM stablecoin_market_caps
            WHERE date_trunc('day', NOW() - INTERVAL '1 month') = timestamp_utc::date
        )
        SELECT SUM(market_cap_usd) as previous_total
        FROM temp
        WHERE rank = 1
    )
    SELECT
        CASE
            WHEN previous_total = 0 OR previous_total IS NULL THEN 0
            ELSE ((current_total - previous_total) / previous_total * 100)
        END INTO result
    FROM current_cap, previous_cap;

    RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get volume percentage change from last month
CREATE OR REPLACE FUNCTION get_volume_perc_change()
RETURNS NUMERIC AS $$
DECLARE
    result NUMERIC;
BEGIN
    WITH current_cap as (
        WITH temp as (
            SELECT *,
            RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) as rank
            FROM stablecoin_market_caps
            WHERE date_trunc('day', NOW()) = timestamp_utc::date
        )
        SELECT SUM(volume_24h_usd) as current_total
        FROM temp
        WHERE rank = 1
    ),
    previous_cap as (
        WITH temp as (
            SELECT *,
            RANK() OVER (PARTITION BY coin_id ORDER BY timestamp_utc) as rank
            FROM stablecoin_market_caps
            WHERE date_trunc('day', NOW() - INTERVAL '1 month') = timestamp_utc::date
        )
        SELECT SUM(volume_24h_usd) as previous_total
        FROM temp
        WHERE rank = 1
    )
    SELECT
        CASE
            WHEN previous_total = 0 OR previous_total IS NULL THEN 0
            ELSE ((current_total - previous_total) / previous_total * 100)
        END INTO result
    FROM current_cap, previous_cap;

    RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get market development per week per coin using exact query pattern
CREATE OR REPLACE FUNCTION get_market_per_coin_per_week()
RETURNS TABLE(coin_name VARCHAR, coin_id VARCHAR, week TIMESTAMP, market_cap NUMERIC) AS $$
BEGIN
    RETURN QUERY
    WITH temp as (
        SELECT *
        FROM stablecoin_market_caps
        WHERE timestamp_utc < (SELECT date_trunc('day', MAX(timestamp_utc)) FROM stablecoin_market_caps)
        ORDER BY timestamp_utc DESC
    )
    SELECT
        temp.coin_name,
        temp.coin_id,
        date_trunc('week', temp.timestamp_utc) as week,
        SUM(temp.market_cap_usd) as market_cap
    FROM temp
    WHERE temp.timestamp_utc = (
        SELECT MAX(m2.timestamp_utc)
        FROM temp m2
        WHERE m2.coin_id = temp.coin_id
        AND date_trunc('week', m2.timestamp_utc) = date_trunc('week', temp.timestamp_utc)
    )
    GROUP BY 1, 2, 3
    ORDER BY 3 DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly growth rate
CREATE OR REPLACE FUNCTION get_monthly_growth_rate()
RETURNS NUMERIC AS $$
DECLARE
    current_month_total NUMERIC;
    previous_month_total NUMERIC;
BEGIN
    -- Get current month total
    SELECT SUM(market_cap_usd) INTO current_month_total
    FROM stablecoin_market_caps
    WHERE date_trunc('month', timestamp_utc) = date_trunc('month', NOW());

    -- Get previous month total
    SELECT SUM(market_cap_usd) INTO previous_month_total
    FROM stablecoin_market_caps
    WHERE date_trunc('month', timestamp_utc) = date_trunc('month', NOW() - INTERVAL '1 month');

    -- Calculate growth rate
    IF previous_month_total = 0 OR previous_month_total IS NULL THEN
        RETURN 0;
    END IF;

    RETURN ((current_month_total - previous_month_total) / previous_month_total) * 100;
END;
$$ LANGUAGE plpgsql;
```

### Performance Testing

To test the functions:

```sql
-- Test all current metrics
SELECT
    get_current_market_cap() as current_market_cap,
    get_current_volume() as current_volume,
    get_market_cap_perc_change() as market_cap_change_percent,
    get_volume_perc_change() as volume_change_percent;

-- Test the weekly market data function
SELECT * FROM get_market_per_coin_per_week() LIMIT 20;

-- Test the underlying weekly market query manually
WITH temp as (
    SELECT *
    FROM stablecoin_market_caps
    WHERE timestamp_utc < (SELECT date_trunc('day', MAX(timestamp_utc)) FROM stablecoin_market_caps)
    ORDER BY timestamp_utc DESC
)
SELECT
    coin_name,
    coin_id,
    date_trunc('week', timestamp_utc) as week,
    SUM(market_cap_usd) as market_cap,
    COUNT(*) as records_in_week
FROM temp
WHERE timestamp_utc = (
    SELECT MAX(timestamp_utc)
    FROM temp m2
    WHERE m2.coin_id = temp.coin_id
    AND date_trunc('week', m2.timestamp_utc) = date_trunc('week', temp.timestamp_utc)
)
GROUP BY 1, 2, 3
ORDER BY 3 DESC, 4 DESC
LIMIT 20;

-- Test weekly breakdown for a specific coin
WITH temp as (
    SELECT *
    FROM stablecoin_market_caps
    WHERE timestamp_utc < (SELECT date_trunc('day', MAX(timestamp_utc)) FROM stablecoin_market_caps)
    AND coin_id = 'tether'  -- Change to test different coins
    ORDER BY timestamp_utc DESC
)
SELECT
    coin_name,
    coin_id,
    date_trunc('week', timestamp_utc) as week,
    SUM(market_cap_usd) as market_cap,
    MAX(timestamp_utc) as latest_timestamp_in_week
FROM temp
WHERE timestamp_utc = (
    SELECT MAX(timestamp_utc)
    FROM temp m2
    WHERE m2.coin_id = temp.coin_id
    AND date_trunc('week', m2.timestamp_utc) = date_trunc('week', temp.timestamp_utc)
)
GROUP BY 1, 2, 3
ORDER BY 3 DESC
LIMIT 10;

```

This will show you exactly which records are being used for all calculations and help verify the weekly market development data is processed correctly. The weekly function excludes the current day to ensure complete weekly data and uses the latest timestamp within each week for each coin.
