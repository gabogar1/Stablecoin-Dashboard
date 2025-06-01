"use client";

import { useState, useEffect } from 'react';
import type { DashboardMetrics, ApiResponse } from '@/types/database';

interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching dashboard metrics
 * Handles loading states, error handling, and provides a refetch function
 */
export function useDashboardMetrics(): UseDashboardMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/metrics');
      const result: ApiResponse<DashboardMetrics> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch dashboard metrics');
      }

      if (result.data) {
        setMetrics(result.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
} 