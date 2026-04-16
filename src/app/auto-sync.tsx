import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const AUTO_SYNC_SESSION_KEY = 'stravafun:auto-sync-at';
const AUTO_SYNC_ATTEMPT_INTERVAL_MS = 30 * 60 * 1000;

const getFunctionsBaseUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  if (!supabaseUrl) return '';
  return `${supabaseUrl}/functions/v1`;
};

type AutoSyncResponse = {
  status?: 'fresh' | 'not-configured' | 'running' | 'synced';
  triggered?: boolean;
};

export const AutoSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const functionsBaseUrl = getFunctionsBaseUrl();
    if (!functionsBaseUrl || typeof window === 'undefined') {
      return;
    }

    const lastAttempt = Number(window.sessionStorage.getItem(AUTO_SYNC_SESSION_KEY) ?? '0');
    if (Date.now() - lastAttempt < AUTO_SYNC_ATTEMPT_INTERVAL_MS) {
      return;
    }

    window.sessionStorage.setItem(AUTO_SYNC_SESSION_KEY, String(Date.now()));

    let cancelled = false;

    const run = async () => {
      try {
        const response = await fetch(`${functionsBaseUrl}/strava-public-sync`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ source: 'public-app' }),
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json().catch(() => null)) as AutoSyncResponse | null;
        if (cancelled || !payload?.triggered) {
          return;
        }

        await queryClient.invalidateQueries();
      } catch {
        // Auto-sync is best-effort and should never block the public UI.
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  return null;
};
