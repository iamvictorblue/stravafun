import { corsHeaders, json } from '../_shared/cors.ts';
import { createServiceClient, env } from '../_shared/env.ts';
import { syncStravaData } from '../_shared/sync.ts';

const RUNNING_SYNC_WINDOW_MS = 15 * 60 * 1000;

const hasRecentRunningSync = async () => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('sync_logs')
    .select('started_at')
    .eq('status', 'running')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.started_at) {
    return false;
  }

  return Date.now() - new Date(data.started_at).getTime() < RUNNING_SYNC_WINDOW_MS;
};

const getLastSyncedAt = async () => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('athletes')
    .select('athlete_id, last_synced_at')
    .order('last_synced_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, { status: 405 });
  }

  try {
    const athlete = await getLastSyncedAt();

    if (!athlete?.athlete_id) {
      return json({
        message: 'Owner setup has not completed yet.',
        status: 'not-configured',
        triggered: false,
      });
    }

    if (await hasRecentRunningSync()) {
      return json({
        message: 'A sync is already running.',
        status: 'running',
        triggered: false,
      });
    }

    const minIntervalMs = env.PUBLIC_SYNC_MIN_INTERVAL_MINUTES * 60 * 1000;
    const lastSyncedAt = athlete.last_synced_at;
    const isFresh = lastSyncedAt && Date.now() - new Date(lastSyncedAt).getTime() < minIntervalMs;

    if (isFresh) {
      return json({
        lastSyncedAt,
        message: 'Recent sync data is still fresh.',
        minIntervalMinutes: env.PUBLIC_SYNC_MIN_INTERVAL_MINUTES,
        status: 'fresh',
        triggered: false,
      });
    }

    const result = await syncStravaData({
      syncType: 'public-auto',
      requestedBy: 'public-app',
    });

    return json({
      ...result,
      message: 'Automatic sync completed.',
      minIntervalMinutes: env.PUBLIC_SYNC_MIN_INTERVAL_MINUTES,
      status: 'synced',
      triggered: true,
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Automatic sync failed.',
      },
      { status: 500 },
    );
  }
});
