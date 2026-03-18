import { MapPin, TimerReset } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { formatDistance, formatMovingTime, formatRelativeSync, getActivityAccent, pluralize } from '@/lib/format';
import type { DashboardOverview } from '@/types/domain';

type ProfileHeroProps = {
  overview: DashboardOverview;
};

export const ProfileHero = ({ overview }: ProfileHeroProps) => {
  const dominantType =
    (overview.ride_count ?? 0) > (overview.run_count ?? 0)
      ? 'Ride'
      : (overview.run_count ?? 0) > 0
        ? 'Run'
        : 'default';
  const accent = getActivityAccent(dominantType);

  return (
    <section className="hero-card" style={{ '--hero-glow': accent.glow } as CSSProperties}>
      <div className="hero-card__copy">
        <p className="eyebrow">Movement portrait</p>
        <h2>{overview.display_name ?? overview.username ?? 'Your athlete profile'}</h2>
        <p className="hero-card__lede">
          A public-facing snapshot of training rhythm, distance, elevation, and fresh activity arcs.
        </p>

        <div className="hero-card__meta">
          <span>
            <MapPin size={15} />
            {[overview.city, overview.state, overview.country].filter(Boolean).join(', ') || 'Location hidden'}
          </span>
          <span>
            <TimerReset size={15} />
            {formatRelativeSync(overview.last_synced_at)}
          </span>
        </div>

        <div className="hero-card__chips">
          <span>{pluralize(overview.activity_count, 'activity')}</span>
          <span>{pluralize(overview.ride_count, 'ride')}</span>
          <span>{pluralize(overview.run_count, 'run')}</span>
        </div>
      </div>

      <motion.div
        className="hero-card__orbital"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-card__avatar-ring">
          <img
            src={overview.profile ?? overview.profile_medium ?? 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80'}
            alt={overview.display_name ?? 'Athlete profile'}
          />
        </div>
        <div className="hero-card__totals">
          <p>{formatDistance(overview.total_distance_meters)}</p>
          <span>{formatMovingTime(overview.total_moving_time_seconds)}</span>
        </div>
      </motion.div>
    </section>
  );
};
