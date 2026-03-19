import { supabase } from '@/lib/supabase';
import type {
  Activity,
  ActivityFiltersState,
  ActivityStream,
  AggregatedStat,
  BucketGranularity,
  DashboardOverview,
  HeatmapActivity,
} from '@/types/domain';
import { subYears } from 'date-fns';

const PAGE_SIZE = 12;

export const fetchDashboardOverview = async (): Promise<DashboardOverview | null> => {
  const { data, error } = await supabase.from('dashboard_overview').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data;
};

export const fetchRecentActivities = async (limit = 6): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

export const fetchActivities = async (
  filters: ActivityFiltersState,
): Promise<{ data: Activity[]; hasMore: boolean }> => {
  let query = supabase
    .from('activities')
    .select('*')
    .order('start_date', { ascending: false })
    .range(filters.page * PAGE_SIZE, filters.page * PAGE_SIZE + PAGE_SIZE);

  if (filters.sportType !== 'all') {
    query = query.eq('sport_type', filters.sportType);
  }

  if (filters.search.trim()) {
    query = query.ilike('name', `%${filters.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    data,
    hasMore: data.length > PAGE_SIZE,
  };
};

export const fetchActivityDetail = async (activityId: number): Promise<Activity | null> => {
  const { data, error } = await supabase.from('activities').select('*').eq('id', activityId).maybeSingle();
  if (error) throw error;
  return data;
};

export const fetchActivityStream = async (activityId: number): Promise<ActivityStream | null> => {
  const { data, error } = await supabase
    .from('activity_streams')
    .select('*')
    .eq('activity_id', activityId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const fetchAggregatedStats = async (
  granularity: BucketGranularity,
  activityType = 'all',
): Promise<AggregatedStat[]> => {
  const { data, error } = await supabase
    .from('aggregated_stats')
    .select('*')
    .eq('bucket_granularity', granularity)
    .eq('activity_type', activityType)
    .order('bucket_date', { ascending: true });

  if (error) throw error;
  return data;
};

export const fetchBreakdownStats = async (): Promise<AggregatedStat[]> => {
  const { data, error } = await supabase
    .from('aggregated_stats')
    .select('*')
    .eq('bucket_granularity', 'all')
    .neq('activity_type', 'all')
    .order('total_distance_meters', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchHeatmapActivities = async (): Promise<HeatmapActivity[]> => {
  const since = subYears(new Date(), 1).toISOString();
  const { data, error } = await supabase
    .from('activities')
    .select('id, start_date, distance_meters, sport_type')
    .gte('start_date', since)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data as HeatmapActivity[];
};
