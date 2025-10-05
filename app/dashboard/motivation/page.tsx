'use client';

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/services/api';
import type { HabitChallenge, MotivationBoost } from '@/types/api';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
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

const formatISODate = (date: Date) => date.toISOString().split('T')[0];

const fetchMotivationBoosts = async () => {
  const response = await api.motivation.getBoosts(10);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(extractErrorMessage(response.error, 'Failed to load motivation boosts'));
};

const fetchHabitChallenges = async () => {
  const response = await api.motivation.getHabitChallenges('active');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(extractErrorMessage(response.error, 'Failed to load habit challenges'));
};

const habitTypes = [
  { value: 'daily_learning', label: 'Daily Learning Minutes' },
  { value: 'concept_completion', label: 'Concept Completion' },
  { value: 'streak_maintenance', label: 'Maintain Streak' },
  { value: 'focus_time', label: 'Focus Time' },
] as const;

type HabitType = typeof habitTypes[number]['value'];

export default function MotivationPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard();
  const isReady = isAuthenticated && !authLoading;

  const {
    data: boosts,
    loading: boostsLoading,
    error: boostsError,
    refetch: refetchBoosts,
  } = useAsyncData(fetchMotivationBoosts, {
    enabled: isReady,
    immediate: isReady,
    cacheKey: 'motivation-boosts',
    watch: [isReady],
  });

  const {
    data: habits,
    loading: habitsLoading,
    error: habitsError,
    refetch: refetchHabits,
  } = useAsyncData(fetchHabitChallenges, {
    enabled: isReady,
    immediate: isReady,
    cacheKey: 'habit-challenges',
    watch: [isReady],
  });

  const [boostContext, setBoostContext] = useState('I need a push for my current topic');
  const [requestingBoost, setRequestingBoost] = useState(false);

  const [newHabit, setNewHabit] = useState({
    name: '',
    type: habitTypes[0].value as HabitType,
    targetValue: 30,
  });
  const [creatingHabit, setCreatingHabit] = useState(false);
  const [createHabitError, setCreateHabitError] = useState<string | null>(null);

  const [updatingHabitId, setUpdatingHabitId] = useState<string | null>(null);
  const [habitFeedback, setHabitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isInitialLoading = authLoading || ((boostsLoading || habitsLoading) && !boosts && !habits);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchBoosts(), refetchHabits()]);
  }, [refetchBoosts, refetchHabits]);

  const handleRequestBoost = async () => {
    setRequestingBoost(true);
    try {
      const response = await api.motivation.sendBoost(boostContext);
      if (response.success && response.data) {
        await refetchBoosts();
      } else {
        throw new Error(extractErrorMessage(response.error, 'Unable to generate motivation'));
      }
    } catch (error) {
      setHabitFeedback({ type: 'error', message: extractErrorMessage(error, 'Unable to generate motivation') });
    } finally {
      setRequestingBoost(false);
    }
  };

  const handleCreateHabit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingHabit(true);
    setCreateHabitError(null);

    try {
      const response = await api.motivation.createHabitChallenge({
        name: newHabit.name,
        type: newHabit.type,
        targetValue: newHabit.targetValue,
      });

      if (response.success && response.data) {
        setNewHabit({ name: '', type: habitTypes[0].value, targetValue: 30 });
        await refetchHabits();
        setHabitFeedback({ type: 'success', message: 'New habit challenge created!' });
      } else {
        throw new Error(extractErrorMessage(response.error, 'Unable to create habit challenge'));
      }
    } catch (error) {
      setCreateHabitError(extractErrorMessage(error, 'Unable to create habit challenge'));
    } finally {
      setCreatingHabit(false);
    }
  };

  const handleCompleteToday = async (habit: HabitChallenge) => {
    const today = formatISODate(new Date());
    const alreadyLogged = habit.progress?.some((entry) => entry.date === today && entry.completed);
    if (alreadyLogged) {
      setHabitFeedback({ type: 'success', message: 'You have already logged progress for today!' });
      return;
    }

    setUpdatingHabitId(habit.id);
    setHabitFeedback(null);

    try {
      const response = await api.motivation.updateHabitProgress({
        habitId: habit.id,
        date: today,
        value: habit.targetValue,
        completed: true,
      });

      if (response.success && response.data) {
        await refetchHabits();
        setHabitFeedback({ type: 'success', message: 'Great job! Progress logged for today.' });
      } else {
        throw new Error(extractErrorMessage(response.error, 'Unable to update habit progress'));
      }
    } catch (error) {
      setHabitFeedback({ type: 'error', message: extractErrorMessage(error, 'Unable to update habit progress') });
    } finally {
      setUpdatingHabitId(null);
    }
  };

  const boostsList = boosts ?? [];
  const habitChallenges = habits ?? [];

  const errorMessage = boostsError || habitsError;

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
            <p className="text-[var(--muted-foreground)] text-lg">Gathering motivation and habit data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalActiveHabits = habitChallenges.length;
  const averageStreak = habitChallenges.length
    ? Math.round(
        habitChallenges.reduce((sum, habit) => sum + (habit.currentStreak ?? 0), 0) / habitChallenges.length,
      )
    : 0;

  const totalBoosts = boostsList.length;
  const latestBoost = boostsList[0];

  const renderProgressPills = (habit: HabitChallenge) => {
    const recent = [...(habit.progress ?? [])]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return (
      <div className="flex flex-wrap gap-2">
        {recent.length === 0 ? (
          <span className="text-xs text-[var(--muted-foreground)]">No progress logged yet.</span>
        ) : (
          recent.map((entry) => (
            <span
              key={`${habit.id}-${entry.date}`}
              className={`px-3 py-1 text-xs rounded-full font-medium ${
                entry.completed
                  ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/40'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
              }`}
            >
              {entry.date}
            </span>
          ))
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">💪 Motivation & Habits</h1>
            <p className="text-[var(--muted-foreground)]">
              Stay inspired and keep your learning habits on track every day.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} isLoading={boostsLoading || habitsLoading}>
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
            <p className="font-semibold">We couldn&apos;t load all motivation data.</p>
            <p className="text-sm">{errorMessage}</p>
          </motion.div>
        )}

        {habitFeedback && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-xl border ${habitFeedback.type === 'success' ? 'border-green-500/40 bg-green-500/10 text-green-700' : 'border-red-500/40 bg-red-500/10 text-red-600'}`}
          >
            <p className="font-semibold">{habitFeedback.message}</p>
          </motion.div>
        )}

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Total Boosts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalBoosts}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Personalized messages generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Habits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalActiveHabits}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Challenges you&apos;re tracking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{averageStreak} days</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Across all active habits</p>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Need a Boost?</CardTitle>
              <Badge variant="accent">AI Motivation</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestBoost ? (
                <div className="p-4 rounded-xl bg-[var(--muted)]/60 border border-[var(--border)]">
                  <p className="text-sm text-[var(--muted-foreground)]">Latest boost</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">“{latestBoost.message}”</p>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    {new Date(latestBoost.createdAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">Request your first motivation boost to kickstart your day.</p>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-[var(--foreground)]">Tell us what you&apos;re working on</label>
                <textarea
                  value={boostContext}
                  onChange={(event) => setBoostContext(event.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="E.g., struggling with React hooks"
                />
                <div className="flex justify-end">
                  <Button variant="primary" onClick={handleRequestBoost} isLoading={requestingBoost}>
                    Request Motivation
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Recent Boosts</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {boostsList.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">No boosts generated yet. Request one to see it here!</p>
                  ) : (
                    boostsList.map((boost: MotivationBoost) => (
                      <div key={boost.id} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                        <p className="text-sm text-[var(--foreground)]">{boost.message}</p>
                        <p className="mt-2 text-xs text-[var(--muted-foreground)]">{new Date(boost.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Create New Habit Challenge</CardTitle>
              <Badge variant="secondary">Stay accountable</Badge>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateHabit}>
                <Input
                  label="Habit Name"
                  placeholder="30 minutes of focused learning"
                  value={newHabit.name}
                  onChange={(event) => setNewHabit((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Habit Type</label>
                    <select
                      value={newHabit.type}
                      onChange={(event) => setNewHabit((prev) => ({ ...prev, type: event.target.value as HabitType }))}
                      className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      {habitTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Input
                      label="Daily Target"
                      type="number"
                      value={String(newHabit.targetValue)}
                      onChange={(event) =>
                        setNewHabit((prev) => ({ ...prev, targetValue: Number(event.target.value) || prev.targetValue }))
                      }
                      required
                    />
                  </div>
                </div>
                {createHabitError && (
                  <p className="text-sm text-red-600">{createHabitError}</p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" isLoading={creatingHabit}>
                    Create Habit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Active Habit Challenges</h2>
            <Badge variant="accent">{habitChallenges.length}</Badge>
          </div>
          {habitChallenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-[var(--muted-foreground)]">
                No habits yet. Create a challenge to build consistent learning habits!
              </CardContent>
            </Card>
          ) : (
            habitChallenges.map((habit: HabitChallenge) => (
              <Card key={habit.id}>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-3">
                    {habit.name}
                    <Badge variant="secondary" size="sm">{habit.type.replace('_', ' ')}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                    <span>Current streak: <strong>{habit.currentStreak}</strong></span>
                    <span>Longest streak: <strong>{habit.longestStreak}</strong></span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-[var(--muted-foreground)]">{habit.description || 'Stay consistent to hit this goal every day.'}</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Daily target: <strong>{habit.targetValue}</strong>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCompleteToday(habit)}
                      isLoading={updatingHabitId === habit.id}
                    >
                      Mark Today Complete
                    </Button>
                  </div>
                  {renderProgressPills(habit)}
                </CardContent>
              </Card>
            ))
          )}
        </motion.section>
      </div>
    </DashboardLayout>
  );
}
