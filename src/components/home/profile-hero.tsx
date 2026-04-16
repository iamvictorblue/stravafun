import { motion } from 'framer-motion';
import { MapPin, TimerReset } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { CalorieSummary } from '@/lib/calories';
import { formatCalories, formatDistance, formatMovingTime, formatRelativeSync, getActivityAccent, pluralize } from '@/lib/format';
import type { DashboardOverview } from '@/types/domain';

type ProfileHeroProps = {
  calorieSummary?: CalorieSummary;
  overview: DashboardOverview;
};

export const ProfileHero = ({ overview, calorieSummary }: ProfileHeroProps) => {
  const dominantType =
    (overview.ride_count ?? 0) > (overview.run_count ?? 0)
      ? 'Ride'
      : (overview.run_count ?? 0) > 0
        ? 'Run'
        : 'default';
  const accent = getActivityAccent(dominantType);
  const hasCalories = Boolean(calorieSummary?.trackedActivities);

  return (
    <section className="hero-card" style={{ '--hero-glow': accent.glow } as CSSProperties}>
      <div className="hero-card__copy">
        <p className="eyebrow">Movement portrait</p>
        <h2>{overview.display_name ?? overview.username ?? 'Your athlete profile'}</h2>
        <p className="hero-card__lede">
          {hasCalories
            ? 'A public-facing snapshot of training rhythm, calorie burn, distance, elevation, and fresh activity arcs.'
            : 'A public-facing snapshot of training rhythm, distance, elevation, and fresh activity arcs.'}
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
          {hasCalories ? <span>{pluralize(calorieSummary?.trackedActivities, 'calorie-tracked session')}</span> : null}
        </div>
      </div>

      <motion.div
        className="hero-card__orbital"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-card__halo" />
        <motion.div
          className="hero-card__float-card hero-card__float-card--north"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span>Archive</span>
          <strong>{pluralize(overview.activity_count, 'session')}</strong>
        </motion.div>
        <div className="hero-card__avatar-ring">
          <img
            src={overview.profile ?? overview.profile_medium ?? 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80'}
            alt={overview.display_name ?? 'Athlete profile'}
          />
        </div>
        <motion.div
          className="hero-card__float-card hero-card__float-card--east"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        >
          <span>Mode split</span>
          <strong>
            {pluralize(overview.ride_count, 'ride')} / {pluralize(overview.run_count, 'run')}
          </strong>
        </motion.div>
        <div className="hero-card__totals">
          {hasCalories ? <span className="hero-card__totals-label">Estimated calories</span> : null}
          <p>{hasCalories ? formatCalories(calorieSummary?.totalCalories) : formatDistance(overview.total_distance_meters)}</p>
          <span>
            {hasCalories
              ? `${formatDistance(overview.total_distance_meters)} / ${formatMovingTime(overview.total_moving_time_seconds)} moving / ${formatCalories(calorieSummary?.thisMonthCalories)} this month`
              : formatMovingTime(overview.total_moving_time_seconds)}
          </span>
        </div>
        <motion.div
          className="hero-card__float-card hero-card__float-card--south"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        >
          <span>Freshness</span>
          <strong>{formatRelativeSync(overview.last_synced_at)}</strong>
        </motion.div>
      </motion.div>
    </section>
  );
};
