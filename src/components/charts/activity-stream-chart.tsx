import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ActivityStream } from '@/types/domain';

type ActivityStreamChartProps = {
  stream: ActivityStream;
};

export const ActivityStreamChart = ({ stream }: ActivityStreamChartProps) => {
  const distance = Array.isArray(stream.distance) ? (stream.distance as number[]) : [];
  const altitude = Array.isArray(stream.altitude) ? (stream.altitude as number[]) : [];
  const chartData = distance.map((entry, index) => ({
    distanceKm: Number((entry / 1000).toFixed(2)),
    altitude: Math.round(altitude[index] ?? 0),
  }));

  if (!chartData.length) return null;

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div>
          <p className="eyebrow">Route texture</p>
          <h3>Altitude profile</h3>
        </div>
      </div>

      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#66c5ff" stopOpacity={0.75} />
                <stop offset="100%" stopColor="#66c5ff" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="distanceKm" tick={{ fill: '#8d93b5', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8d93b5', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(8, 10, 20, 0.92)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '18px',
              }}
              formatter={(value) => [`${Number(value ?? 0)} m`, 'Altitude']}
              labelFormatter={(value) => `${Number(value ?? 0)} km`}
            />
            <Area
              type="monotone"
              dataKey="altitude"
              stroke="#66c5ff"
              fill="url(#altitudeGradient)"
              strokeWidth={2.5}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
