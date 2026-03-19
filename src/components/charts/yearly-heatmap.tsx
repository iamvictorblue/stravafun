import { eachDayOfInterval, endOfDay, endOfWeek, format, isSameMonth, parseISO, startOfDay, startOfWeek, subDays } from 'date-fns';
import { Flame, Sparkles } from 'lucide-react';
import { useMemo, type CSSProperties } from 'react';
import { getActivityAccent } from '@/lib/format';
import type { HeatmapActivity } from '@/types/domain';

type YearlyHeatmapProps = {
  activities: HeatmapActivity[];
};

type HeatmapCell = {
  date: Date;
  dateKey: string;
  distanceMeters: number;
  sportType: string;
  isCurrentMonth: boolean;
};

const intensityLevel = (distanceMeters: number) => {
  if (distanceMeters >= 70000) return 4;
  if (distanceMeters >= 35000) return 3;
  if (distanceMeters >= 15000) return 2;
  if (distanceMeters > 0) return 1;
  return 0;
};

const buildHeatmapCells = (activities: HeatmapActivity[]) => {
  const today = endOfDay(new Date());
  const start = startOfWeek(subDays(today, 364), { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });

  const dailyMap = new Map<string, { distanceMeters: number; sportTotals: Record<string, number> }>();

  for (const activity of activities) {
    const activityDate = format(startOfDay(parseISO(activity.start_date)), 'yyyy-MM-dd');
    const current = dailyMap.get(activityDate) ?? { distanceMeters: 0, sportTotals: {} };
    current.distanceMeters += Number(activity.distance_meters ?? 0);
    current.sportTotals[activity.sport_type] = (current.sportTotals[activity.sport_type] ?? 0) + Number(activity.distance_meters ?? 0);
    dailyMap.set(activityDate, current);
  }

  const days = eachDayOfInterval({ start, end });
  const cells = days.map((date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const day = dailyMap.get(dateKey);
    const dominantSport =
      day && Object.keys(day.sportTotals).length
        ? Object.entries(day.sportTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'default'
        : 'default';

    return {
      date,
      dateKey,
      distanceMeters: day?.distanceMeters ?? 0,
      sportType: dominantSport,
      isCurrentMonth: isSameMonth(date, today),
    } satisfies HeatmapCell;
  });

  const columns: HeatmapCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    columns.push(cells.slice(index, index + 7));
  }

  return columns;
};

const formatDistanceKm = (meters: number) => `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;

export const YearlyHeatmap = ({ activities }: YearlyHeatmapProps) => {
  const columns = useMemo(() => buildHeatmapCells(activities), [activities]);

  const summary = useMemo(() => {
    const flatCells = columns.flat();
    const activeDays = flatCells.filter((cell) => cell.distanceMeters > 0);
    const totalDistance = activeDays.reduce((sum, cell) => sum + cell.distanceMeters, 0);
    let currentStreak = 0;
    for (const cell of [...flatCells].reverse()) {
      if (cell.distanceMeters > 0) {
        currentStreak += 1;
      } else if (currentStreak > 0) {
        break;
      }
    }

    return {
      activeDays: activeDays.length,
      totalDistance,
      brightestDay: activeDays.sort((a, b) => b.distanceMeters - a.distanceMeters)[0] ?? null,
      currentStreak,
    };
  }, [columns]);

  return (
    <div className="heatmap-card">
      <div className="heatmap-card__header">
        <div>
          <p className="eyebrow">Consistency canvas</p>
          <h3>Year in motion</h3>
        </div>
        <div className="heatmap-card__summary">
          <span>
            <Flame size={15} />
            {summary.activeDays} active days
          </span>
          <span>
            <Sparkles size={15} />
            {formatDistanceKm(summary.totalDistance)}
          </span>
          <span>{summary.currentStreak} day streak</span>
        </div>
      </div>

      <div className="heatmap-card__meta">
        <p>
          Each pixel marks a day. Brighter cells mean bigger sessions, and the hue shifts with the dominant sport.
        </p>
        {summary.brightestDay ? (
          <strong>
            Peak day: {format(summary.brightestDay.date, 'MMM d')} · {formatDistanceKm(summary.brightestDay.distanceMeters)}
          </strong>
        ) : null}
      </div>

      <div className="heatmap">
        <div className="heatmap__months">
          {columns.map((column, index) => {
            const first = column[0];
            const previous = columns[index - 1]?.[0];
            const shouldShow = index === 0 || !previous || format(first.date, 'MMM') !== format(previous.date, 'MMM');
            return (
              <span key={`${first.dateKey}-month`} className="heatmap__month">
                {shouldShow ? format(first.date, 'MMM') : ''}
              </span>
            );
          })}
        </div>

        <div className="heatmap__grid">
          {columns.map((column) => (
            <div key={column[0]?.dateKey} className="heatmap__week">
              {column.map((cell) => {
                const accent = getActivityAccent(cell.sportType);
                const level = intensityLevel(cell.distanceMeters);
                return (
                  <div
                    key={cell.dateKey}
                    className={`heatmap__cell heatmap__cell--level-${level} ${cell.isCurrentMonth ? 'is-current' : ''}`}
                    style={
                      {
                        '--heatmap-accent': accent.solid,
                        '--heatmap-glow': accent.glow,
                      } as CSSProperties
                    }
                    title={`${format(cell.date, 'MMM d, yyyy')} · ${cell.distanceMeters > 0 ? formatDistanceKm(cell.distanceMeters) : 'Rest day'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="heatmap__legend">
          <span>Quiet</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={`heatmap__legend-cell heatmap__legend-cell--level-${level}`} />
          ))}
          <span>Peak</span>
        </div>
      </div>
    </div>
  );
};
