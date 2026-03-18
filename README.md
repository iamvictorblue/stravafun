# Strava Public Dashboard

A production-minded, single-owner Strava dashboard built with React, Vite, TypeScript, Supabase, and Netlify.

The public site is anonymous. Visitors never log in to Strava. Only the owner connects Strava privately once, and all public reads come from Supabase.

## Architecture Overview

1. Frontend
   React + Vite + TypeScript on Netlify.
   Public pages query Supabase with the anon key and only read safe tables/views.

2. Backend
   Supabase Postgres stores athletes, activities, aggregates, streams, tokens, and sync logs.
   Supabase Edge Functions handle OAuth callback, token refresh, daily sync, and manual sync.

3. Strava flow
   The owner visits `/connect`, enters `OWNER_SETUP_SECRET`, and is redirected to Strava OAuth.
   Strava redirects back to `strava-oauth-callback`.
   The callback exchanges the code for tokens, stores them securely in `strava_tokens`, and triggers an initial sync.

4. Public data flow
   The dashboard reads from:
   `dashboard_overview`
   `activities`
   `aggregated_stats`
   `activity_streams`

5. Security model
   `strava_tokens` and `sync_logs` are never exposed publicly.
   RLS allows anonymous read access only to safe dashboard data.
   All writes happen with the Supabase service role inside Edge Functions.

## Stack

- React 19
- Vite 8
- TypeScript
- Supabase
- Recharts
- Leaflet + React Leaflet
- Framer Motion
- Netlify

## Folder Structure

```text
.
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ hooks/
│  ├─ lib/
│  ├─ pages/
│  ├─ styles/
│  └─ types/
├─ supabase/
│  ├─ config.toml
│  ├─ functions/
│  │  ├─ _shared/
│  │  ├─ strava-daily-sync/
│  │  ├─ strava-manual-sync/
│  │  ├─ strava-oauth-callback/
│  │  └─ strava-token-refresh/
│  └─ migrations/
├─ netlify.toml
└─ .env.example
```

## Database Schema

The main schema lives in [supabase/migrations/20260318170000_initial_schema.sql](/c:/Users/Victor%20Hernandez/Downloads/stravafun/supabase/migrations/20260318170000_initial_schema.sql).

Tables:

- `strava_tokens`
  Stores private Strava access and refresh tokens plus expiry.
- `athletes`
  Stores the owner athlete profile and raw stats snapshot.
- `activities`
  Stores public-safe activity metadata, map summary polyline, and key metrics.
- `aggregated_stats`
  Stores precomputed all-time, weekly, monthly, and yearly totals.
- `sync_logs`
  Stores sync execution state and errors for private observability.
- `activity_streams`
  Optionally stores `latlng`, `distance`, and `altitude` streams for richer detail pages.

Views:

- `dashboard_overview`
  Safe public profile summary for the homepage.
- `public_sync_status`
  Safe public sync timestamp/status view.

Indexes and aggregate refresh:

- Activity indexes on `(athlete_id, start_date desc)` and `(sport_type, start_date desc)`
- Aggregate index on `(athlete_id, bucket_granularity, bucket_date desc)`
- Sync log indexes for status and recency
- `refresh_aggregated_stats(p_athlete_id bigint)` rebuilds all aggregate windows after each sync

## RLS Policies

Public read-only policies exist on:

- `athletes`
- `activities`
- `activity_streams`
- `aggregated_stats`

No public policies exist on:

- `strava_tokens`
- `sync_logs`

That means anonymous visitors can read only safe dashboard data, while all secure writes remain in Edge Functions using the service role.

## Edge Functions

### `strava-oauth-callback`

- Validates `state` against `OWNER_SETUP_SECRET`
- Exchanges the Strava code for tokens
- Enforces `STRAVA_OWNER_ATHLETE_ID` if configured
- Stores tokens securely
- Triggers an initial sync

### `strava-token-refresh`

