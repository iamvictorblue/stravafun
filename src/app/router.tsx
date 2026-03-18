import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';

const HomePage = lazy(() => import('@/pages/home-page').then((module) => ({ default: module.HomePage })));
const ActivitiesPage = lazy(() =>
  import('@/pages/activities-page').then((module) => ({ default: module.ActivitiesPage })),
);
const ActivityDetailPage = lazy(() =>
  import('@/pages/activity-detail-page').then((module) => ({ default: module.ActivityDetailPage })),
);
const StatsPage = lazy(() => import('@/pages/stats-page').then((module) => ({ default: module.StatsPage })));
const ConnectPage = lazy(() => import('@/pages/connect-page').then((module) => ({ default: module.ConnectPage })));
const NotFoundPage = lazy(() =>
  import('@/pages/not-found-page').then((module) => ({ default: module.NotFoundPage })),
);

const PageFallback = () => <Skeleton className="detail-skeleton" />;

export const AppRouter = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route
        index
        element={
          <Suspense fallback={<PageFallback />}>
            <HomePage />
          </Suspense>
        }
      />
      <Route
        path="/activities"
        element={
          <Suspense fallback={<PageFallback />}>
            <ActivitiesPage />
          </Suspense>
        }
      />
      <Route
        path="/activities/:activityId"
        element={
          <Suspense fallback={<PageFallback />}>
            <ActivityDetailPage />
          </Suspense>
        }
      />
      <Route
        path="/stats"
        element={
          <Suspense fallback={<PageFallback />}>
            <StatsPage />
          </Suspense>
        }
      />
      <Route
        path="/connect"
        element={
          <Suspense fallback={<PageFallback />}>
            <ConnectPage />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <Suspense fallback={<PageFallback />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Route>
  </Routes>
);
