import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchActivities } from '@/lib/api';
import type { ActivityFiltersState } from '@/types/domain';

export const useActivities = (filters: ActivityFiltersState) =>
  useQuery({
    queryKey: ['activities', filters],
    queryFn: () => fetchActivities(filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
