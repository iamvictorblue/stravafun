import { Search } from 'lucide-react';
import { activityFilters } from '@/lib/constants';
import type { ActivityFilter, ActivityFiltersState } from '@/types/domain';

type ActivityFiltersProps = {
  filters: ActivityFiltersState;
  onChange: (next: ActivityFiltersState) => void;
};

export const ActivityFilters = ({ filters, onChange }: ActivityFiltersProps) => (
  <div className="activity-filters">
    <label className="search-input">
      <Search size={16} />
      <input
        value={filters.search}
        onChange={(event) => onChange({ ...filters, page: 0, search: event.target.value })}
        placeholder="Search by activity name"
        aria-label="Search activities"
      />
    </label>

    <div className="filter-pills" role="tablist" aria-label="Filter by activity type">
      {activityFilters.map((filter) => (
        <button
          key={filter}
          type="button"
          className={`filter-pill ${filters.sportType === filter ? 'is-active' : ''}`}
          onClick={() => onChange({ ...filters, page: 0, sportType: filter as ActivityFilter })}
        >
          {filter}
        </button>
      ))}
    </div>
  </div>
);
