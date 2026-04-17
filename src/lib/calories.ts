import { format, parseISO, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import type { CalorieActivity } from '@/types/domain';

export type CalorieBucket = {
  activityCount: number;
  bucketDate: string;
  totalCalories: number;
};

export type CalorieSummary = {
  thisMonthActivities: number;
  thisMonthCalories: number;
  thisWeekActivities: number;
  thisWeekCalories: number;
  thisYearActivities: number;
  thisYearCalories: number;
  topActivity: CalorieActivity | null;
  totalCalories: number;
  trackedActivities: number;
};

const getWeekStart = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });

const DEFAULT_WEIGHT_KG = 70;

const getSpeedKph = (activity: Pick<CalorieActivity, 'distance_meters' | 'moving_time_seconds'>) => {
  if (!activity.distance_meters || !activity.moving_time_seconds) {
    return 0;
  }

  return (activity.distance_meters / 1000) / (activity.moving_time_seconds / 3600);
};

const getEstimatedMet = (activity: Pick<CalorieActivity, 'sport_type' | 'distance_meters' | 'moving_time_seconds'>) => {
  const speedKph = getSpeedKph(activity);

  switch (activity.sport_type) {
    case 'Run':
      if (speedKph >= 12.9) return 12.8;
      if (speedKph >= 11.3) return 11;
      if (speedKph >= 9.7) return 9.8;
      return 8.3;
    case 'Walk':
      if (speedKph >= 6.4) return 5;
      if (speedKph >= 5.6) return 4.3;
      return 3.5;
    case 'Hike':
      return speedKph >= 5 ? 6.5 : 6;
    case 'Ride':
      if (speedKph >= 32) return 16;
      if (speedKph >= 25.7) return 12;
      if (speedKph >= 19) return 8;
      return 6.8;
    case 'Workout':
      return 5.5;
    default:
      return speedKph >= 8 ? 7 : 5;
  }
};

export const getActivityCalories = (
  activity:
    | Pick<CalorieActivity, 'kilojoules' | 'sport_type' | 'distance_meters' | 'moving_time_seconds'>
    | null
    | undefined,
  athleteWeightKg = DEFAULT_WEIGHT_KG,
) => {
  if (!activity) {
    return 0;
  }

  if (activity.kilojoules && activity.kilojoules > 0) {
    return Math.max(0, Math.round(activity.kilojoules));
  }

  if (!activity.moving_time_seconds) {
    return 0;
  }

  const met = getEstimatedMet(activity);
  const minutes = activity.moving_time_seconds / 60;
  const calories = (met * 3.5 * athleteWeightKg * minutes) / 200;
  return Math.max(0, Math.round(calories));
};

export const summarizeCalorieActivities = (
  activities: CalorieActivity[],
  now = new Date(),
): CalorieSummary => {
  const currentWeekKey = format(getWeekStart(now), 'yyyy-MM-dd');
  const currentMonthKey = format(startOfMonth(now), 'yyyy-MM-dd');
  const currentYearKey = format(startOfYear(now), 'yyyy-MM-dd');

  let trackedActivities = 0;
  let totalCalories = 0;
  let thisWeekActivities = 0;
  let thisWeekCalories = 0;
  let thisMonthActivities = 0;
  let thisMonthCalories = 0;
  let thisYearActivities = 0;
  let thisYearCalories = 0;
  let topActivity: CalorieActivity | null = null;

  for (const activity of activities) {
    const calories = getActivityCalories(activity);
    if (calories <= 0) {
      continue;
    }

    trackedActivities += 1;
    totalCalories += calories;

    const activityDate = parseISO(activity.start_date);
    const weekKey = format(getWeekStart(activityDate), 'yyyy-MM-dd');
    const monthKey = format(startOfMonth(activityDate), 'yyyy-MM-dd');
    const yearKey = format(startOfYear(activityDate), 'yyyy-MM-dd');

    if (weekKey === currentWeekKey) {
      thisWeekActivities += 1;
      thisWeekCalories += calories;
    }

    if (monthKey === currentMonthKey) {
      thisMonthActivities += 1;
      thisMonthCalories += calories;
    }

    if (yearKey === currentYearKey) {
      thisYearActivities += 1;
      thisYearCalories += calories;
    }

    if (!topActivity || calories > getActivityCalories(topActivity)) {
      topActivity = activity;
    }
  }

  return {
    thisMonthActivities,
    thisMonthCalories,
    thisWeekActivities,
    thisWeekCalories,
    thisYearActivities,
    thisYearCalories,
    topActivity,
    totalCalories,
    trackedActivities,
  };
};

export const bucketCaloriesByGranularity = (
  activities: CalorieActivity[],
  granularity: 'week' | 'month' | 'year',
  limit?: number,
): CalorieBucket[] => {
  const buckets = new Map<string, CalorieBucket>();

  for (const activity of activities) {
    const calories = getActivityCalories(activity);
    if (calories <= 0) {
      continue;
    }

    const activityDate = parseISO(activity.start_date);
    const bucketDate =
      granularity === 'week'
        ? getWeekStart(activityDate)
        : granularity === 'month'
          ? startOfMonth(activityDate)
          : startOfYear(activityDate);
    const bucketKey = format(bucketDate, 'yyyy-MM-dd');
    const current = buckets.get(bucketKey);

    buckets.set(bucketKey, {
      activityCount: (current?.activityCount ?? 0) + 1,
      bucketDate: bucketKey,
      totalCalories: (current?.totalCalories ?? 0) + calories,
    });
  }

  const sorted = [...buckets.values()].sort((left, right) => left.bucketDate.localeCompare(right.bucketDate));
  return typeof limit === 'number' ? sorted.slice(-limit) : sorted;
};
