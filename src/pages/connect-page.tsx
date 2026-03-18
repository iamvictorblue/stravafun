import { useMemo, useState, type FormEvent } from 'react';
import { KeyRound, RefreshCcw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { buildStravaAuthorizeUrl } from '@/lib/constants';

const getFunctionsBaseUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  if (!supabaseUrl) return '';
  return `${supabaseUrl}/functions/v1`;
};

export const ConnectPage = () => {
  const [searchParams] = useSearchParams();
  const [setupSecret, setSetupSecret] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const functionsBaseUrl = useMemo(() => getFunctionsBaseUrl(), []);

  const callbackMessage = useMemo(() => {
    const status = searchParams.get('status');
    const detail = searchParams.get('message');
    if (!status) return null;

    return status === 'success'
      ? detail ?? 'Strava connected successfully.'
      : detail ?? 'Something went wrong during the OAuth callback.';
  }, [searchParams]);

  const onConnect = async (event: FormEvent) => {
    event.preventDefault();
    try {
      window.location.href = await buildStravaAuthorizeUrl(setupSecret.trim());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start Strava OAuth.');
    }
  };

  const onManualSync = async () => {
    setMessage('Triggering manual sync...');

    const response = await fetch(`${functionsBaseUrl}/strava-manual-sync`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-owner-secret': setupSecret.trim(),
      },
      body: JSON.stringify({ source: 'owner-console' }),
    });

    const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
    setMessage(payload?.message ?? payload?.error ?? 'Request finished.');
  };

  return (
    <section className="connect-shell">
      <div className="connect-card">
        <p className="eyebrow">Private owner controls</p>
        <h2>Connect Strava once</h2>
        <p>
          This screen is only for the single owner setup flow. Visitors never need to log in and never touch
          Strava directly.
        </p>

        <form className="connect-form" onSubmit={onConnect}>
          <label>
            Owner setup secret
            <div className="connect-input">
              <KeyRound size={16} />
              <input
                type="password"
                required
                value={setupSecret}
                onChange={(event) => setSetupSecret(event.target.value)}
                placeholder="Paste OWNER_SETUP_SECRET"
              />
            </div>
          </label>

          <div className="connect-actions">
            <button type="submit" className="primary-button">
              Connect with Strava
            </button>
            <button type="button" className="ghost-button" onClick={onManualSync} disabled={!setupSecret.trim()}>
              <RefreshCcw size={15} />
              Trigger manual sync
            </button>
          </div>
        </form>

        {message ?? callbackMessage ? <p className="connect-message">{message ?? callbackMessage}</p> : null}
      </div>
    </section>
  );
};
