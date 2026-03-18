import { useQuery } from '@tanstack/react-query';
import { fetchActivityDetail, fetchActivityStream } from '@/lib/api';

export const useActivityDetail = (activityId?: number) =>
  useQuery({
    queryKey: ['activity-detail', activityId],
    queryFn: () => fetchActivityDetail(activityId!),
    enabled: Number.isFinite(activityId),
    staleTime: 1000 * 60 * 10,
  });

export const useActivityStream = (activityId?: number) =>
  useQuery({
    queryKey: ['activity-stream', activityId],
    queryFn: () => fetchActivityStream(activityId!),
    enabled: Number.isFinite(activityId),
    staleTime: 1000 * 60 * 10,
  });
