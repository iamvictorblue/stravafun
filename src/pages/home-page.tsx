import { Mountain, Route, Timer } from 'lucide-react';
import { ActivityCard } from '@/components/activity/activity-card';
import { ActivityBreakdownChart } from '@/components/charts/activity-breakdown-chart';
import { DistanceTrendChart } from '@/components/charts/distance-trend-chart';
import { ProfileHero } from '@/components/home/profile-hero';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionShell } from '@/components/ui/section-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { useDashboardOverview, useRecentActivities } from '@/hooks/use-dashboard';
import { useAggregatedStats, useBreakdownStats } from '@/hooks/use-stats';
import { formatDistance, formatElevation, formatMovingTime } from '@/lib/format';

export const HomePage = () => {
  const overviewQuery = useDashboardOverview();
  const recentActivitiesQuery = useRecentActivities(6);
  const monthlyStatsQuery = useAggregatedStats('month');
  const breakdownQuery = useBreakdownStats();

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

  return (
    <div className="stack-xl">
      <ProfileHero overview={overview} />

      <div className="stats-grid">
        <StatCard
          label="Total distance"
          value={overview.total_distance_meters ?? 0}
          formatter={formatDistance}
          accent="#ff8f4d"
          subtitle="Across all synced activities"
        />
        <StatCard
          label="Elevation gain"
          value={overview.total_elevation_gain ?? 0}
          formatter={formatElevation}
          accent="#7cd6a4"
          subtitle="Collected one climb at a time"
        />
        <StatCard
          label="Moving time"
          value={overview.total_moving_time_seconds ?? 0}
          formatter={formatMovingTime}
          accent="#66c5ff"
          subtitle="Focused hours in motion"
        />
        <StatCard
          label="Activity count"
          value={overview.activity_count ?? 0}
          accent="#b07cff"
          subtitle="Publicly visible sessions"
        />
      </div>

      <SectionShell
        eyebrow="Fresh from the feed"
        title="Recent activity pulse"
        description="A compact timeline of the latest rides, runs, and everything in between."
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

      <div className="two-column-grid">
        <DistanceTrendChart
          title="Monthly volume"
          granularity="month"
          stats={monthlyStatsQuery.data?.slice(-12) ?? []}
        />
        <ActivityBreakdownChart stats={breakdownQuery.data ?? []} />
      </div>

      <SectionShell
        eyebrow="Signature metrics"
        title="What the archive is saying"
        description="A fast visual summary of how distance, time, and elevation stack together."
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
