export interface Database {
  public: {
    Tables: {
      stablecoin_market_caps: {
        Row: {
          id: number;
          coin_id: string;
          coin_name: string;
          coin_symbol: string;
          timestamp_utc: string;
          market_cap_usd: number;
          price_usd: number;
          volume_24h_usd: number;
          data_granularity: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          coin_id: string;
          coin_name: string;
          coin_symbol: string;
          timestamp_utc: string;
          market_cap_usd: number;
          price_usd: number;
          volume_24h_usd: number;
          data_granularity: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          coin_id?: string;
          coin_name?: string;
          coin_symbol?: string;
          timestamp_utc?: string;
          market_cap_usd?: number;
          price_usd?: number;
          volume_24h_usd?: number;
          data_granularity?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for the dashboard
export interface DashboardMetrics {
  totalMarketCap: number;
  totalVolume24h: number;
  growthRateMonthly: number;
  totalMarketCapChange: number;
  totalVolumeChange: number;
  growthRateChange: number;
  totalMarketCapChangeYoy: number;
}

export interface ChartDataPoint {
  week: string;
  total_market_cap: number;
  usdt: number; // Tether
  usdc: number; // USD Coin  
  dai: number;  // Dai
  busd: number; // Binance USD
  frax: number; // Frax
  tusd: number; // TrueUSD
  formatted_date?: string;
}

export interface WeeklyMarketData {
  coin_name: string;
  coin_id: string;
  week: string;
  market_cap: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
} 