import type { Database } from '@/types/database';

export type Activity = Database['public']['Tables']['activities']['Row'];
export type ActivityStream = Database['public']['Tables']['activity_streams']['Row'];
export type AggregatedStat = Database['public']['Tables']['aggregated_stats']['Row'];
export type DashboardOverview = Database['public']['Views']['dashboard_overview']['Row'];

export type ActivityFilter = 'all' | 'Ride' | 'Run' | 'Workout' | 'Hike' | 'Walk';
export type BucketGranularity = AggregatedStat['bucket_granularity'];

export type ActivityFiltersState = {
  page: number;
  search: string;
  sportType: ActivityFilter;
};

export type AccentToken = {
  glow: string;
  soft: string;
  solid: string;
};
