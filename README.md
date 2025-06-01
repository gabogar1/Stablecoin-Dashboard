# Stablecoin Market Dashboard

A Next.js dashboard for tracking stablecoin market data with real-time analytics and visualizations, powered by Supabase.

## Features

- **Real-time Market Metrics**: Total market capitalization, 24h trading volume, month-over-month growth rates, and year-over-year market cap comparison
- **Interactive Charts**: Historical market cap development over the past 12 months with area charts
- **Multi-Stablecoin Support**: Track USDT, USDC, BUSD, DAI and other major stablecoins
- **Year-over-Year Analytics**: Track market cap growth trends with 51-week comparisons
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui components
- **TypeScript**: Fully typed for better development experience
- **Production Ready**: Built with performance and scalability in mind

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Charts**: Recharts.js
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account and project
- Basic knowledge of Next.js and React

### Installation

1. **Clone the repository**:

```bash
git clone <repository-url>
```

2. **Install dependencies**:

```bash
npm install
```

3. **Set up Supabase integration**:

   - Follow the detailed setup guide in `SUPABASE_SETUP.md`
   - Create your database table and add sample data
   - Configure environment variables

4. **Create environment file**:

```bash
# Create .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Start the development server**:

```bash
npm run dev
```

6. **Open your browser** to `http://localhost:3000`

## Database Schema

The dashboard requires a `stablecoin_market_caps` table with the following structure:

| Column             | Type          | Description                    |
| ------------------ | ------------- | ------------------------------ |
| `id`               | `int8`        | Primary key                    |
| `coin_id`          | `varchar`     | Unique identifier for the coin |
| `coin_name`        | `varchar`     | Name of the stablecoin         |
| `coin_symbol`      | `varchar`     | Trading symbol                 |
| `timestamp_utc`    | `timestamptz` | Time of the data point         |
| `market_cap_usd`   | `numeric`     | Market capitalization in USD   |
| `price_usd`        | `numeric`     | Price per token in USD         |
| `volume_24h_usd`   | `numeric`     | 24-hour trading volume in USD  |
| `data_granularity` | `varchar`     | Time granularity of the data   |
| `created_at`       | `timestamptz` | Record creation timestamp      |
| `updated_at`       | `timestamptz` | Record update timestamp        |

## Database Functions (Optional RPC Functions)

For optimal performance, you can create the following Supabase RPC functions. The application will fall back to manual calculations if these functions are not available:

### get_market_cap_yoy_change()

Returns the year-over-year market cap percentage change (51-week comparison):

```sql
CREATE OR REPLACE FUNCTION get_market_cap_yoy_change()
RETURNS NUMERIC AS $$
WITH current_cap as (
    WITH temp as (
        select *,
        RANK() OVER (partition by coin_id ORDER BY timestamp_utc) as rank
        from stablecoin_market_caps
        where (select date_trunc('day',max(timestamp_utc)) from stablecoin_market_caps)  = timestamp_utc::date
    )
    select sum(market_cap_usd) as current_total
    from temp
    where rank = 1
),
previous_cap as (
    WITH temp as (
        select *,
        RANK() OVER (partition by coin_id ORDER BY timestamp_utc) as rank
        from stablecoin_market_caps
        where (select date_trunc('day',max(timestamp_utc)) from stablecoin_market_caps) - interval '51 weeks'  = timestamp_utc::date
    )
    select sum(market_cap_usd) as previous_total
    from temp
    where rank = 1
)
select
    ((current_total - previous_total) / previous_total * 100) as percentage_change
from current_cap, previous_cap;
$$ LANGUAGE SQL;
```

### Other Available RPC Functions

The application also supports these optional RPC functions for improved performance:

- `get_current_market_cap()` - Current total market capitalization
- `get_market_cap_perc_change()` - Month-over-month market cap change
- `get_current_volume()` - Current total 24h volume
- `get_volume_perc_change()` - Month-over-month volume change
- `get_monthly_growth_rate()` - Monthly growth rate calculation
- `get_market_per_coin_per_week()` - Weekly market data per coin

## API Endpoints

- `GET /api/dashboard/metrics` - Returns dashboard metrics (market cap, volume, growth rates, year-over-year comparison)
- `GET /api/dashboard/chart-data` - Returns weekly chart data for the past 12 months

## Project Structure

```
src/
├── app/
│   ├── api/dashboard/           # API routes
│   ├── components/              # React components
│   └── page.tsx                 # Main dashboard page
├── lib/supabase/                # Supabase client configuration
├── types/                       # TypeScript type definitions
├── utils/                       # Database query helpers
└── hooks/                       # Custom React hooks
```

## Key Components

### Dashboard Metrics

- **Total Market Cap**: Sum of all stablecoin market capitalizations
- **Total Volume (24h)**: Combined 24-hour trading volume
- **Growth Rate (MoM)**: Month-over-month growth percentage
- **Market Cap (YoY)**: Year-over-year market cap percentage change (51-week comparison)

### Chart Visualization

- **Weekly Aggregation**: Data grouped by week for the past 12 months
- **Multi-Coin Support**: Individual tracking of major stablecoins
- **Interactive Tooltips**: Detailed breakdown on hover

## Development

### Code Style & Structure

- **TypeScript**: Fully typed codebase with strict configuration
- **Functional Programming**: Uses functional and declarative patterns
- **Component Architecture**: Modular, reusable components
- **Error Handling**: Comprehensive error boundaries and loading states

### Performance Optimizations

- **Server-Side Rendering**: Utilizes Next.js App Router for optimal performance
- **Database Indexing**: Optimized queries with proper PostgreSQL indexes
- **Parallel Fetching**: Multiple API calls executed simultaneously
- **Loading States**: Skeleton components for better user experience

## Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a Supabase project
2. Set up the database schema (see `SUPABASE_SETUP.md`)
3. Configure Row Level Security if needed
4. Add sample data for testing
5. Optionally create RPC functions for better performance (see Database Functions section above)

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- Digital Ocean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add JSDoc comments for functions
- Test your changes thoroughly

## Troubleshooting

### Common Issues

1. **"Failed to fetch" errors**: Check Supabase URL and API key
2. **Empty dashboard**: Ensure database has sample data
3. **Build errors**: Verify all TypeScript types are correct
4. **Slow queries**: Check database indexes are created
5. **Year-over-year data missing**: Ensure you have data from at least 51 weeks ago

### Getting Help

- Check `SUPABASE_SETUP.md` for detailed setup instructions
- Review the browser console for error messages
- Ensure all environment variables are set correctly

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Supabase](https://supabase.com/) for the backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Recharts](https://recharts.org/) for chart visualization
- [Next.js](https://nextjs.org/) for the React framework

```

```
