import { createServiceClient, env } from './env.ts';
import {
  fetchActivitiesPage,
  fetchActivityStreams,
  fetchAthlete,
  fetchAthleteStats,
  getStoredToken,
  persistToken,
  refreshStravaToken,
  type StoredStravaToken,
  upsertActivities,
  upsertAthlete,
  upsertStream,
} from './strava.ts';

const isAuthorized = (request: Request) => {
  const ownerSecret = request.headers.get('x-owner-secret');
  const bearer = request.headers.get('authorization');
  return ownerSecret === env.OWNER_SETUP_SECRET || bearer === `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`;
};

export const requireAuthorizedRequest = (request: Request) => {
  if (!isAuthorized(request)) {
    throw new Error('Unauthorized request.');
  }
};

export const ensureValidToken = async (): Promise<StoredStravaToken> => {
  const supabase = createServiceClient();
  const storedToken = await getStoredToken(supabase);
  const expiresSoon = new Date(storedToken.expires_at).getTime() - Date.now() < 5 * 60 * 1000;

  if (!expiresSoon) {
    return storedToken;
  }

  const refreshed = await refreshStravaToken({
    clientId: env.STRAVA_CLIENT_ID,
    clientSecret: env.STRAVA_CLIENT_SECRET,
    refreshToken: storedToken.refresh_token,
  });

  await persistToken(supabase, refreshed, storedToken.athlete_id);
  return {
    ...storedToken,
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
    token_type: refreshed.token_type ?? storedToken.token_type ?? 'Bearer',
    scope: refreshed.scope ? refreshed.scope.split(',') : (storedToken.scope ?? []),
  };
};

const createLog = async (syncType: string, metadata?: Record<string, unknown>) => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('sync_logs')
    .insert({
      sync_type: syncType,
      status: 'running',
      metadata: metadata ?? {},
    })
    .select('id')
    .single();

  if (error) throw error;
  if (!data?.id) {
    throw new Error('Failed to create sync log entry.');
  }
  return data.id as string;
};

const finalizeLog = async (
  logId: string,
  values: { athleteId?: number; status: 'success' | 'error'; activitiesProcessed?: number; errorMessage?: string; metadata?: Record<string, unknown> },
) => {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('sync_logs')
    .update({
      athlete_id: values.athleteId ?? null,
      status: values.status,
      activities_processed: values.activitiesProcessed ?? null,
      error_message: values.errorMessage ?? null,
      metadata: values.metadata ?? {},
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);

  if (error) throw error;
};

const getLastSuccessfulSync = async (athleteId: number) => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('sync_logs')
    .select('completed_at')
    .eq('athlete_id', athleteId)
    .eq('status', 'success')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.completed_at ?? null;
};

export const syncStravaData = async (params: { syncType: string; requestedBy?: string }) => {
  const logId = await createLog(params.syncType, { requestedBy: params.requestedBy ?? 'system' });

  try {
    const supabase = createServiceClient();
    const token = await ensureValidToken();
    const athlete = await fetchAthlete(token.access_token);
    const stats = await fetchAthleteStats(token.access_token, athlete.id);
    await upsertAthlete(supabase, athlete, stats);

    const lastSuccessfulSync = await getLastSuccessfulSync(athlete.id);
    const after = lastSuccessfulSync
      ? Math.floor(new Date(lastSuccessfulSync).getTime() / 1000) - 60 * 60 * 24 * 2
      : undefined;

    const activities = [];
    for (let page = 1; page <= env.STRAVA_SYNC_MAX_PAGES; page += 1) {
      const batch = await fetchActivitiesPage(token.access_token, page, after);
      if (!batch.length) break;
      activities.push(...batch);
      if (batch.length < 100) break;
    }

    await upsertActivities(supabase, athlete.id, activities);

    let streamsProcessed = 0;
    for (const activity of activities.filter((entry) => Boolean(entry.map?.summary_polyline)).slice(0, 12)) {
      try {
        const streams = await fetchActivityStreams(token.access_token, activity.id);
        await upsertStream(supabase, activity.id, streams);
        streamsProcessed += 1;
      } catch (error) {
        console.warn(`Skipping streams for activity ${activity.id}:`, error);
      }
    }

    const { error: aggregateError } = await supabase.rpc('refresh_aggregated_stats', {
      p_athlete_id: athlete.id,
    });
    if (aggregateError) throw aggregateError;

    const syncedAt = new Date().toISOString();
    const { error: athleteUpdateError } = await supabase
      .from('athletes')
      .update({ last_synced_at: syncedAt })
      .eq('athlete_id', athlete.id);
    if (athleteUpdateError) throw athleteUpdateError;

    await finalizeLog(logId, {
      athleteId: athlete.id,
      status: 'success',
      activitiesProcessed: activities.length,
      metadata: {
        requestedBy: params.requestedBy ?? 'system',
        streamsProcessed,
      },
    });

    return {
      athleteId: athlete.id,
      activitiesProcessed: activities.length,
      streamsProcessed,
      syncedAt,
    };
  } catch (error) {
    await finalizeLog(logId, {
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown sync failure',
      metadata: {
        requestedBy: params.requestedBy ?? 'system',
      },
    });
    throw error;
  }
};
