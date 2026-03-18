import polyline from '@mapbox/polyline';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';
import { EmptyState } from '@/components/ui/empty-state';
import type { Activity, ActivityStream } from '@/types/domain';

type RouteMapProps = {
  activity: Activity;
  stream?: ActivityStream | null;
};

const FitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(points, { padding: [28, 28] });
  }, [map, points]);

  return null;
};

export const RouteMap = ({ activity, stream }: RouteMapProps) => {
  const points = useMemo<[number, number][]>(() => {
    if (Array.isArray(stream?.latlng)) {
      return (stream.latlng as unknown[])
        .filter(Array.isArray)
        .map((item) => item as [number, number]);
    }

    if (activity.map_summary_polyline) {
      return polyline.decode(activity.map_summary_polyline) as [number, number][];
    }

    return [];
  }, [activity.map_summary_polyline, stream?.latlng]);

  const [visibleCount, setVisibleCount] = useState(2);

  useEffect(() => {
    if (points.length < 2) return;

    let frame = 0;
    const startedAt = performance.now();
    const duration = 1400;

    const animateRoute = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      setVisibleCount(Math.max(2, Math.round(points.length * progress)));
      if (progress < 1) frame = requestAnimationFrame(animateRoute);
    };

    frame = requestAnimationFrame(animateRoute);
    return () => cancelAnimationFrame(frame);
  }, [points]);

  if (points.length < 2) {
    return <EmptyState title="No route available" description="This activity did not include a public route trace." />;
  }

  return (
    <div className="route-map">
      <MapContainer className="route-map__frame" center={points[0]} zoom={13} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds points={points} />
        <Polyline
          positions={points.slice(0, Math.max(2, visibleCount))}
          pathOptions={{ color: '#ff8f4d', weight: 5, opacity: 0.9 }}
        />
      </MapContainer>
    </div>
  );
};
