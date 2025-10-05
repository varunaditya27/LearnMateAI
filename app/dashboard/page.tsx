/**
 * Main Dashboard Page
 * 
 * Integrated with backend APIs for real-time data
 */

'use client';

import React, { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAsyncData } from '@/hooks/useAsyncData';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProgressTracker } from '@/components/dashboard/ProgressTracker';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { ScreenTimeWidget } from '@/components/dashboard/ScreenTimeWidget';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import type { LearningPath } from '@/types';

type LeaderboardTimeframe = 'weekly' | 'monthly' | 'all-time';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const LEADERBOARD_TIMEFRAME_OPTIONS: Array<{ label: string; value: LeaderboardTimeframe }> = [
  { label: 'This Week', value: 'weekly' },
  { label: 'This Month', value: 'monthly' },
  { label: 'All Time', value: 'all-time' },
];

const fetchDashboardOverview = async () => {
  const response = await api.dashboard.getOverview();

  if (response.success && response.data) {
    return response.data;
  }
  const message = response.error ?? 'Failed to fetch dashboard overview';
  if (message.toLowerCase().includes('not authenticated')) {
    throw new Error('Please sign in to view your dashboard.');
  }

  throw new Error(message);
};

const fetchLeaderboardData = async (timeframe: LeaderboardTimeframe) => {
  const response = await api.leaderboard.getLeaderboard(timeframe, 10);

  if (response.success && response.data) {
    return response.data;
  }
  const message = response.error ?? 'Failed to fetch leaderboard';
  if (message.toLowerCase().includes('not authenticated')) {
    throw new Error('Sign in to compare with the leaderboard.');
  }

  throw new Error(message);
};

