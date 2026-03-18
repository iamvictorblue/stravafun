import { corsHeaders, json } from '../_shared/cors.ts';
import { ensureValidToken, requireAuthorizedRequest } from '../_shared/sync.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    requireAuthorizedRequest(request);
    const token = await ensureValidToken();
    return json({
      athleteId: token.athlete_id,
      expiresAt: token.expires_at,
      refreshed: true,
    });
  } catch (error) {
    console.error(error);
    return json(
      {
        error: error instanceof Error ? error.message : 'Token refresh failed.',
      },
      { status: 401 },
    );
  }
});
