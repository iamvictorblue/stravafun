import type { Database } from '@/types/database';

export type Activity = Database['public']['Tables']['activities']['Row'];
export type ActivityStream = Database['public']['Tables']['activity_streams']['Row'];
export type AggregatedStat = Database['public']['Tables']['aggregated_stats']['Row'];
export type DashboardOverview = Database['public']['Views']['dashboard_overview']['Row'];
export type HeatmapActivity = Pick<Activity, 'id' | 'start_date' | 'distance_meters' | 'sport_type'>;
export type CalorieActivity = Pick<
  Activity,
  'id' | 'name' | 'start_date' | 'sport_type' | 'distance_meters' | 'moving_time_seconds' | 'total_elevation_gain' | 'kilojoules'
>;
export type ActivitySpotlights = {
  biggestBurn: Activity | null;
  biggestClimb: Activity | null;
  longestDistance: Activity | null;
  longestSession: Activity | null;
};

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
