import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const STRAVA_API_URL = 'https://www.strava.com/api/v3';

export type StravaTokenResponse = {
  access_token: string;
  athlete?: ({ id: number } & Record<string, unknown>) | null;
  expires_at: number;
  refresh_token: string;
  scope?: string;
  token_type?: string;
};

export type StoredStravaToken = {
  athlete_id: number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  token_type?: string | null;
  scope?: string[] | null;
};

export type StravaAthlete = {
  id: number;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  sex?: string | null;
  profile?: string | null;
  profile_medium?: string | null;
  follower_count?: number | null;
  friend_count?: number | null;
  weight?: number | null;
};

export type StravaStats = Record<string, unknown>;

export type StravaActivity = {
  id: number;
  athlete: { id: number };
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  timezone?: string | null;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed?: number | null;
  max_speed?: number | null;
  average_heartrate?: number | null;
  max_heartrate?: number | null;
  kilojoules?: number | null;
  achievement_count?: number | null;
  kudos_count?: number | null;
  comment_count?: number | null;
  trainer?: boolean;
  commute?: boolean;
  manual?: boolean;
  private?: boolean;
  flagged?: boolean;
  start_latlng?: [number, number] | null;
  end_latlng?: [number, number] | null;
  map?: {
    resource_state?: number;
    summary_polyline?: string | null;
  } | null;
};

export type StravaStreams = {
  altitude?: { data: number[] };
  distance?: { data: number[] };
  latlng?: { data: [number, number][] };
};

const toFormBody = (params: Record<string, string>) => new URLSearchParams(params).toString();

const postToken = async (body: Record<string, string>) => {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: toFormBody(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Strava token exchange failed: ${payload?.message ?? response.statusText}`);
  }

  return payload as StravaTokenResponse;
};

export const exchangeCodeForToken = (params: {
  clientId: string;
  clientSecret: string;
  code: string;
}) =>
  postToken({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code: params.code,
    grant_type: 'authorization_code',
  });

export const refreshStravaToken = (params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}) =>
  postToken({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    refresh_token: params.refreshToken,
    grant_type: 'refresh_token',
  });

export const fetchStrava = async <T>(path: string, accessToken: string, searchParams?: Record<string, string>) => {
  const url = new URL(`${STRAVA_API_URL}${path}`);
  Object.entries(searchParams ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Strava request failed for ${path}: ${payload?.message ?? response.statusText}`);
  }

  return payload as T;
};

export const fetchAthlete = (accessToken: string) => fetchStrava<StravaAthlete>('/athlete', accessToken);
export const fetchAthleteStats = (accessToken: string, athleteId: number) =>
  fetchStrava<StravaStats>(`/athletes/${athleteId}/stats`, accessToken);

export const fetchActivitiesPage = (accessToken: string, page: number, after?: number) =>
  fetchStrava<StravaActivity[]>('/athlete/activities', accessToken, {
    page: String(page),
    per_page: '100',
    ...(after ? { after: String(after) } : {}),
  });

export const fetchActivityStreams = (accessToken: string, activityId: number) =>
  fetchStrava<StravaStreams>(`/activities/${activityId}/streams`, accessToken, {
    keys: 'latlng,distance,altitude',
    key_by_type: 'true',
  });

const resolveAthleteId = (token: StravaTokenResponse, fallbackAthleteId?: number) => {
  const athleteId = token.athlete?.id ?? fallbackAthleteId;

  if (typeof athleteId !== 'number') {
    throw new Error('Strava token response did not include an athlete id.');
  }

  return athleteId;
};

export const persistToken = async (
  supabase: SupabaseClient,
  token: StravaTokenResponse,
  fallbackAthleteId?: number,
) => {
  const { error } = await supabase.from('strava_tokens').upsert(
    {
      athlete_id: resolveAthleteId(token, fallbackAthleteId),
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: new Date(token.expires_at * 1000).toISOString(),
      token_type: token.token_type ?? 'Bearer',
      scope: token.scope ? token.scope.split(',') : [],
    },
    {
      onConflict: 'athlete_id',
    },
  );

  if (error) throw error;
};

export const upsertAthlete = async (
  supabase: SupabaseClient,
  athlete: StravaAthlete,
  stats: StravaStats,
) => {
  const { error } = await supabase.from('athletes').upsert(
    {
      athlete_id: athlete.id,
      username: athlete.username ?? null,
      firstname: athlete.firstname ?? null,
      lastname: athlete.lastname ?? null,
      bio: athlete.bio ?? null,
      city: athlete.city ?? null,
      state: athlete.state ?? null,
      country: athlete.country ?? null,
      sex: athlete.sex ?? null,
      profile: athlete.profile ?? null,
      profile_medium: athlete.profile_medium ?? null,
      follower_count: athlete.follower_count ?? null,
      friend_count: athlete.friend_count ?? null,
      weight: athlete.weight ?? null,
      raw_stats: stats,
      last_synced_at: new Date().toISOString(),
    },
    {
      onConflict: 'athlete_id',
    },
  );

  if (error) throw error;
};

export const upsertActivities = async (
  supabase: SupabaseClient,
  athleteId: number,
  activities: StravaActivity[],
) => {
  if (!activities.length) return;

  const payload = activities.map((activity) => ({
    id: activity.id,
    athlete_id: athleteId,
    name: activity.name,
    type: activity.type,
    sport_type: activity.sport_type,
    start_date: activity.start_date,
    timezone: activity.timezone ?? null,
    distance_meters: activity.distance,
    moving_time_seconds: activity.moving_time,
    elapsed_time_seconds: activity.elapsed_time,
    total_elevation_gain: activity.total_elevation_gain,
    average_speed: activity.average_speed ?? null,
    max_speed: activity.max_speed ?? null,
    average_heartrate: activity.average_heartrate ?? null,
    max_heartrate: activity.max_heartrate ?? null,
    kilojoules: activity.kilojoules ?? null,
    achievement_count: activity.achievement_count ?? 0,
    kudos_count: activity.kudos_count ?? 0,
    comment_count: activity.comment_count ?? 0,
    trainer: activity.trainer ?? false,
    commute: activity.commute ?? false,
    manual: activity.manual ?? false,
    private: activity.private ?? false,
    flagged: activity.flagged ?? false,
    start_latlng: activity.start_latlng ?? null,
    end_latlng: activity.end_latlng ?? null,
    map_summary_polyline: activity.map?.summary_polyline ?? null,
    map_resource_state: activity.map?.resource_state ?? null,
    raw_payload: activity,
  }));

  const { error } = await supabase.from('activities').upsert(payload, {
    onConflict: 'id',
  });

  if (error) throw error;
};

export const upsertStream = async (
  supabase: SupabaseClient,
  activityId: number,
  streams: StravaStreams,
) => {
  const { error } = await supabase.from('activity_streams').upsert(
    {
      activity_id: activityId,
      latlng: streams.latlng?.data ?? null,
      distance: streams.distance?.data ?? null,
      altitude: streams.altitude?.data ?? null,
    },
    {
      onConflict: 'activity_id',
    },
  );

  if (error) throw error;
};

export const getStoredToken = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('strava_tokens')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('No Strava token has been stored yet.');
  return data as StoredStravaToken;
};
