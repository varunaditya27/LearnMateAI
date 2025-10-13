/**
 * Screen Time Page
 * 
 * Detailed screen time analytics and tracking.
 */

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Timer, RefreshCw } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ScreenTimeWidget } from '@/components/dashboard/ScreenTimeWidget';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress as ProgressBar } from '@/components/ui/Progress';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/services/api';

type ScreenTimePeriod = 'day' | 'week' | 'month';

type ScreenTimeLog = Awaited<ReturnType<typeof api.screenTime.getLogs>> extends { data?: infer T }
  ? T extends Array<infer U>
    ? U
    : never
  : never;

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const periodOptions: Array<{ label: string; value: ScreenTimePeriod; description: string }> = [
  { label: 'Today', value: 'day', description: 'Focus on today\'s activity' },
  { label: 'This Week', value: 'week', description: 'See your weekly patterns' },
  { label: 'This Month', value: 'month', description: 'Understand long-term trends' },
];

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
};

const formatMinutes = (minutes: number) => {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${remainder}m`;
  }
  return `${remainder}m`;
};

const formatISODate = (date: Date) => date.toISOString().split('T')[0];

const getRangeForPeriod = (period: ScreenTimePeriod) => {
  const now = new Date();
  if (period === 'day') {
    return { date: formatISODate(now) };
  }

  if (period === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return {
      startDate: formatISODate(start),
      endDate: formatISODate(now),
    };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: formatISODate(start),
    endDate: formatISODate(now),
  };
};

const fetchScreenTimeAnalytics = async (period: ScreenTimePeriod) => {
  const response = await api.screenTime.getAnalytics(period);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(extractErrorMessage(response.error, 'Failed to load analytics'));
};

const fetchScreenTimeLogs = async (period: ScreenTimePeriod) => {
  const range = getRangeForPeriod(period);
  const response = await api.screenTime.getLogs(range.date, range.startDate, range.endDate);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(extractErrorMessage(response.error, 'Failed to load screen time logs'));
};

export default function ScreenTimePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard();
  const [period, setPeriod] = useState<ScreenTimePeriod>('week');

  const isReady = isAuthenticated && !authLoading;

  const {
    data: analytics,
    loading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useAsyncData(() => fetchScreenTimeAnalytics(period), {
    enabled: isReady,
    immediate: isReady,
    cacheKey: `screen-time-analytics-${period}`,
    watch: [period, isReady],
  });

  const {
    data: logs,
    loading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
  } = useAsyncData(() => fetchScreenTimeLogs(period), {
    enabled: isReady,
    immediate: isReady,
    cacheKey: `screen-time-logs-${period}`,
    watch: [period, isReady],
  });

  const isInitialLoading = authLoading || ((analyticsLoading || logsLoading) && !analytics && !logs);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchAnalytics(), refetchLogs()]);
  }, [refetchAnalytics, refetchLogs]);

  const totalProductiveMinutes = analytics?.productiveMinutes ?? 0;
  const totalDistractionMinutes = analytics?.distractionMinutes ?? 0;

  const totalMinutes = analytics?.totalMinutes ?? 0;
  const productivePercentage = totalMinutes > 0 ? (totalProductiveMinutes / totalMinutes) * 100 : 0;
  const distractionPercentage = totalMinutes > 0 ? (totalDistractionMinutes / totalMinutes) * 100 : 0;

  const categoryBreakdown = useMemo(() => {
    if (!analytics?.categoryBreakdown) return [] as Array<{ category: string; minutes: number; percentage: number }>;
    const entries = Object.entries(analytics.categoryBreakdown);
    return entries.map(([category, minutes]) => ({
      category,
      minutes,
      percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0,
    }));
  }, [analytics?.categoryBreakdown, totalMinutes]);

  if (isInitialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 mx-auto border-4 border-[var(--primary)] border-t-transparent rounded-full"
            />
            <p className="text-[var(--muted-foreground)] text-lg">Loading your screen time analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const errorMessage = analyticsError || logsError;
  const topApps = analytics?.topApps ?? [];
  const logsList = logs ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
              <Timer className="w-8 h-8 text-[var(--primary)]" />
              Screen Time Insights
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Monitor where your time goes and keep your learning on track.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((option) => {
              const isActive = option.value === period;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors border text-left ${
                    isActive
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                      : 'text-[var(--muted-foreground)] border-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                  title={option.description}
                >
                  {option.label}
                </button>
              );
            })}
            <Button variant="outline" onClick={handleRefresh} isLoading={analyticsLoading || logsLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {errorMessage && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-600"
          >
            <p className="font-semibold">We couldn&apos;t load all analytics.</p>
            <p className="text-sm">{errorMessage}</p>
          </motion.div>
        )}

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Total Active Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatMinutes(totalMinutes)}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Across selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Focus Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{analytics?.focusScore ?? 0}%</p>
              <ProgressBar value={analytics?.focusScore ?? 0} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productive Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{formatMinutes(totalProductiveMinutes)}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{productivePercentage.toFixed(0)}% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distraction Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{formatMinutes(totalDistractionMinutes)}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{distractionPercentage.toFixed(0)}% of total</p>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Category Breakdown</CardTitle>
              <Badge variant="accent">{categoryBreakdown.length} categories</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No category data available.</p>
              ) : (
                categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{item.category}</span>
                      <span className="text-[var(--muted-foreground)]">{formatMinutes(item.minutes)} • {item.percentage.toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={item.percentage} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Top Apps</CardTitle>
              <Badge variant="secondary">{topApps.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {topApps.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No app usage recorded yet. Start learning to see insights!</p>
              ) : (
                topApps.map((app, index) => (
                  <div key={app.appName} className="flex items-center justify-between p-3 rounded-xl bg-[var(--muted)]/60">
                    <div>
                      <p className="font-medium">{app.appName}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Rank #{index + 1}</p>
                    </div>
                    <div className="text-sm font-semibold text-[var(--primary)]">{formatMinutes(app.minutes)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">Usage Timeline</h2>
              <Badge variant="secondary">{logsList.length}</Badge>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                  <div className="grid grid-cols-6 bg-[var(--muted)]/40 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    <div className="col-span-2 px-4 py-3">App</div>
                    <div className="col-span-2 px-4 py-3">Category</div>
                    <div className="col-span-1 px-4 py-3">Duration</div>
                    <div className="col-span-1 px-4 py-3">Date</div>
                  </div>
                  {logsList.length === 0 ? (
                    <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                      {logsLoading ? 'Loading usage logs...' : 'No screen time entries recorded yet.'}
                    </div>
                  ) : (
                    logsList.map((log: ScreenTimeLog) => (
                      <div key={log.id} className="grid grid-cols-6 border-t border-[var(--border)] text-sm hover:bg-[var(--muted)]/30 transition-colors">
                        <div className="col-span-2 px-4 py-4 font-medium line-clamp-1">{log.appName}</div>
                        <div className="col-span-2 px-4 py-4">
                          <Badge
                            variant={
                              log.appCategory === 'productive'
                                ? 'success'
                                : log.appCategory === 'educational'
                                ? 'secondary'
                                : log.appCategory === 'social'
                                ? 'warning'
                                : log.appCategory === 'entertainment'
                                ? 'accent'
                                : 'default'
                            }
                            size="sm"
                          >
                            {log.appCategory}
                          </Badge>
                        </div>
                        <div className="col-span-1 px-4 py-4 font-semibold text-[var(--foreground)]">{formatMinutes(log.durationMinutes)}</div>
                        <div className="col-span-1 px-4 py-4 text-[var(--muted-foreground)]">{log.date}</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">Live Tracker</h2>
            </div>
            <ScreenTimeWidget />
          </div>
        </motion.section>
      </div>
    </DashboardLayout>
  );
}