export default function DashboardPage() {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuthGuard();
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('weekly');
  const [authReady, setAuthReady] = useState(false);

  // Wait for auth to be fully ready before making API calls
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Longer delay to ensure Firebase token is ready and auth store is synced
      const timer = setTimeout(() => {
        setAuthReady(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setAuthReady(false);
    }
  }, [isAuthenticated, authLoading]);

  const isReady = isAuthenticated && !authLoading && authReady;

  const {
    data: dashboardData,
    loading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useAsyncData(fetchDashboardOverview, {
    enabled: isReady,
    immediate: isReady,
    cacheKey: 'dashboard-overview',
    watch: [isReady],
  });

  const {
    data: leaderboardEntries,
    loading: leaderboardLoading,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useAsyncData(
    () => fetchLeaderboardData(timeframe),
    {
      enabled: isReady,
      immediate: isReady,
      cacheKey: `leaderboard-${timeframe}`,
      watch: [timeframe, isReady],
    }
  );

  const {
    data: joinedChallenges,
    loading: challengesLoading,
    error: challengesError,
    refetch: refetchChallenges,
  } = useAsyncData(
    async () => {
      const response = await api.community.getMyJoinedChallenges();
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    },
    {
      enabled: isReady,
      immediate: isReady,
      cacheKey: 'my-joined-challenges',
      watch: [isReady],
    }
  );

  const handleTimeframeChange = useCallback((value: LeaderboardTimeframe) => {
    setTimeframe(value);
  }, []);

  const isInitialLoading = authLoading || !authReady || (overviewLoading && !dashboardData);

  if (isInitialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto border-4 border-[var(--primary)] border-t-transparent rounded-full"
            />
            <p className="text-[var(--muted-foreground)] text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!dashboardData) {
    const message = overviewError ?? 'Unable to load dashboard';
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-6">⚠️</div>
              <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
              <p className="text-[var(--muted-foreground)] mb-6">{message}</p>
              <Button variant="primary" onClick={refetchOverview}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { user, stats, activePaths, todayActivity } = dashboardData;

  const resolvedPaths: LearningPath[] = activePaths ?? [];
  const completedConcepts = stats?.completedConcepts ?? 0;
  const totalConcepts = resolvedPaths.reduce(
    (sum, path) => sum + (path.steps?.length ?? 0),
    0
  ) || 45;

  const screenTimeMinutes = todayActivity?.screenTimeMinutes ?? 0;
  const dailyGoalMinutes = Math.max(todayActivity?.dailyGoalMinutes ?? 60, 1);
  const computedProgress = Math.min(
    todayActivity?.dailyGoalProgress ?? (screenTimeMinutes / Math.max(dailyGoalMinutes, 1)) * 100,
    100
  );

  const currentStreak = stats?.currentStreak ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-12 mt-12 px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-3">
              Welcome back, {(user?.displayName || authUser?.displayName || 'there')}
            </h1>
            <p className="text-lg text-[var(--muted-foreground)]">
              Continue your learning journey
            </p>
          </div>

          {/* Streak Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 rounded-2xl shadow-lg backdrop-blur-sm"
          >
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-sm text-[var(--muted-foreground)] font-medium">Current Streak</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">{currentStreak} Days</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Challenge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)] mb-6">
                Complete {dailyGoalMinutes} minutes to reach your daily goal
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-[var(--muted)] rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${computedProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-[var(--primary)] rounded-full"
                  />
                </div>
                <span className="font-bold text-xl">
                  {screenTimeMinutes}/{dailyGoalMinutes}
                </span>
              </div>
            </CardContent>
          </Card>

          <ProgressTracker
            completedConcepts={completedConcepts}
            totalConcepts={totalConcepts}
            currentStreak={stats?.currentStreak ?? 0}
            longestStreak={stats?.longestStreak ?? 0}
            totalPoints={stats?.totalPoints ?? 0}
            level={stats?.level ?? 1}
          />
        </motion.div>

        {resolvedPaths.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-6">Continue Learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resolvedPaths.slice(0, 3).map((path, index) => (
                <motion.div
                  key={path.id || `path-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link href={`/dashboard/learning/paths/${path.id || 'unknown'}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{path.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-[var(--muted-foreground)] mb-4 line-clamp-2">
                          {path.description || 'Continue your learning journey'}
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-semibold">{path.progress}%</span>
                          </div>
                          <div className="w-full bg-[var(--muted)] rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-[var(--primary)] rounded-full"
                              style={{ width: `${path.progress}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {joinedChallenges && joinedChallenges.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Your Active Challenges</h2>
              <Link href="/dashboard/community">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedChallenges.slice(0, 3).map((participation, index) => (
                <motion.div
                  key={participation.participationId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="line-clamp-1 text-lg">{participation.challenge.name}</CardTitle>
                        <Badge variant="secondary" size="sm">{participation.challenge.difficulty}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                        {participation.challenge.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--muted-foreground)]">Progress</span>
                          <span className="font-semibold">{participation.progress}%</span>
                        </div>
                        <div className="w-full bg-[var(--muted)] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                            style={{ width: `${participation.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
                        <div>
                          <span className="font-semibold text-[var(--foreground)]">Tasks:</span> {participation.completedTasks.length}/{participation.challenge.tasks.length}
                        </div>
                        <div>
                          <span className="font-semibold text-[var(--foreground)]">Reward:</span> {participation.challenge.rewards?.points || 0} pts
                        </div>
                      </div>

                      <Link href="/dashboard/progress">
                        <Button variant="primary" size="sm" fullWidth>
                          Continue Challenge
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <ScreenTimeWidget />

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/learning/generate">
                <Button variant="primary" fullWidth leftIcon={<span>🎯</span>}>
                  Start New Learning Path
                </Button>
              </Link>
              <Link href="/dashboard/learning/paths">
                <Button variant="secondary" fullWidth leftIcon={<span>📚</span>}>
                  View All Paths
                </Button>
              </Link>
              <Link href="/dashboard/quiz/generate">
                <Button variant="outline" fullWidth leftIcon={<span>📝</span>}>
                  Take a Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Leaderboard
            entries={leaderboardEntries ?? []}
            currentUserId={user?.id ?? authUser?.id}
            timeframe={timeframe}
            timeframeOptions={LEADERBOARD_TIMEFRAME_OPTIONS}
            onTimeframeChange={handleTimeframeChange}
            loading={leaderboardLoading}
            errorMessage={leaderboardError ?? undefined}
            onRefresh={refetchLeaderboard}
          />
        </motion.div>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-[var(--muted-foreground)] pb-8"
        >
          Keep going — every small step counts
        </motion.p>
      </div>
    </DashboardLayout>
  );
}