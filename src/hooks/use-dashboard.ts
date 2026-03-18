import { useQuery } from '@tanstack/react-query';
import { fetchDashboardOverview, fetchRecentActivities } from '@/lib/api';

export const useDashboardOverview = () =>
  useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: fetchDashboardOverview,
    staleTime: 1000 * 60 * 10,
  });

export const useRecentActivities = (limit = 6) =>
  useQuery({
    queryKey: ['recent-activities', limit],
    queryFn: () => fetchRecentActivities(limit),
    staleTime: 1000 * 60 * 10,
  });
