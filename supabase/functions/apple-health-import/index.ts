import { corsHeaders, json } from '../_shared/cors.ts';
import { createServiceClient, env } from '../_shared/env.ts';

type RawWorkout = Record<string, unknown>;

const APPLE_TYPE_TO_SPORT: Record<string, string> = {
  running: 'Run',
  outdoorrun: 'Run',
  indoorrun: 'Run',
  treadmill: 'Run',
  walking: 'Walk',
  outdoorwalk: 'Walk',
  indoorwalk: 'Walk',
  cycling: 'Ride',
  outdoorcycle: 'Ride',
  indoorcycle: 'Ride',
  hiking: 'Hike',
  swimming: 'Swim',
  poolswim: 'Swim',
  openwaterswim: 'Swim',
  traditionalstrengthtraining: 'WeightTraining',
  functionalstrengthtraining: 'WeightTraining',
  strengthtraining: 'WeightTraining',
  weightlifting: 'WeightTraining',
  yoga: 'Yoga',
  elliptical: 'Elliptical',
  rowing: 'Rowing',
  stairclimbing: 'StairStepper',
  highintensityintervaltraining: 'Workout',
  hiit: 'Workout',
  coretraining: 'Workout',
  crosstraining: 'Workout',
  mixedcardio: 'Workout',
  cooldown: 'Workout',
  pilates: 'Pilates',
  soccer: 'Soccer',
  basketball: 'Workout',
  tennis: 'Tennis',
};

const firstDefined = (workout: RawWorkout, keys: string[]) => {
  for (const key of keys) {
    const match = Object.keys(workout).find((entry) => entry.toLowerCase().replace(/[\s_-]/g, '') === key);
    if (match !== undefined && workout[match] !== undefined && workout[match] !== null && workout[match] !== '') {
      return workout[match];
    }
  }
  return undefined;
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const match = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

// Accepts "45:12", "1:02:45", plain seconds ("durationSeconds"), or minutes.
const parseDurationSeconds = (workout: RawWorkout): number | null => {
  const explicitSeconds = parseNumber(firstDefined(workout, ['durationseconds', 'seconds']));
  if (explicitSeconds !== null) return Math.round(explicitSeconds);

  const raw = firstDefined(workout, ['durationminutes', 'duration', 'time']);
  if (raw === undefined) return null;

  if (typeof raw === 'string' && raw.includes(':')) {
    const parts = raw.trim().split(':').map((part) => Number(part));
    if (parts.some((part) => !Number.isFinite(part))) return null;
    return parts.reduce((total, part) => total * 60 + part, 0);
  }

  const minutes = parseNumber(raw);
  return minutes === null ? null : Math.round(minutes * 60);
};

// Distance strings from Shortcuts carry their unit ("3.11 mi", "5,02 km").
const parseDistanceMeters = (workout: RawWorkout): number => {
  const meters = parseNumber(firstDefined(workout, ['distancemeters', 'distancem']));
  if (meters !== null) return meters;

  const miles = parseNumber(firstDefined(workout, ['distancemi', 'distancemiles']));
  if (miles !== null) return miles * 1609.344;

  const km = parseNumber(firstDefined(workout, ['distancekm']));
  if (km !== null) return km * 1000;

  const raw = firstDefined(workout, ['distance']);
  const value = parseNumber(raw);
  if (value === null) return 0;

  const unitHint = typeof raw === 'string' ? raw.toLowerCase() : '';
  if (unitHint.includes('mi')) return value * 1609.344;
  if (/(^|\d|\s)m\b/.test(unitHint) && !unitHint.includes('km')) return value;
  return value * 1000;
};

const parseElevationMeters = (workout: RawWorkout): number => {
  const raw = firstDefined(workout, ['elevationascended', 'elevation', 'totalelevationgain', 'ascent']);
  const value = parseNumber(raw);
  if (value === null) return 0;
  const unitHint = typeof raw === 'string' ? raw.toLowerCase() : '';
  return unitHint.includes('ft') || unitHint.includes('feet') ? value * 0.3048 : value;
};

const resolveSportType = (workout: RawWorkout) => {
  const raw = firstDefined(workout, ['sporttype', 'type', 'workouttype', 'activitytype']);
  if (typeof raw !== 'string' || !raw.trim()) return 'Workout';
  const normalized = raw.toLowerCase().replace(/[\s_.-]/g, '');
  return APPLE_TYPE_TO_SPORT[normalized] ?? 'Workout';
};

const buildActivityName = (sportType: string, startDate: Date, rawStart: string) => {
  const offsetMatch = rawStart.match(/([+-]\d{2}):?(\d{2})$/);
  const offsetMinutes = offsetMatch
    ? Number(offsetMatch[1]) * 60 + Math.sign(Number(offsetMatch[1])) * Number(offsetMatch[2])
    : 0;
  const localHour = new Date(startDate.getTime() + offsetMinutes * 60 * 1000).getUTCHours();
  const period = localHour < 5 ? 'Night' : localHour < 12 ? 'Morning' : localHour < 17 ? 'Afternoon' : 'Evening';
  const label = sportType === 'WeightTraining' ? 'Weight Training' : sportType;
  return `${period} ${label}`;
};

const parseWorkout = (workout: RawWorkout, athleteId: number) => {
  const rawStart = firstDefined(workout, ['startdate', 'start']);
  if (typeof rawStart !== 'string' || Number.isNaN(new Date(rawStart).getTime())) {
    throw new Error(`Workout is missing a valid start date: ${JSON.stringify(workout).slice(0, 200)}`);
  }

  const startDate = new Date(rawStart);
  const rawEnd = firstDefined(workout, ['enddate', 'end']);
  const endDate = typeof rawEnd === 'string' && !Number.isNaN(new Date(rawEnd).getTime()) ? new Date(rawEnd) : null;

  const durationSeconds = parseDurationSeconds(workout);
  const elapsedSeconds = endDate
    ? Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000))
    : (durationSeconds ?? 0);
  const movingSeconds = durationSeconds ?? elapsedSeconds;

  const distanceMeters = parseDistanceMeters(workout);
  const calories = parseNumber(firstDefined(workout, ['activeenergy', 'calories', 'energy', 'kcal']));
  const avgHeartRate = parseNumber(firstDefined(workout, ['avgheartrate', 'averageheartrate', 'heartrate']));
  const maxHeartRate = parseNumber(firstDefined(workout, ['maxheartrate']));
  const sportType = resolveSportType(workout);
  const customName = firstDefined(workout, ['name', 'title']);

  return {
    id: Math.floor(startDate.getTime() / 1000),
    athlete_id: athleteId,
    name: typeof customName === 'string' && customName.trim() ? customName.trim() : buildActivityName(sportType, startDate, rawStart),
    type: sportType,
    sport_type: sportType,
    start_date: startDate.toISOString(),
    timezone: null,
    distance_meters: distanceMeters,
    moving_time_seconds: movingSeconds,
    elapsed_time_seconds: Math.max(elapsedSeconds, movingSeconds),
    total_elevation_gain: parseElevationMeters(workout),
    average_speed: movingSeconds > 0 && distanceMeters > 0 ? distanceMeters / movingSeconds : null,
    max_speed: null,
    average_heartrate: avgHeartRate,
    max_heartrate: maxHeartRate,
    // The dashboard reads this column as calories; Apple active energy is already kcal.
    kilojoules: calories,
    achievement_count: 0,
    kudos_count: 0,
    comment_count: 0,
    trainer: false,
    commute: false,
    manual: false,
    private: false,
    flagged: false,
    start_latlng: null,
    end_latlng: null,
    map_summary_polyline: null,
    map_resource_state: null,
    raw_payload: { source: 'apple-health', ...workout },
  };
};

