import { useState } from 'react';
import { ActivityCard } from '@/components/activity/activity-card';
import { ActivityFilters } from '@/components/activity/activity-filters';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionShell } from '@/components/ui/section-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivities } from '@/hooks/use-activities';
import type { ActivityFiltersState } from '@/types/domain';

const defaultFilters: ActivityFiltersState = {
  page: 0,
  search: '',
  sportType: 'all',
};

export const ActivitiesPage = () => {
  const [filters, setFilters] = useState<ActivityFiltersState>(defaultFilters);
  const activitiesQuery = useActivities(filters);

  return (
    <div className="stack-xl">
      <SectionShell
        eyebrow="Living archive"
        title="Activities"
        description="Filter the feed by sport and dive into any session for route and effort details."
      >
        <ActivityFilters filters={filters} onChange={setFilters} />

        {activitiesQuery.isLoading ? (
          <div className="activity-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="activity-skeleton" />
            ))}
          </div>
        ) : activitiesQuery.data?.data.length ? (
          <>
            <div className="activity-grid">
              {activitiesQuery.data.data.slice(0, 12).map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>

            <div className="pagination-row">
              <button
                type="button"
                className="ghost-button"
                disabled={filters.page === 0}
                onClick={() => setFilters((current) => ({ ...current, page: Math.max(0, current.page - 1) }))}
              >
                Previous
              </button>
              <span>Page {filters.page + 1}</span>
              <button
                type="button"
                className="ghost-button"
                disabled={(activitiesQuery.data.data?.length ?? 0) <= 12}
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <EmptyState title="No matches" description="Try a different sport or a wider search." />
        )}
      </SectionShell>
    </div>
  );
};
