export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activity_streams: {
        Row: {
          activity_id: number;
          altitude: Json | null;
          created_at: string;
          distance: Json | null;
          latlng: Json | null;
          updated_at: string;
        };
      };
      activities: {
        Row: {
          achievement_count: number | null;
          athlete_id: number;
          average_heartrate: number | null;
          average_speed: number | null;
          comment_count: number | null;
          commute: boolean;
          created_at: string;
          distance_meters: number;
          elapsed_time_seconds: number;
          end_latlng: Json | null;
          flagged: boolean;
          id: number;
          kilojoules: number | null;
          kudos_count: number | null;
          manual: boolean;
          map_resource_state: number | null;
          map_summary_polyline: string | null;
          max_heartrate: number | null;
          max_speed: number | null;
          moving_time_seconds: number;
          name: string;
          private: boolean;
          raw_payload: Json | null;
          sport_type: string;
          start_date: string;
          start_latlng: Json | null;
          timezone: string | null;
          total_elevation_gain: number;
          trainer: boolean;
          type: string;
          updated_at: string;
        };
      };
      aggregated_stats: {
        Row: {
          activity_count: number;
          activity_type: string;
          athlete_id: number;
          bucket_date: string;
          bucket_granularity: 'all' | 'week' | 'month' | 'year';
          created_at: string;
          id: string;
          total_distance_meters: number;
          total_elevation_gain: number;
          total_moving_time_seconds: number;
          updated_at: string;
        };
      };
      athletes: {
        Row: {
          athlete_id: number;
          bio: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          firstname: string | null;
          follower_count: number | null;
          friend_count: number | null;
          lastname: string | null;
          last_synced_at: string | null;
          profile: string | null;
          profile_medium: string | null;
          raw_stats: Json | null;
          sex: string | null;
          state: string | null;
          updated_at: string;
          username: string | null;
          weight: number | null;
        };
      };
      strava_tokens: {
        Row: {
          access_token: string;
          athlete_id: number;
          created_at: string;
          expires_at: string;
          id: number;
          refresh_token: string;
          scope: string[] | null;
          token_type: string | null;
          updated_at: string;
        };
      };
      sync_logs: {
        Row: {
          activities_processed: number | null;
          athlete_id: number | null;
          completed_at: string | null;
          created_at: string;
          error_message: string | null;
          id: string;
          metadata: Json | null;
          started_at: string;
          status: 'running' | 'success' | 'error';
          sync_type: string;
        };
      };
    };
    Views: {
      dashboard_overview: {
        Row: {
          activity_count: number | null;
          athlete_id: number | null;
          city: string | null;
          country: string | null;
          display_name: string | null;
          last_sync_status: string | null;
          last_synced_at: string | null;
          other_count: number | null;
          profile: string | null;
          profile_medium: string | null;
          ride_count: number | null;
          run_count: number | null;
          state: string | null;
          total_distance_meters: number | null;
          total_elevation_gain: number | null;
          total_moving_time_seconds: number | null;
          username: string | null;
        };
      };
      public_sync_status: {
        Row: {
          activities_processed: number | null;
          athlete_id: number | null;
          completed_at: string | null;
          status: string | null;
        };
      };
    };
  };
};
