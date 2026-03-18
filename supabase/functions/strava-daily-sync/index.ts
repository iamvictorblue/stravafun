import { corsHeaders, json } from '../_shared/cors.ts';
import { requireAuthorizedRequest, syncStravaData } from '../_shared/sync.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    requireAuthorizedRequest(request);
    const result = await syncStravaData({
      syncType: 'scheduled',
      requestedBy: 'scheduler',
    });

    return json({
      message: 'Daily sync completed.',
      ...result,
    });
  } catch (error) {
    console.error(error);
    return json(
      {
        error: error instanceof Error ? error.message : 'Daily sync failed.',
      },
      { status: 500 },
    );
  }
});
