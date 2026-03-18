import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { RouteMap } from '@/components/activity/route-map';
import { ActivityStreamChart } from '@/components/charts/activity-stream-chart';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionShell } from '@/components/ui/section-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivityDetail, useActivityStream } from '@/hooks/use-activity-detail';
import { formatActivityDate, formatDistance, formatElevation, formatMovingTime, formatPaceOrSpeed } from '@/lib/format';

export const ActivityDetailPage = () => {
  const params = useParams();
  const activityId = useMemo(() => Number(params.activityId), [params.activityId]);
  const activityQuery = useActivityDetail(activityId);
  const streamQuery = useActivityStream(activityId);

  if (activityQuery.isLoading) {
    return <Skeleton className="detail-skeleton" />;
  }

  if (activityQuery.error || !activityQuery.data) {
    return <EmptyState title="Activity not found" description="This route may not be public or has not been synced yet." />;
  }

  const activity = activityQuery.data;

  return (
    <div className="stack-xl">
      <section className="detail-hero">
        <div>
          <p className="eyebrow">{activity.sport_type}</p>
          <h2>{activity.name}</h2>
          <p className="detail-hero__meta">{formatActivityDate(activity.start_date)}</p>
        </div>
        <div className="detail-hero__chips">
          <span>{formatDistance(activity.distance_meters)}</span>
          <span>{formatPaceOrSpeed(activity)}</span>
          <span>{formatElevation(activity.total_elevation_gain)}</span>
        </div>
      </section>

      <RouteMap activity={activity} stream={streamQuery.data} />

      <div className="stats-grid">
        <article className="mini-stat-card">
          <p>Moving time</p>
          <strong>{formatMovingTime(activity.moving_time_seconds)}</strong>
        </article>
        <article className="mini-stat-card">
          <p>Elevation</p>
          <strong>{formatElevation(activity.total_elevation_gain)}</strong>
        </article>
        <article className="mini-stat-card">
          <p>Speed / pace</p>
          <strong>{formatPaceOrSpeed(activity)}</strong>
        </article>
        <article className="mini-stat-card">
          <p>Kudos</p>
          <strong>{activity.kudos_count ?? 0}</strong>
        </article>
      </div>

      <SectionShell
        eyebrow="Effort shape"
        title="Activity texture"
        description="Route detail and profile data, when the sync has stored stream traces."
      >
        {streamQuery.data ? (
          <ActivityStreamChart stream={streamQuery.data} />
        ) : (
          <EmptyState title="Stream data not synced" description="Enable optional streams and future syncs can render altitude and distance curves here." />
        )}
      </SectionShell>
    </div>
  );
};
