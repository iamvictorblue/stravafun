import { useQuery } from '@tanstack/react-query';
import { fetchAggregatedStats, fetchBreakdownStats } from '@/lib/api';
import type { BucketGranularity } from '@/types/domain';

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