- Refreshes the token when requested by an authorized caller
- Useful for operational checks or future admin tooling

### `strava-daily-sync`

- Designed for scheduled invocation
- Refreshes tokens when needed
- Pulls athlete profile, stats, activities, and some stream data
- Upserts records idempotently
- Rebuilds `aggregated_stats`
- Logs sync outcomes

### `strava-manual-sync`

- Allows the owner to trigger a sync manually from `/connect`
- Protected by `x-owner-secret`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy env values:

```bash
cp .env.example .env
```

On PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Fill in:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_TITLE`
- `VITE_STRAVA_CLIENT_ID`
- `VITE_STRAVA_REDIRECT_URI`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI`
- `OWNER_SETUP_SECRET`
- `PUBLIC_SITE_URL`
- `STRAVA_OWNER_ATHLETE_ID`

4. Start the frontend:

```bash
npm run dev
```

5. Apply the migration to Supabase:

```bash
supabase db push
```

6. Deploy Edge Functions:

```bash
supabase functions deploy strava-oauth-callback
supabase functions deploy strava-token-refresh
supabase functions deploy strava-daily-sync
supabase functions deploy strava-manual-sync
```

7. Set function secrets:

```bash
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set STRAVA_CLIENT_ID=...
supabase secrets set STRAVA_CLIENT_SECRET=...
supabase secrets set STRAVA_REDIRECT_URI=...
supabase secrets set OWNER_SETUP_SECRET=...
supabase secrets set PUBLIC_SITE_URL=...
supabase secrets set STRAVA_OWNER_ATHLETE_ID=...
supabase secrets set STRAVA_SYNC_MAX_PAGES=25
```

## Strava App Setup

Create a Strava API application and configure:

- Authorization callback domain:
  your Supabase project domain
- Authorization callback URL:
  `https://<your-project-ref>.supabase.co/functions/v1/strava-oauth-callback`

Recommended scope for this app:

- `read`
- `profile:read_all`
- `activity:read_all`

## Owner Setup Flow

1. Deploy the frontend and functions.
2. Open `/connect` on the deployed site.
3. Enter `OWNER_SETUP_SECRET`.
4. Click `Connect with Strava`.
5. Authorize your Strava account.
6. The callback stores tokens and runs the initial sync.

## Scheduled Sync

Use the Supabase dashboard to schedule the `strava-daily-sync` function once per day.

Recommended schedule:

- daily at `05:15 UTC`

Recommended request headers:

- `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
- `Content-Type: application/json`

Recommended body:

```json
{ "source": "scheduler" }
```

This project intentionally does not use Netlify Functions or a custom Express server.

## Netlify Deployment

1. Create a new Netlify site from this repo/folder.
2. Set build command:
   `npm run build`
3. Set publish directory:
   `dist`
4. Add frontend env vars in Netlify:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_ANON_KEY`
   `VITE_SITE_TITLE`
   `VITE_STRAVA_CLIENT_ID`
   `VITE_STRAVA_REDIRECT_URI`
5. Deploy.

`netlify.toml` already includes SPA redirects so direct page loads like `/activities/123` work correctly.

## Production Notes

- The public app never calls Strava directly.
- Strava secrets and refresh tokens never enter the browser.
- The owner setup secret is turned into a short-lived signed OAuth `state` token instead of being sent raw.
- Sync writes are idempotent through upserts.
- Activity streams are limited to the newest mapped activities in each sync to keep API usage reasonable.
- The frontend uses lazy-loaded routes to keep the first load smaller.

## Verification

Production build currently passes:

```bash
npm run build
```

## Future Improvements

- Add photo highlights and richer athlete storytelling sections
- Add yearly heatmaps and streak visualizations
- Add a small private admin console backed by Supabase Auth
- Add background jobs for backfilling old stream data
- Add route simplification and static map thumbnails for faster list views
- Add multi-athlete support with tenant-aware RLS and owner roles
