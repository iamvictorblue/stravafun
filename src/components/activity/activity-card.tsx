import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Flame, Mountain, Timer } from 'lucide-react';
import type { CSSProperties } from 'react';
import { RoutePreview } from '@/components/activity/route-preview';
import { formatActivityDate, formatCalories, formatDistance, formatElevation, formatPaceOrSpeed, getActivityAccent } from '@/lib/format';
import type { Activity } from '@/types/domain';

type ActivityCardProps = {
  activity: Activity;
};

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const accent = getActivityAccent(activity.sport_type);

  return (
    <motion.article
      className="activity-card"
      style={
        {
          '--activity-gradient': accent.soft,
          '--activity-glow': accent.glow,
          '--activity-solid': accent.solid,
        } as CSSProperties
      }
      initial={{ opacity: 0, y: 30, rotateX: 6 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -8, rotateX: -2, rotateY: 1.5 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="activity-card__header">
        <div>
          <p className="activity-card__type">{activity.sport_type}</p>
          <h3>{activity.name}</h3>
        </div>
        <Link to={`/activities/${activity.id}`} className="activity-card__link">
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <p className="activity-card__date">{formatActivityDate(activity.start_date)}</p>
      <RoutePreview activity={activity} />

      <div className="activity-card__stats">
        <span>{formatDistance(activity.distance_meters)}</span>
        <span>{formatPaceOrSpeed(activity)}</span>
      </div>

      <div className="activity-card__footer">
        <span>
          <Mountain size={14} />
          {formatElevation(activity.total_elevation_gain)}
        </span>
        <span>
          <Timer size={14} />
          {Math.round(activity.moving_time_seconds / 60)} min
        </span>
        {activity.kilojoules ? (
          <span>
            <Flame size={14} />
            {formatCalories(activity.kilojoules)}
          </span>
        ) : null}
      </div>
    </motion.article>
  );
};
