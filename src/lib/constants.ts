import type { AccentToken, ActivityFilter } from '@/types/domain';

export const siteTitle = import.meta.env.VITE_SITE_TITLE?.trim() || 'Strava Public Dashboard';
export const stravaClientId = import.meta.env.VITE_STRAVA_CLIENT_ID?.trim() || '';
export const stravaRedirectUri = import.meta.env.VITE_STRAVA_REDIRECT_URI?.trim() || '';

export const activityFilters: ActivityFilter[] = ['all', 'Ride', 'Run', 'Workout', 'Hike', 'Walk'];

export const activityAccentMap: Record<string, AccentToken> = {
  Ride: {
    glow: 'rgba(255, 129, 61, 0.26)',
    soft: 'linear-gradient(135deg, rgba(255, 129, 61, 0.18), rgba(255, 166, 77, 0.04))',
    solid: '#ff8f4d',
  },
  Run: {
    glow: 'rgba(66, 142, 255, 0.28)',
    soft: 'linear-gradient(135deg, rgba(66, 142, 255, 0.2), rgba(73, 215, 255, 0.05))',
    solid: '#5aa8ff',
  },
  default: {
    glow: 'rgba(163, 101, 255, 0.24)',
    soft: 'linear-gradient(135deg, rgba(163, 101, 255, 0.18), rgba(211, 112, 255, 0.06))',
    solid: '#b07cff',
  },
};

const toHex = (bytes: Uint8Array) => Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');

const buildSignedOwnerState = async (setupSecret: string) => {
  const timestamp = Date.now();
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${setupSecret.trim()}:${timestamp}`),
  );

  return btoa(
    JSON.stringify({
      ts: timestamp,
      sig: toHex(new Uint8Array(digest)),
    }),
  );
};

export const buildStravaAuthorizeUrl = async (setupSecret: string) => {
  if (!stravaClientId || !stravaRedirectUri) {
    throw new Error('VITE_STRAVA_CLIENT_ID and VITE_STRAVA_REDIRECT_URI are required.');
  }

  const url = new URL('https://www.strava.com/oauth/authorize');
  url.searchParams.set('client_id', stravaClientId);
  url.searchParams.set('redirect_uri', stravaRedirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('approval_prompt', 'force');
  url.searchParams.set('scope', 'read,activity:read_all,profile:read_all');
  url.searchParams.set('state', await buildSignedOwnerState(setupSecret));
  return url.toString();
};
