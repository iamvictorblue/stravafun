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

export const getActivityCalories = (activity: Pick<CalorieActivity, 'kilojoules'> | null | undefined) =>
  Math.max(0, Math.round(activity?.kilojoules ?? 0));

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
