'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, RefreshCw } from 'lucide-react';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAsyncData } from '@/hooks/useAsyncData';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress as ProgressBar } from '@/components/ui/Progress';
import { api } from '@/services/api';
import type { LearningPath, Progress } from '@/types';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

type ProgressFilter = 'all' | 'completed' | 'in-progress' | 'not-started';

const progressFilters: Array<{ label: string; value: ProgressFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Not Started', value: 'not-started' },
];

const formatMinutes = (minutes: number) => {
  if (!minutes) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m`;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown> & { toDate?: () => Date };
    if (typeof obj.toDate === 'function') {
      return obj.toDate();
    }
    if (typeof obj.seconds === 'number') {
      const milliseconds = obj.seconds * 1000 + (typeof obj.nanoseconds === 'number' ? obj.nanoseconds / 1_000_000 : 0);
      return new Date(milliseconds);
    }
  }

  return null;
};

const formatDate = (value: unknown) => {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

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

const fetchProgressEntries = async () => {
  const response = await api.learning.getProgress();
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(extractErrorMessage(response.error, 'Failed to load progress'));
};

const fetchLearningPaths = async () => {
  const response = await api.learning.getPaths();
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(extractErrorMessage(response.error, 'Failed to load learning paths'));
};

export default function ProgressPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard();
  const [selectedFilter, setSelectedFilter] = useState<ProgressFilter>('all');

  const isReady = isAuthenticated && !authLoading;

  const {
    data: progressEntries,
    loading: progressLoading,
    error: progressError,
    refetch: refetchProgress,
  } = useAsyncData(fetchProgressEntries, {
    enabled: isReady,
    immediate: isReady,
    cacheKey: 'progress-entries',
    watch: [isReady],
  });

  const {
    data: learningPaths,
    loading: pathsLoading,
    error: pathsError,
    refetch: refetchPaths,
  } = useAsyncData(fetchLearningPaths, {
    enabled: isReady,
    immediate: isReady,
    cacheKey: 'learning-paths',
    watch: [isReady],
  });

  const {
    data: joinedChallenges,
    loading: challengesLoading,
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
      cacheKey: 'my-joined-challenges-progress',
      watch: [isReady],
    }
  );

  const isInitialLoading = authLoading || ((progressLoading || pathsLoading || challengesLoading) && !progressEntries && !learningPaths && !joinedChallenges);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchProgress(), refetchPaths(), refetchChallenges()]);
  }, [refetchProgress, refetchPaths, refetchChallenges]);

  const enhancedEntries = useMemo(() => {
    if (!progressEntries || !learningPaths) return [] as (Progress & { pathName?: string })[];

    const conceptToPathName = new Map<string, string>();

    learningPaths.forEach((path) => {
      path.steps?.forEach((step) => {
        if (step.conceptId) {
          conceptToPathName.set(step.conceptId, path.name);
        }
      });
    });

    return progressEntries
      .map((entry) => ({
        ...entry,
        pathName: conceptToPathName.get(entry.conceptId),
      }))
      .sort((a, b) => {
        const dateA = toDate(a.lastAccessedAt)?.getTime() ?? 0;
        const dateB = toDate(b.lastAccessedAt)?.getTime() ?? 0;
        return dateB - dateA;
      });
  }, [progressEntries, learningPaths]);

  const filteredEntries = useMemo(() => {
    if (!enhancedEntries.length) return [];
    if (selectedFilter === 'all') return enhancedEntries;
    return enhancedEntries.filter((entry) => entry.status === selectedFilter);
  }, [enhancedEntries, selectedFilter]);

  const summary = useMemo(() => {
    const totalMinutes = enhancedEntries.reduce((sum, entry) => sum + (entry.timeSpentMinutes ?? 0), 0);
    const completed = enhancedEntries.filter((entry) => entry.status === 'completed').length;
    const inProgress = enhancedEntries.filter((entry) => entry.status === 'in-progress').length;
    const notStarted = enhancedEntries.filter((entry) => entry.status === 'not-started').length;

    const totalEntries = enhancedEntries.length || 1;
    const completionRate = (completed / totalEntries) * 100;

    return {
      totalMinutes,
      completed,
      inProgress,
      notStarted,
      completionRate,
    };
  }, [enhancedEntries]);

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
            <p className="text-[var(--muted-foreground)] text-lg">Loading your progress...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const errorMessage = progressError || pathsError;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-[var(--primary)]" />
              Learning Progress
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Track your momentum across all learning paths and concepts.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} isLoading={progressLoading || pathsLoading}>
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
            <p className="font-semibold">We couldn&apos;t load everything.</p>
            <p className="text-sm">{errorMessage}</p>
          </motion.div>
        )}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Total Learning Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatMinutes(summary.totalMinutes)}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Minutes logged across all concepts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Concepts Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.completed}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Marked as completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Concepts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.inProgress}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.completionRate.toFixed(0)}%</p>
              <ProgressBar value={summary.completionRate} className="mt-3" />
            </CardContent>
          </Card>
        </motion.div>

        {learningPaths && learningPaths.length > 0 && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">Active Learning Paths</h2>
              <Badge variant="accent">{learningPaths.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {learningPaths.map((path: LearningPath) => (
                <Card key={path.id} className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between gap-2">
                      <span className="line-clamp-1">{path.name}</span>
                      <Badge variant={path.status === 'completed' ? 'success' : 'secondary'} size="sm">
                        {path.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">{path.description || 'Personalized learning journey'}</p>
                    <ProgressBar value={path.progress ?? 0} showLabel />
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Started {formatDate(path.startedAt)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {joinedChallenges && joinedChallenges.length > 0 && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">🏆 Active Challenges</h2>
              <Badge variant="accent">{joinedChallenges.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {joinedChallenges.map((participation) => (
                <Card key={participation.participationId} className="h-full border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between gap-2">
                      <span className="line-clamp-1">{participation.challenge.name}</span>
                      <Badge variant="secondary" size="sm">{participation.challenge.difficulty}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                      {participation.challenge.description}
                    </p>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">Challenge Progress</span>
                        <span className="font-semibold">{participation.progress}%</span>
                      </div>
                      <ProgressBar value={participation.progress} className="bg-green-500/20" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[var(--muted-foreground)]">Completed Tasks</p>
                        <p className="font-semibold">
                          {participation.completedTasks.length} / {participation.challenge.tasks.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--muted-foreground)]">Reward Points</p>
                        <p className="font-semibold text-green-600">
                          {participation.challenge.rewards?.points || 0} pts
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                        <span>Joined {formatDate(participation.joinedAt)}</span>
                        <Badge 
                          variant={participation.status === 'completed' ? 'success' : participation.status === 'active' ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {participation.status}
                        </Badge>
                      </div>
                    </div>

                    {participation.challenge.tasks.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-[var(--foreground)] mb-2">Next Tasks:</p>
                        <ul className="space-y-1">
                          {participation.challenge.tasks
                            .filter(task => !participation.completedTasks.includes(task.id))
                            .slice(0, 2)
                            .map((task) => (
                              <li key={task.id} className="text-xs text-[var(--muted-foreground)] flex items-start gap-2">
                                <span className="text-green-500">•</span>
                                <span className="line-clamp-1">{task.title}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">Concept Progress</h2>
              <Badge variant="secondary">{filteredEntries.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {progressFilters.map((filter) => {
                const isActive = selectedFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
                      isActive
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                        : 'text-[var(--muted-foreground)] border-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                <div className="grid grid-cols-12 bg-[var(--muted)]/40 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <div className="col-span-3 lg:col-span-2 px-4 py-3">Concept</div>
                  <div className="col-span-2 px-4 py-3">Status</div>
                  <div className="hidden lg:block col-span-3 px-4 py-3">Learning Path</div>
                  <div className="col-span-3 lg:col-span-2 px-4 py-3">Last Accessed</div>
                  <div className="col-span-2 lg:col-span-1 px-4 py-3">Time</div>
                  <div className="hidden lg:block col-span-2 px-4 py-3">Notes</div>
                </div>

                {filteredEntries.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    {progressLoading ? 'Loading progress updates...' : 'No progress entries match this filter yet.'}
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-12 border-t border-[var(--border)] text-sm hover:bg-[var(--muted)]/30 transition-colors"
                    >
                      <div className="col-span-3 lg:col-span-2 px-4 py-4">
                        <div className="font-medium text-[var(--foreground)] line-clamp-1">{entry.conceptId}</div>
                        {entry.resourceId && (
                          <div className="text-xs text-[var(--muted-foreground)] line-clamp-1">Resource: {entry.resourceId}</div>
                        )}
                      </div>
                      <div className="col-span-2 px-4 py-4">
                        <Badge variant={entry.status === 'completed' ? 'success' : entry.status === 'in-progress' ? 'accent' : 'secondary'} size="sm">
                          {entry.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="hidden lg:block col-span-3 px-4 py-4">
                        <span className="line-clamp-1 text-[var(--muted-foreground)]">{entry.pathName ?? '—'}</span>
                      </div>
                      <div className="col-span-3 lg:col-span-2 px-4 py-4 text-[var(--muted-foreground)]">
                        {formatDate(entry.lastAccessedAt)}
                      </div>
                      <div className="col-span-2 lg:col-span-1 px-4 py-4 text-[var(--foreground)] font-semibold">
                        {formatMinutes(entry.timeSpentMinutes ?? 0)}
                      </div>
                      <div className="hidden lg:block col-span-2 px-4 py-4 text-[var(--muted-foreground)] line-clamp-2">
                        {entry.notes ?? '—'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </DashboardLayout>
  );
}
