# Apple Health → Site Sync (iOS Shortcuts)

Strava's API now requires a paid subscription, so the site imports workouts
directly from Apple Health instead. A Shortcut on your iPhone posts each
workout to the `apple-health-import` Supabase edge function, which writes it
into the same `activities` table the dashboard already reads. Re-sending the
same workout is safe — imports are deduplicated by start time.

## 1. Create the Shortcut

Open the **Shortcuts** app → **+** to create a new shortcut, name it
**Sync Workouts**, and add these actions in order:

### Action 1 — Find Workouts

Search for the **Find Workouts** action (from the Health app) and add it.
Configure its filter:

- Tap **Add Filter** → **Start Date** → **is in the last** → **7 days**
- Leave Sort by / Limit off

> For the **first run only**, set this to **is in the last 60 days** so it
> backfills everything missing since June 5th, then change it back to 7 days.

### Action 2 — Repeat with Each

Add a **Repeat with Each** action. Set its input to the **Workouts** result
from Action 1. Everything below goes **inside** the repeat block.

### Action 3 — Get Contents of URL (inside the repeat)

Add a **Get Contents of URL** action and expand **Show More**:

- **URL:** `https://xmtaaiafldftfopjjjau.supabase.co/functions/v1/apple-health-import`
- **Method:** `POST`
- **Headers:** add one header:
  - Key: `x-owner-secret`
  - Value: *(the `OWNER_SETUP_SECRET` value from your `.env` file)*
- **Request Body:** `JSON`, then add these fields. For each value, tap the
  field, choose **Select Variable** → **Repeat Item**, then tap the inserted
  variable and pick the detail listed below:

| Key (type Text) | Value → Repeat Item detail |
|---|---|
| `type` | **Workout Type** |
| `start` | **Start Date** — tap the variable again, set **Date Format: ISO 8601** and turn **ISO 8601 Time** on |
| `end` | **End Date** — same ISO 8601 formatting |
| `duration` | **Duration** |
| `distance` | **Distance** (leave as-is; the unit is parsed from the text) |
| `activeEnergy` | **Active Energy** |
| `elevation` | **Elevation Ascended** (add if offered) |
| `avgHeartRate` | **Average Heart Rate** (add if offered) |

That's it — three actions total.

## 2. Test it

Run the Shortcut manually once. The first time, iOS asks for permission to
access Health data (allow Workouts) and to contact the Supabase domain —
approve both. Then open the site: the workouts should appear within a few
seconds (pull-to-refresh / reload the page).

## 3. Automate it

In Shortcuts go to **Automation** → **+** → **Time of Day**:

- Pick a time you're usually done working out (e.g. 9:00 PM), repeat **Daily**
- Select **Run Immediately** (so it doesn't ask for confirmation)
- Choose the **Sync Workouts** shortcut

The Shortcut looks back 7 days on every run and duplicates are ignored, so
missed days catch themselves up automatically.

## Notes

- Calories shown on the site come straight from Apple's **Active Energy** —
  real measurements from the watch, no more estimates.
- GPS route maps aren't available through Shortcuts, so new activities won't
  have maps on the detail page. Old Strava-synced activities keep theirs.
- Endpoint errors are logged to the `sync_logs` table in Supabase
  (`sync_type = 'apple-health'`) if you ever need to debug.
