import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { activityAccentMap } from '@/lib/constants';
import type { AccentToken, Activity } from '@/types/domain';

const metersToKm = (meters: number) => meters / 1000;

export const formatDistance = (meters: number | null | undefined) => {
  if (!meters) return '0 km';
  return `${metersToKm(meters).toFixed(meters >= 100000 ? 0 : 1)} km`;
};

export const formatElevation = (meters: number | null | undefined) => {
  if (!meters) return '0 m';
  return `${Math.round(meters).toLocaleString()} m`;
};

export const formatMovingTime = (seconds: number | null | undefined) => {
  if (!seconds) return '0h';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export const formatCalories = (value: number | null | undefined) => {
  if (!value) return '0 calories';
  return `${Math.round(value).toLocaleString()} calories`;
};

export const formatActivityDate = (iso: string) => format(parseISO(iso), 'MMM d, yyyy');
export const formatShortDate = (iso: string) => format(parseISO(iso), 'MMM d');

export const formatRelativeSync = (iso: string | null | undefined) =>
  iso ? `${formatDistanceToNowStrict(parseISO(iso))} ago` : 'Awaiting first sync';

export const formatPaceOrSpeed = (activity: Activity) => {
  if (!activity.average_speed) return formatMovingTime(activity.moving_time_seconds);

  if (activity.sport_type === 'Run' || activity.sport_type === 'Walk' || activity.sport_type === 'Hike') {
    const secondsPerKm = 1000 / activity.average_speed;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds} /km`;
  }

  return `${(activity.average_speed * 3.6).toFixed(1)} km/h`;
};

export const getActivityAccent = (sportType: string): AccentToken =>
  activityAccentMap[sportType] ?? activityAccentMap.default;

export const pluralize = (value: number | null | undefined, noun: string) =>
  `${value ?? 0} ${noun}${value === 1 ? '' : 's'}`;

export const formatPeriodLabel = (bucketDate: string, granularity: string) => {
  const parsed = parseISO(bucketDate);
  if (granularity === 'year') return format(parsed, 'yyyy');
  if (granularity === 'week') return format(parsed, 'MMM d');
  return format(parsed, 'MMM yyyy');
};
