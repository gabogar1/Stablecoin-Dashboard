# Supabase Integration Setup Guide

This guide will help you set up the Supabase integration for the Stablecoins Market Dashboard.

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
