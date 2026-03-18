import { createServiceClient, env } from '../_shared/env.ts';
import { exchangeCodeForToken, persistToken } from '../_shared/strava.ts';
import { syncStravaData } from '../_shared/sync.ts';

const toHex = (bytes: Uint8Array) => Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');

const isValidOwnerState = async (state: string | null) => {
  if (!state) return false;

  try {
    const decoded = JSON.parse(atob(state)) as { ts?: number; sig?: string };
    if (typeof decoded.ts !== 'number' || typeof decoded.sig !== 'string') return false;

    const ageMs = Date.now() - decoded.ts;
    if (ageMs < 0 || ageMs > 15 * 60 * 1000) return false;

    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${env.OWNER_SETUP_SECRET}:${decoded.ts}`),
    );

    return toHex(new Uint8Array(digest)) === decoded.sig;
  } catch {
    return false;
  }
};

const redirectToConnect = (status: 'success' | 'error', message?: string) => {
  const redirectUrl = new URL('/connect', env.PUBLIC_SITE_URL);
  redirectUrl.searchParams.set('status', status);
  if (message) redirectUrl.searchParams.set('message', message);
  return Response.redirect(redirectUrl.toString(), 302);
};

Deno.serve(async (request) => {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return redirectToConnect('error', error);
    }

    if (!code) {
      return redirectToConnect('error', 'Missing OAuth code.');
    }

    if (!(await isValidOwnerState(state))) {
      return redirectToConnect('error', 'Invalid owner setup secret.');
    }

    const token = await exchangeCodeForToken({
      clientId: env.STRAVA_CLIENT_ID,
      clientSecret: env.STRAVA_CLIENT_SECRET,
      code,
    });

    if (env.STRAVA_OWNER_ATHLETE_ID && String(token.athlete.id) !== env.STRAVA_OWNER_ATHLETE_ID) {
      return redirectToConnect('error', 'Connected athlete does not match STRAVA_OWNER_ATHLETE_ID.');
    }

    const supabase = createServiceClient();
    await persistToken(supabase, token);
    await syncStravaData({
      syncType: 'oauth-bootstrap',
      requestedBy: 'oauth-callback',
    });

    return redirectToConnect('success', 'Strava connected.');
  } catch (error) {
    console.error(error);
    return redirectToConnect('error', error instanceof Error ? error.message : 'OAuth callback failed.');
  }
});
