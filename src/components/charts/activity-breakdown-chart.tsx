import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { activityAccentMap } from '@/lib/constants';
import { formatDistance } from '@/lib/format';
import type { AggregatedStat } from '@/types/domain';

type ActivityBreakdownChartProps = {
  stats: AggregatedStat[];
};

export const ActivityBreakdownChart = ({ stats }: ActivityBreakdownChartProps) => {
  const chartData = stats.map((entry) => ({
    name: entry.activity_type,
    value: entry.total_distance_meters,
    color: activityAccentMap[entry.activity_type]?.solid ?? activityAccentMap.default.solid,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div>
          <p className="eyebrow">Activity blend</p>
          <h3>Discipline mix</h3>
        </div>
      </div>

      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={72}
              outerRadius={106}
              paddingAngle={4}
              animationDuration={1000}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(8, 10, 20, 0.92)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '18px',
              }}
              formatter={(value) => [formatDistance(Number(value ?? 0)), 'Distance']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card__legend">
        {chartData.map((entry) => (
          <div key={entry.name} className="legend-row">
            <span className="legend-row__swatch" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}</span>
            <strong>{formatDistance(entry.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};
