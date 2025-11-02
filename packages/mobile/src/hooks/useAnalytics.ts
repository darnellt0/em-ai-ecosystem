// useAnalytics Hook - Analytics data fetching
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import mlPredictionService from '../services/mlPrediction';
import { AnalyticsData } from '../types';

export const useAnalytics = (period: 'day' | 'week' | 'month' | 'year' = 'week') => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch analytics from API
      const analyticsData = await api.getAnalytics(period);
      setData(analyticsData);

      // Get ML insights
      const mlInsights = await mlPredictionService.getProductivityInsights();
      setInsights(mlInsights);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
      setLoading(false);
      console.error('Error fetching analytics:', err);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refresh = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    insights,
    loading,
    error,
    refresh,
  };
};