const extractWorkouts = (body: unknown): RawWorkout[] => {
  if (Array.isArray(body)) return body as RawWorkout[];
  if (body && typeof body === 'object') {
    const container = body as Record<string, unknown>;
    if (Array.isArray(container.workouts)) return container.workouts as RawWorkout[];
    return [container];
  }
  return [];
};

const resolveAthleteId = async () => {
  if (env.STRAVA_OWNER_ATHLETE_ID) {
    return Number(env.STRAVA_OWNER_ATHLETE_ID);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from('athletes').select('athlete_id').limit(1).maybeSingle();
  if (error) throw error;
  if (!data?.athlete_id) throw new Error('No athlete configured yet.');
  return data.athlete_id as number;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, { status: 405 });
  }

  if (request.headers.get('x-owner-secret') !== env.OWNER_SETUP_SECRET) {
    return json({ error: 'Unauthorized request.' }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    const body = await request.json().catch(() => null);
    const workouts = extractWorkouts(body);

    if (!workouts.length) {
      return json({ error: 'Request body must contain a workout or a workouts array.' }, { status: 400 });
    }

    const athleteId = await resolveAthleteId();
    const rows = workouts.map((workout) => parseWorkout(workout, athleteId));

    const { error: upsertError } = await supabase.from('activities').upsert(rows, { onConflict: 'id' });
    if (upsertError) throw upsertError;

    const { error: aggregateError } = await supabase.rpc('refresh_aggregated_stats', {
      p_athlete_id: athleteId,
    });
    if (aggregateError) throw aggregateError;

    const syncedAt = new Date().toISOString();
    const { error: athleteError } = await supabase
      .from('athletes')
      .update({ last_synced_at: syncedAt })
      .eq('athlete_id', athleteId);
    if (athleteError) throw athleteError;

    const { error: logError } = await supabase.from('sync_logs').insert({
      athlete_id: athleteId,
      sync_type: 'apple-health',
      status: 'success',
      activities_processed: rows.length,
      metadata: { requestedBy: 'apple-health-shortcut' },
      completed_at: syncedAt,
    });
    if (logError) throw logError;

    return json({
      imported: rows.length,
      activityIds: rows.map((row) => row.id),
      syncedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Apple Health import failed.';

    await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'apple-health',
        status: 'error',
        error_message: message,
        metadata: { requestedBy: 'apple-health-shortcut' },
        completed_at: new Date().toISOString(),
      })
      .then(() => undefined, () => undefined);

    return json({ error: message }, { status: 400 });
  }
});
