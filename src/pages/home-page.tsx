import { addDays, format as formatDate, parseISO, startOfDay, subDays, subYears } from 'date-fns';
import { ArrowUpRight, Mountain, Route, Timer } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ActivityCard } from '@/components/activity/activity-card';
import { ActivityBreakdownChart } from '@/components/charts/activity-breakdown-chart';
import { DistanceTrendChart } from '@/components/charts/distance-trend-chart';
import { ProfileHero } from '@/components/home/profile-hero';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionShell } from '@/components/ui/section-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { useActivitySpotlights, useDashboardOverview, useRecentActivities } from '@/hooks/use-dashboard';
import { useAggregatedStats, useBreakdownStats, useCalorieActivities, useHeatmapActivities } from '@/hooks/use-stats';
import { summarizeCalorieActivities } from '@/lib/calories';
import {
  formatActivityDate,
  formatCalories,
  formatDistance,
  formatElevation,
  formatMovingTime,
  getActivityAccent,
} from '@/lib/format';
import type { Activity, AggregatedStat, HeatmapActivity } from '@/types/domain';

const formatCount = (value: number) => Math.round(value).toLocaleString();

const describeChange = (
  current: number | null | undefined,
  previous: number | null | undefined,
  formatter: (value: number) => string,
  periodLabel: string,
) => {
  const currentValue = current ?? 0;

  if (previous == null) {
    return `First tracked ${periodLabel}`;
  }

  const delta = currentValue - previous;
  if (delta === 0) {
    return `Matching last ${periodLabel}`;
  }

  return `${delta > 0 ? 'Up' : 'Down'} ${formatter(Math.abs(delta))} vs last ${periodLabel}`;
};

const summarizeStreak = (activities: HeatmapActivity[]) => {
  const activeDayKeys = new Set(
    activities.map((activity) => formatDate(startOfDay(parseISO(activity.start_date)), 'yyyy-MM-dd')),
  );

  const activeDays = activeDayKeys.size;
  const today = startOfDay(new Date());
  let cursor = activeDayKeys.has(formatDate(today, 'yyyy-MM-dd')) ? today : subDays(today, 1);
  let currentStreak = 0;

  while (activeDayKeys.has(formatDate(cursor, 'yyyy-MM-dd'))) {
    currentStreak += 1;
    cursor = subDays(cursor, 1);
  }

  return {
    activeDays,
    currentStreak,
  };
};

const formatSignedDelta = (delta: number, formatter: (value: number) => string) => {
  if (delta === 0) {
    return 'Flat';
  }

  return `${delta > 0 ? '+' : '-'}${formatter(Math.abs(delta))}`;
};

const describePercentChange = (current: number, previous: number, label: string) => {
  if (previous <= 0) {
    return `No baseline for ${label} yet`;
  }

  const delta = ((current - previous) / previous) * 100;
  if (!Number.isFinite(delta) || Math.round(delta) === 0) {
    return `Tracking evenly with ${label}`;
  }

  return `${delta > 0 ? '+' : ''}${Math.round(delta)}% distance vs ${label}`;
};

const formatWeekRange = (bucketDate: string) => {
  const start = parseISO(bucketDate);
  const end = addDays(start, 6);
  return `${formatDate(start, 'MMM d')} - ${formatDate(end, 'MMM d')}`;
};

type ComparisonCardData = {
  title: string;
  headline: string;
  detail: string;
  rows: Array<{ label: string; value: string }>;
};

const buildComparisonCard = (
  currentMonth: AggregatedStat | undefined,
  baselineMonth: AggregatedStat | undefined,
  title: string,
  baselineLabel: string,
): ComparisonCardData | null => {
  if (!currentMonth) {
    return null;
  }

  if (!baselineMonth) {
    return {
      title,
      headline: formatDistance(currentMonth.total_distance_meters),
      detail: `Need more history to compare with ${baselineLabel}.`,
      rows: [
        { label: 'Moving time', value: formatMovingTime(currentMonth.total_moving_time_seconds) },
        { label: 'Activities', value: formatCount(currentMonth.activity_count) },
        { label: 'Elevation', value: formatElevation(currentMonth.total_elevation_gain) },
      ],
    };
  }

  return {
    title,
    headline: formatSignedDelta(currentMonth.total_distance_meters - baselineMonth.total_distance_meters, formatDistance),
    detail: describePercentChange(currentMonth.total_distance_meters, baselineMonth.total_distance_meters, baselineLabel),
    rows: [
      {
        label: 'Moving time',
        value: formatSignedDelta(currentMonth.total_moving_time_seconds - baselineMonth.total_moving_time_seconds, formatMovingTime),
      },
      {
        label: 'Activities',
        value: formatSignedDelta(currentMonth.activity_count - baselineMonth.activity_count, formatCount),
      },
      {
        label: 'Elevation',
        value: formatSignedDelta(currentMonth.total_elevation_gain - baselineMonth.total_elevation_gain, formatElevation),
      },
    ],
  };
};

