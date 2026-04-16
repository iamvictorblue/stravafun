import { useQuery } from '@tanstack/react-query';
import { fetchAggregatedStats, fetchBreakdownStats, fetchCalorieActivities, fetchHeatmapActivities } from '@/lib/api';
import type { BucketGranularity, CalorieActivity } from '@/types/domain';

export const useAggregatedStats = (granularity: BucketGranularity) =>
  useQuery({
    queryKey: ['aggregated-stats', granularity],
    queryFn: () => fetchAggregatedStats(granularity),
    staleTime: 1000 * 60 * 10,
  });

export const useBreakdownStats = () =>
  useQuery({
    queryKey: ['breakdown-stats'],
    queryFn: fetchBreakdownStats,
    staleTime: 1000 * 60 * 10,
  });

export const useHeatmapActivities = () =>
  useQuery({
    queryKey: ['heatmap-activities'],
    queryFn: fetchHeatmapActivities,
    staleTime: 1000 * 60 * 10,
  });

export const useCalorieActivities = () =>
  useQuery<CalorieActivity[]>({
    queryKey: ['calorie-activities'],
    queryFn: fetchCalorieActivities,
    staleTime: 1000 * 60 * 10,
  });
