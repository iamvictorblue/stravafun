import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CalorieBucket } from '@/lib/calories';
import { formatCalories, formatPeriodLabel } from '@/lib/format';

type CalorieTrendChartProps = {
  granularity: 'week' | 'month' | 'year';
  stats: CalorieBucket[];
  title: string;
};

export const CalorieTrendChart = ({ title, granularity, stats }: CalorieTrendChartProps) => {
  const chartData = stats.map((entry) => ({
    activityCount: entry.activityCount,
    calories: entry.totalCalories,
    label: formatPeriodLabel(entry.bucketDate, granularity),
  }));

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div>
          <p className="eyebrow">Estimated calorie burn</p>
          <h3>{title}</h3>
        </div>
      </div>

      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6b3d" stopOpacity={0.82} />
                <stop offset="100%" stopColor="#ff6b3d" stopOpacity={0.04} />
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
              formatter={(value, _name, item) => {
                const activities = Number(item.payload?.activityCount ?? 0);
                return [formatCalories(Number(value ?? 0)), `${activities} tracked activities`];
              }}
            />
            <Area
              type="monotone"
              dataKey="calories"
              stroke="#ff6b3d"
              fill="url(#calorieGradient)"
              strokeWidth={3}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
