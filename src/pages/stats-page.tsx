import { ActivityBreakdownChart } from '@/components/charts/activity-breakdown-chart';
import { CalorieTrendChart } from '@/components/charts/calorie-trend-chart';
import { DistanceTrendChart } from '@/components/charts/distance-trend-chart';
import { YearlyHeatmap } from '@/components/charts/yearly-heatmap';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionShell } from '@/components/ui/section-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { bucketCaloriesByGranularity, summarizeCalorieActivities } from '@/lib/calories';
import { useAggregatedStats, useBreakdownStats, useCalorieActivities, useHeatmapActivities } from '@/hooks/use-stats';
import { formatCalories, formatDistance, formatElevation, formatMovingTime } from '@/lib/format';

export const StatsPage = () => {
  const weeklyQuery = useAggregatedStats('week');
  const monthlyQuery = useAggregatedStats('month');
  const yearlyQuery = useAggregatedStats('year');
  const breakdownQuery = useBreakdownStats();
  const calorieQuery = useCalorieActivities();
  const heatmapQuery = useHeatmapActivities();

  if (weeklyQuery.isLoading || monthlyQuery.isLoading || yearlyQuery.isLoading || calorieQuery.isLoading || heatmapQuery.isLoading) {
    return (
      <div className="stack-xl">
        <Skeleton className="chart-skeleton" />
        <Skeleton className="chart-skeleton" />
      </div>
    );
  }

  if (weeklyQuery.error || monthlyQuery.error || yearlyQuery.error || heatmapQuery.error) {
    return <EmptyState title="Stats unavailable" description="Aggregated stats could not be loaded from Supabase." />;
  }

  const currentWeek = weeklyQuery.data?.at(-1);
  const currentMonth = monthlyQuery.data?.at(-1);
  const currentYear = yearlyQuery.data?.at(-1);
  const calorieSummary = summarizeCalorieActivities(calorieQuery.data ?? []);
  const monthlyCalorieTrend = bucketCaloriesByGranularity(calorieQuery.data ?? [], 'month', 12);

  return (
    <div className="stack-xl">
      <SectionShell
        eyebrow="Energy output"
        title="Training totals"
        description="Calories now sit alongside the core volume windows so effort is easier to read at a glance."
      >
        {calorieQuery.error || !calorieSummary.trackedActivities ? (
          <EmptyState
            title="Calorie data unavailable"
            description="Once synced activities include energy output, this page will feature weekly, monthly, and yearly calorie totals here."
          />
        ) : (
          <div className="stats-grid">
            <article className="mini-stat-card">
              <p>This week</p>
              <strong>{formatCalories(calorieSummary.thisWeekCalories)}</strong>
              <span>
                {formatDistance(currentWeek?.total_distance_meters)} across {currentWeek?.activity_count ?? 0} activities
              </span>
            </article>
            <article className="mini-stat-card">
              <p>This month</p>
              <strong>{formatCalories(calorieSummary.thisMonthCalories)}</strong>
              <span>
                {formatDistance(currentMonth?.total_distance_meters)} and {formatElevation(currentMonth?.total_elevation_gain)}
              </span>
            </article>
            <article className="mini-stat-card">
              <p>This year</p>
              <strong>{formatCalories(calorieSummary.thisYearCalories)}</strong>
              <span>
                {currentYear?.activity_count ?? 0} activities and {formatMovingTime(currentYear?.total_moving_time_seconds)}
              </span>
            </article>
          </div>
        )}
      </SectionShell>

      <div className="two-column-grid">
        {monthlyCalorieTrend.length ? (
          <CalorieTrendChart title="Monthly burn" granularity="month" stats={monthlyCalorieTrend} />
        ) : (
          <EmptyState
            title="Calorie trend unavailable"
            description="More calorie-tracked activities are needed before a trend can be charted here."
          />
        )}
        <DistanceTrendChart title="Weekly rhythm" granularity="week" stats={weeklyQuery.data?.slice(-10) ?? []} />
      </div>

      <DistanceTrendChart title="Yearly arc" granularity="year" stats={yearlyQuery.data ?? []} />
      <YearlyHeatmap activities={heatmapQuery.data ?? []} />
      <ActivityBreakdownChart stats={breakdownQuery.data ?? []} />
    </div>
  );
};
