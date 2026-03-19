import { ActivityBreakdownChart } from '@/components/charts/activity-breakdown-chart';
import { DistanceTrendChart } from '@/components/charts/distance-trend-chart';
import { YearlyHeatmap } from '@/components/charts/yearly-heatmap';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionShell } from '@/components/ui/section-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { useAggregatedStats, useBreakdownStats, useHeatmapActivities } from '@/hooks/use-stats';
import { formatDistance, formatElevation, formatMovingTime } from '@/lib/format';

export const StatsPage = () => {
  const weeklyQuery = useAggregatedStats('week');
  const monthlyQuery = useAggregatedStats('month');
  const yearlyQuery = useAggregatedStats('year');
  const breakdownQuery = useBreakdownStats();
  const heatmapQuery = useHeatmapActivities();

  if (weeklyQuery.isLoading || monthlyQuery.isLoading || yearlyQuery.isLoading || heatmapQuery.isLoading) {
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

  return (
    <div className="stack-xl">
      <SectionShell
        eyebrow="Rolling windows"
        title="Training totals"
        description="A clean read on what this week, month, and year look like in motion."
      >
        <div className="stats-grid">
          <article className="mini-stat-card">
            <p>This week</p>
            <strong>{formatDistance(currentWeek?.total_distance_meters)}</strong>
            <span>{formatMovingTime(currentWeek?.total_moving_time_seconds)}</span>
          </article>
          <article className="mini-stat-card">
            <p>This month</p>
            <strong>{formatDistance(currentMonth?.total_distance_meters)}</strong>
            <span>{formatElevation(currentMonth?.total_elevation_gain)}</span>
          </article>
          <article className="mini-stat-card">
            <p>This year</p>
            <strong>{formatDistance(currentYear?.total_distance_meters)}</strong>
            <span>{currentYear?.activity_count ?? 0} activities</span>
          </article>
        </div>
      </SectionShell>

      <DistanceTrendChart title="Weekly rhythm" granularity="week" stats={weeklyQuery.data?.slice(-10) ?? []} />
      <DistanceTrendChart title="Yearly arc" granularity="year" stats={yearlyQuery.data ?? []} />
      <YearlyHeatmap activities={heatmapQuery.data ?? []} />
      <ActivityBreakdownChart stats={breakdownQuery.data ?? []} />
    </div>
  );
};
