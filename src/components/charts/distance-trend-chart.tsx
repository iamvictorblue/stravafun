import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDistance, formatPeriodLabel } from '@/lib/format';
import type { AggregatedStat } from '@/types/domain';

type DistanceTrendChartProps = {
  title: string;
  granularity: 'week' | 'month' | 'year';
  stats: AggregatedStat[];
};

export const DistanceTrendChart = ({ title, granularity, stats }: DistanceTrendChartProps) => {
  const chartData = stats.map((entry) => ({
    label: formatPeriodLabel(entry.bucket_date, granularity),
    distanceKm: Number((entry.total_distance_meters / 1000).toFixed(1)),
  }));

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div>
          <p className="eyebrow">Distance over time</p>
          <h3>{title}</h3>
        </div>
      </div>

      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="distanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff9258" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#ff9258" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#8d93b5', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8d93b5', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(8, 10, 20, 0.92)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '18px',
              }}
              formatter={(value) => [formatDistance(Number(value ?? 0) * 1000), 'Distance']}
            />
            <Area
              type="monotone"
              dataKey="distanceKm"
              stroke="#ff9258"
              fill="url(#distanceGradient)"
              strokeWidth={3}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
