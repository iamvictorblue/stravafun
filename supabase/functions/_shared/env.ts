import { createClient } from 'npm:@supabase/supabase-js@2';

const getEnv = (name: string, fallback?: string) => {
  const value = Deno.env.get(name) ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  STRAVA_CLIENT_ID: getEnv('STRAVA_CLIENT_ID'),
  STRAVA_CLIENT_SECRET: getEnv('STRAVA_CLIENT_SECRET'),
  STRAVA_REDIRECT_URI: getEnv('STRAVA_REDIRECT_URI'),
  OWNER_SETUP_SECRET: getEnv('OWNER_SETUP_SECRET'),
  PUBLIC_SITE_URL: getEnv('PUBLIC_SITE_URL'),
  STRAVA_OWNER_ATHLETE_ID: Deno.env.get('STRAVA_OWNER_ATHLETE_ID') ?? '',
  STRAVA_SYNC_MAX_PAGES: Number(Deno.env.get('STRAVA_SYNC_MAX_PAGES') ?? '25'),
  PUBLIC_SYNC_MIN_INTERVAL_MINUTES: Number(Deno.env.get('PUBLIC_SYNC_MIN_INTERVAL_MINUTES') ?? '360'),
};

export const createServiceClient = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