const findSameMonthLastYear = (currentMonth: AggregatedStat | undefined, monthlyStats: AggregatedStat[]) => {
  if (!currentMonth) {
    return undefined;
  }

  const targetMonthKey = formatDate(subYears(parseISO(currentMonth.bucket_date), 1), 'yyyy-MM');
  return monthlyStats.find((entry) => entry.bucket_date.startsWith(targetMonthKey));
};

type SpotlightCardData = {
  activity: Activity;
  accent: ReturnType<typeof getActivityAccent>;
  eyebrow: string;
  primaryValue: string;
  secondaryMetrics: [string, string];
};

const buildSpotlightCards = (
  activities:
    | {
        biggestBurn: Activity | null;
        biggestClimb: Activity | null;
        longestDistance: Activity | null;
        longestSession: Activity | null;
      }
    | undefined,
): SpotlightCardData[] => {
  if (!activities) {
    return [];
  }

  const items = [
    {
      activity: activities.longestDistance,
      eyebrow: 'Longest day',
      primaryValue: activities.longestDistance ? formatDistance(activities.longestDistance.distance_meters) : '',
      secondaryMetrics: activities.longestDistance
        ? [formatMovingTime(activities.longestDistance.moving_time_seconds), formatElevation(activities.longestDistance.total_elevation_gain)]
        : ['0h', '0 m'],
    },
    {
      activity: activities.biggestClimb,
      eyebrow: 'Biggest climb',
      primaryValue: activities.biggestClimb ? formatElevation(activities.biggestClimb.total_elevation_gain) : '',
      secondaryMetrics: activities.biggestClimb
        ? [formatDistance(activities.biggestClimb.distance_meters), formatMovingTime(activities.biggestClimb.moving_time_seconds)]
        : ['0 km', '0h'],
    },
    {
      activity: activities.biggestBurn ?? activities.longestSession,
      eyebrow: activities.biggestBurn ? 'Biggest burn' : 'Longest session',
      primaryValue: activities.biggestBurn
        ? formatCalories(activities.biggestBurn.kilojoules)
        : activities.longestSession
          ? formatMovingTime(activities.longestSession.moving_time_seconds)
          : '',
      secondaryMetrics: activities.biggestBurn
        ? [formatDistance(activities.biggestBurn.distance_meters), formatMovingTime(activities.biggestBurn.moving_time_seconds)]
        : activities.longestSession
          ? [formatDistance(activities.longestSession.distance_meters), formatElevation(activities.longestSession.total_elevation_gain)]
        : ['0 km', '0 m'],
    },
  ];

  return items
    .filter((item): item is Omit<SpotlightCardData, 'accent'> & { activity: Activity } => Boolean(item.activity))
    .map((item) => ({
      ...item,
      accent: getActivityAccent(item.activity.sport_type),
    }));
};

const buildWeeklyRecap = (params: {
  currentWeek: AggregatedStat | undefined;
  recentActivities: Activity[];
  streakDays: number;
  displayName?: string | null;
  weekCalories: number;
}) => {
  const { currentWeek, recentActivities, streakDays, displayName, weekCalories } = params;

  if (!currentWeek) {
    return null;
  }

  const weekStart = startOfDay(parseISO(currentWeek.bucket_date));
  const weekEnd = addDays(weekStart, 6);
  const weeklyActivities = recentActivities.filter((activity) => {
    const activityDate = startOfDay(parseISO(activity.start_date));
    return activityDate >= weekStart && activityDate <= weekEnd;
  });
  const highlight = weeklyActivities.reduce<Activity | null>((best, activity) => {
    if (!best) return activity;
    return activity.distance_meters > best.distance_meters ? activity : best;
  }, null);
  const athleteName = displayName?.trim() || 'This week';

  const shareText = [
    `${athleteName} recap for ${formatWeekRange(currentWeek.bucket_date)}:`,
    `${formatDistance(currentWeek.total_distance_meters)} across ${formatCount(currentWeek.activity_count)} activities.`,
    weekCalories > 0
      ? `${formatMovingTime(currentWeek.total_moving_time_seconds)} moving, ${formatElevation(currentWeek.total_elevation_gain)} climbed, and ${formatCalories(weekCalories)} burned.`
      : `${formatMovingTime(currentWeek.total_moving_time_seconds)} moving and ${formatElevation(currentWeek.total_elevation_gain)} climbed.`,
    streakDays > 0 ? `${formatCount(streakDays)} day streak still alive.` : 'Fresh week, fresh block.',
    highlight ? `Highlight: ${highlight.name} (${formatDistance(highlight.distance_meters)}).` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    rangeLabel: formatWeekRange(currentWeek.bucket_date),
    shareText,
    highlight,
  };
};

