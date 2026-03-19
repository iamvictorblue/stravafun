import polyline from '@mapbox/polyline';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { Activity } from '@/types/domain';

type RoutePreviewProps = {
  activity: Activity;
};

type Point = [number, number];

const normalizePoints = (points: Point[], width: number, height: number, padding: number) => {
  const latitudes = points.map(([lat]) => lat);
  const longitudes = points.map(([, lng]) => lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = Math.max(maxLat - minLat, 0.0001);
  const lngRange = Math.max(maxLng - minLng, 0.0001);

  return points.map(([lat, lng]) => {
    const x = padding + ((lng - minLng) / lngRange) * (width - padding * 2);
    const y = height - padding - ((lat - minLat) / latRange) * (height - padding * 2);
    return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const;
  });
};

const buildPolylinePoints = (activity: Activity): Point[] => {
  if (activity.map_summary_polyline) {
    return polyline.decode(activity.map_summary_polyline) as Point[];
  }

  if (Array.isArray(activity.start_latlng) && Array.isArray(activity.end_latlng)) {
    return [activity.start_latlng as Point, activity.end_latlng as Point];
  }

  return [];
};

export const RoutePreview = ({ activity }: RoutePreviewProps) => {
  const svgPoints = useMemo(() => {
    const points = buildPolylinePoints(activity);
    if (points.length < 2) return [];
    return normalizePoints(points, 180, 72, 8);
  }, [activity]);

  const polylinePoints = svgPoints.map(([x, y]) => `${x},${y}`).join(' ');
  const start = svgPoints[0];
  const end = svgPoints.at(-1);

  if (svgPoints.length < 2) {
    return (
      <div className="route-preview route-preview--empty" aria-hidden="true">
        <div className="route-preview__fallback" />
      </div>
    );
  }

  return (
    <div className="route-preview" aria-hidden="true">
      <svg viewBox="0 0 180 72" className="route-preview__svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`routeGradient-${activity.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="45%" stopColor="var(--activity-solid)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.9)" />
          </linearGradient>
        </defs>
        <path className="route-preview__grid" d="M0 18 H180 M0 36 H180 M0 54 H180" />
        <motion.polyline
          points={polylinePoints}
          fill="none"
          stroke={`url(#routeGradient-${activity.id})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0.15, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        {start ? <circle cx={start[0]} cy={start[1]} r="3.2" className="route-preview__dot route-preview__dot--start" /> : null}
        {end ? <circle cx={end[0]} cy={end[1]} r="3.2" className="route-preview__dot route-preview__dot--end" /> : null}
      </svg>
    </div>
  );
};