export const HomePage = () => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const overviewQuery = useDashboardOverview();
  const recentActivitiesQuery = useRecentActivities(6);
  const activitySpotlightsQuery = useActivitySpotlights();
  const weeklyStatsQuery = useAggregatedStats('week');
  const monthlyStatsQuery = useAggregatedStats('month');
  const breakdownQuery = useBreakdownStats();
  const calorieQuery = useCalorieActivities();
  const heatmapQuery = useHeatmapActivities();
  const streakSummary = summarizeStreak(heatmapQuery.data ?? []);
  const calorieSummary = summarizeCalorieActivities(calorieQuery.data ?? []);

  if (overviewQuery.isLoading) {
    return (
      <div className="stack-lg">
        <Skeleton className="hero-skeleton" />
        <div className="stats-grid">
          <Skeleton className="stat-skeleton" />
          <Skeleton className="stat-skeleton" />
          <Skeleton className="stat-skeleton" />
          <Skeleton className="stat-skeleton" />
        </div>
        <div className="two-column-grid">
          <Skeleton className="chart-skeleton" />
          <Skeleton className="chart-skeleton" />
        </div>
      </div>
    );
  }

  if (overviewQuery.error) {
    return <EmptyState title="Dashboard unavailable" description="The public dataset could not be loaded from Supabase." />;
  }

  if (!overviewQuery.data) {
    return <EmptyState title="No athlete data yet" description="Run the private Strava sync once and the dashboard will bloom here." />;
  }

  const overview = overviewQuery.data;
  const currentWeek = weeklyStatsQuery.data?.at(-1);
  const previousWeek = weeklyStatsQuery.data?.at(-2);
  const currentMonth = monthlyStatsQuery.data?.at(-1);
  const previousMonth = monthlyStatsQuery.data?.at(-2);
  const sameMonthLastYear = findSameMonthLastYear(currentMonth, monthlyStatsQuery.data ?? []);
  const statsAreLoading = weeklyStatsQuery.isLoading || monthlyStatsQuery.isLoading;
  const statsUnavailable = weeklyStatsQuery.error || monthlyStatsQuery.error;
  const comparisonCards = [
    buildComparisonCard(
      currentMonth,
      previousMonth,
      'Vs last month',
      previousMonth ? formatDate(parseISO(previousMonth.bucket_date), 'MMMM yyyy') : 'last month',
    ),
    buildComparisonCard(
      currentMonth,
      sameMonthLastYear,
      'Vs same month last year',
      sameMonthLastYear ? formatDate(parseISO(sameMonthLastYear.bucket_date), 'MMMM yyyy') : 'the same month last year',
    ),
  ].filter((card): card is ComparisonCardData => Boolean(card));
  const spotlightCards = buildSpotlightCards(activitySpotlightsQuery.data);
  const weeklyRecap = buildWeeklyRecap({
    currentWeek,
    recentActivities: recentActivitiesQuery.data ?? [],
    streakDays: streakSummary.currentStreak,
    displayName: overview.display_name ?? overview.username,
    weekCalories: calorieSummary.thisWeekCalories,
  });

  const handleCopyWeeklyRecap = async () => {
    if (!weeklyRecap) {
      return;
    }

    try {
      await navigator.clipboard.writeText(weeklyRecap.shareText);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 2500);
    }
  };

  return (
    <div className="stack-xl">
      <ProfileHero overview={overview} calorieSummary={calorieSummary} />

      <SectionShell
        eyebrow="Rolling windows"
        title="Current rhythm"
        description="The home page now leads with calories and current volume so progress feels immediate instead of archival."
      >
        {statsAreLoading ? (
          <div className="stats-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="stat-skeleton" />
            ))}
          </div>
        ) : statsUnavailable ? (
          <EmptyState
            title="Recent totals unavailable"
            description="Weekly and monthly aggregates could not be loaded from Supabase."
          />
        ) : (
          <div className="stats-grid">
            <StatCard
              label="This week calories"
              value={calorieSummary.thisWeekCalories}
              formatter={formatCalories}
              accent="#66c5ff"
              subtitle={
                calorieQuery.isLoading
                  ? 'Reading calorie burn from synced activities'
                  : calorieQuery.error
                    ? 'Calorie totals unavailable right now'
                    : calorieSummary.thisWeekActivities
                      ? `${formatCount(calorieSummary.thisWeekActivities)} calorie-tracked activities this week`
                      : 'No calorie-tracked activities this week'
              }
            />
            <StatCard
              label="This week distance"
              value={currentWeek?.total_distance_meters ?? 0}
              formatter={formatDistance}
              accent="#ff8f4d"
              subtitle={describeChange(
                currentWeek?.total_distance_meters,
                previousWeek?.total_distance_meters,
                formatDistance,
                'week',
              )}
            />
            <StatCard
              label="This month calories"
              value={calorieSummary.thisMonthCalories}
              formatter={formatCalories}
              accent="#7cd6a4"
              subtitle={
                calorieQuery.isLoading
                  ? 'Building this month calorie snapshot'
                  : calorieQuery.error
                    ? 'Monthly calorie totals unavailable'
                    : calorieSummary.thisMonthActivities
                      ? `${formatCount(calorieSummary.thisMonthActivities)} calorie-tracked activities this month`
                      : 'No calorie-tracked activities this month'
              }
            />
            <StatCard
              label="Current streak"
              value={streakSummary.currentStreak}
              formatter={formatCount}
              accent="#b07cff"
              subtitle={
                heatmapQuery.isLoading
                  ? 'Reading the last year of activity'
                  : heatmapQuery.error
                    ? 'Streak data unavailable right now'
                    : `${formatCount(streakSummary.activeDays)} active days in the last year`
              }
            />
          </div>
        )}
      </SectionShell>

      {statsAreLoading ? (
        <div className="two-column-grid">
          <Skeleton className="chart-skeleton" />
          <Skeleton className="chart-skeleton" />
        </div>
      ) : statsUnavailable ? null : (
        <div className="two-column-grid">
          <DistanceTrendChart title="Weekly rhythm" granularity="week" stats={weeklyStatsQuery.data?.slice(-10) ?? []} />
          <DistanceTrendChart
            title="Monthly volume"
            granularity="month"
            stats={monthlyStatsQuery.data?.slice(-12) ?? []}
          />
        </div>
      )}

      <SectionShell
        eyebrow="Shareable recap"
        title="Weekly flex card"
        description="A ready-to-share summary for the current training week, with one tap to copy the caption."
        actions={
          weeklyRecap ? (
            <button type="button" className="primary-button" onClick={handleCopyWeeklyRecap}>
              {copyState === 'copied' ? 'Copied recap' : copyState === 'error' ? 'Copy failed' : 'Copy weekly recap'}
            </button>
          ) : null
        }
      >
        {statsAreLoading ? (
          <Skeleton className="chart-skeleton" />
        ) : statsUnavailable || !weeklyRecap ? (
          <EmptyState
            title="Weekly recap unavailable"
            description="Once weekly aggregates are available, a share-ready recap card will appear here."
          />
        ) : (
          <article className="weekly-recap-card">
            <div className="weekly-recap-card__header">
              <div>
                <p className="weekly-recap-card__eyebrow">{weeklyRecap.rangeLabel}</p>
                <h3>{overview.display_name ?? overview.username ?? 'Training week'} in one snapshot</h3>
              </div>
              <strong className="weekly-recap-card__distance">{formatDistance(currentWeek?.total_distance_meters ?? 0)}</strong>
            </div>

            <div className="weekly-recap-card__stats">
              <article>
                <span>Activities</span>
                <strong>{formatCount(currentWeek?.activity_count ?? 0)}</strong>
              </article>
              <article>
                <span>Moving time</span>
                <strong>{formatMovingTime(currentWeek?.total_moving_time_seconds ?? 0)}</strong>
              </article>
              <article>
                <span>Elevation</span>
                <strong>{formatElevation(currentWeek?.total_elevation_gain ?? 0)}</strong>
              </article>
              <article>
                <span>Calories</span>
                <strong>
                  {calorieSummary.thisWeekActivities ? formatCalories(calorieSummary.thisWeekCalories) : 'No calorie data'}
                </strong>
              </article>
            </div>

            <div className="weekly-recap-card__footer">
              <p>{weeklyRecap.shareText}</p>
              {weeklyRecap.highlight ? (
                <Link to={`/activities/${weeklyRecap.highlight.id}`} className="ghost-button">
                  Highlight: {weeklyRecap.highlight.name}
                  <ArrowUpRight size={16} />
                </Link>
              ) : null}
            </div>
          </article>
        )}
      </SectionShell>

      <SectionShell
        eyebrow="Month in context"
        title="How this month stacks up"
        description="A quick read on whether the current month is building, holding, or backing off compared with your recent history."
      >
        {statsAreLoading ? (
          <div className="comparison-grid">
            <Skeleton className="chart-skeleton" />
            <Skeleton className="chart-skeleton" />
          </div>
        ) : statsUnavailable || !comparisonCards.length ? (
          <EmptyState
            title="Comparison view unavailable"
            description="There is not enough monthly history yet to build comparison cards."
          />
        ) : (
          <div className="comparison-grid">
            {comparisonCards.map((card) => (
              <article key={card.title} className="comparison-card">
                <p className="comparison-card__eyebrow">{card.title}</p>
                <strong className="comparison-card__headline">{card.headline}</strong>
                <p className="comparison-card__detail">{card.detail}</p>
                <div className="comparison-card__rows">
                  {card.rows.map((row) => (
                    <div key={row.label} className="comparison-card__row">
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionShell>

      <SectionShell
        eyebrow="Best efforts"
        title="Standout sessions"
        description="A little trophy shelf for the biggest day, biggest climb, and longest session in the archive."
      >
        {activitySpotlightsQuery.isLoading ? (
          <div className="spotlight-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="activity-skeleton" />
            ))}
          </div>
        ) : activitySpotlightsQuery.error || !spotlightCards.length ? (
          <EmptyState
            title="Spotlights unavailable"
            description="Once enough activities are synced, standout efforts will appear here."
          />
        ) : (
          <div className="spotlight-grid">
            {spotlightCards.map((card) => (
              <article
                key={`${card.eyebrow}-${card.activity.id}`}
                className="spotlight-card"
                style={
                  {
                    '--spotlight-gradient': card.accent.soft,
                    '--spotlight-glow': card.accent.glow,
                    '--spotlight-solid': card.accent.solid,
                  } as CSSProperties
                }
              >
                <p className="spotlight-card__eyebrow">{card.eyebrow}</p>
                <h3>{card.activity.name}</h3>
                <strong className="spotlight-card__value">{card.primaryValue}</strong>
                <p className="spotlight-card__meta">
                  {card.activity.sport_type} / {formatActivityDate(card.activity.start_date)}
                </p>
                <div className="spotlight-card__stats">
                  <span>{card.secondaryMetrics[0]}</span>
                  <span>{card.secondaryMetrics[1]}</span>
                </div>
                <Link to={`/activities/${card.activity.id}`} className="ghost-button">
                  View activity
                  <ArrowUpRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </SectionShell>

      <SectionShell
        eyebrow="Fresh from the feed"
        title="Recent activity pulse"
        description="The latest sessions still sit close by, but now they support the week and month story instead of leading it."
      >
        {recentActivitiesQuery.isLoading ? (
          <div className="activity-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="activity-skeleton" />
            ))}
          </div>
        ) : recentActivitiesQuery.data?.length ? (
          <div className="activity-grid">
            {recentActivitiesQuery.data.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <EmptyState title="No recent activities" description="Once the first sync lands, recent sessions will appear here." />
        )}
      </SectionShell>

      <ActivityBreakdownChart stats={breakdownQuery.data ?? []} />

      <SectionShell
        eyebrow="Archive recap"
        title="Lifetime totals"
        description="The big-picture numbers are still here, just lower in the flow so the homepage feels more alive."
      >
        <div className="signature-grid">
          <article className="signature-card">
            <Route size={20} />
            <strong>{formatDistance(overview.total_distance_meters)}</strong>
            <span>Lifetime distance</span>
          </article>
          <article className="signature-card">
            <Mountain size={20} />
            <strong>{formatElevation(overview.total_elevation_gain)}</strong>
            <span>Total vertical</span>
          </article>
          <article className="signature-card">
            <Timer size={20} />
            <strong>{formatMovingTime(overview.total_moving_time_seconds)}</strong>
            <span>Time spent moving</span>
          </article>
        </div>
      </SectionShell>
    </div>
  );
};
