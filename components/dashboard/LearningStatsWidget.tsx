/**
 * Learning Statistics Widget
 * 
 * Displays comprehensive learning analytics:
 * - Learning time and focus time
 * - Engagement score and completion rate
 * - Daily activity heatmap
 * - Current and best streak with fire animations
 * - Recent session history
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface SessionSummary {
  totalSessions: number;
  completedSessions: number;
  totalLearningTime: number;
  totalFocusTime: number;
  averageFocusTime: number;
  averageEngagement: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
}

interface DailyStat {
  date: string;
  sessions: number;
  learningTime: number;
  focusTime: number;
  completed: number;
}

interface RecentSession {
  id: string;
  resourceId: string;
  resourceType: string;
  duration: number;
  completed: boolean;
  engagementScore: number;
  startTime: unknown;
}

interface StatsData {
  summary: SessionSummary;
  dailyStats: DailyStat[];
  recentSessions: RecentSession[];
}

export default function LearningStatsWidget() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // days
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/learning/session/summary?days=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Format seconds to human-readable time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get intensity color for heatmap
  const getIntensityColor = (sessions: number): string => {
    if (sessions === 0) return 'bg-gray-100';
    if (sessions <= 2) return 'bg-green-200';
    if (sessions <= 4) return 'bg-green-400';
    if (sessions <= 6) return 'bg-green-600';
    return 'bg-green-800';
  };

  // Get engagement color
  const getEngagementColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-red-600">{error || 'Failed to load statistics'}</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, dailyStats } = stats;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {[7, 14, 30, 90].map((days) => (
          <button
            key={days}
            onClick={() => setTimeRange(days)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === days
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {days} days
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Sessions</CardDescription>
            <CardTitle className="text-3xl">{summary.totalSessions}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Learning Time</CardDescription>
            <CardTitle className="text-3xl">{formatTime(summary.totalLearningTime)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl">{summary.completionRate}%</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Avg Engagement</CardDescription>
            <CardTitle className={`text-3xl ${getEngagementColor(summary.averageEngagement)}`}>
              {summary.averageEngagement}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Streaks Section */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Streaks 🔥</CardTitle>
          <CardDescription>Keep the momentum going!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Current Streak</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={summary.currentStreak}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-6xl font-bold text-orange-600"
                >
                  {summary.currentStreak}
                  <span className="text-4xl ml-2">🔥</span>
                </motion.div>
              </AnimatePresence>
              <div className="text-sm text-gray-600 mt-2">
                {summary.currentStreak === 1 ? 'day' : 'days'}
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Best Streak</div>
              <div className="text-6xl font-bold text-blue-600">
                {summary.bestStreak}
                <span className="text-4xl ml-2">🏆</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {summary.bestStreak === 1 ? 'day' : 'days'}
              </div>
            </div>
          </div>

          {summary.currentStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-orange-50 rounded-lg text-center"
            >
              <p className="text-orange-800 font-medium">
                {summary.currentStreak >= summary.bestStreak
                  ? "🎉 You're on your best streak ever! Keep it up!"
                  : `💪 ${summary.bestStreak - summary.currentStreak} more day${summary.bestStreak - summary.currentStreak === 1 ? '' : 's'} to beat your record!`}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Activity</CardTitle>
          <CardDescription>Daily session heatmap for the last {timeRange} days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {dailyStats.map((day, index) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="group relative"
                >
                  <div
                    className={`
                      ${getIntensityColor(day.sessions)}
                      aspect-square rounded-lg cursor-pointer
                      transition-transform hover:scale-110
                      flex items-center justify-center
                    `}
                  >
                    <span className="text-xs font-medium text-gray-700">
                      {day.sessions > 0 ? day.sessions : ''}
                    </span>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="
                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                    opacity-0 group-hover:opacity-100
                    transition-opacity pointer-events-none
                    bg-gray-900 text-white text-xs rounded-lg py-2 px-3
                    whitespace-nowrap z-10
                  ">
                    <div className="font-medium">{dayName}, {dateStr}</div>
                    <div className="text-gray-300 mt-1">
                      {day.sessions} session{day.sessions !== 1 ? 's' : ''}
                    </div>
                    <div className="text-gray-300">
                      {formatTime(day.learningTime)}
                    </div>
                    {day.sessions > 0 && (
                      <div className="text-green-400">
                        {day.completed} completed
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <div className="w-4 h-4 bg-green-200 rounded"></div>
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <div className="w-4 h-4 bg-green-800 rounded"></div>
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Focus & Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Total Focus Time</span>
                <span className="font-medium">{formatTime(summary.totalFocusTime)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(summary.totalFocusTime / summary.totalLearningTime) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Average Session Focus</span>
                <span className="font-medium">{formatTime(summary.averageFocusTime)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((summary.averageFocusTime / 1800) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Engagement Score</span>
                <span className={`font-medium ${getEngagementColor(summary.averageEngagement)}`}>
                  {summary.averageEngagement}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    summary.averageEngagement >= 80
                      ? 'bg-green-600'
                      : summary.averageEngagement >= 60
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  }`}
                  style={{
                    width: `${summary.averageEngagement}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Sessions Started</span>
              <Badge>{summary.totalSessions}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Sessions Completed</span>
              <Badge className="bg-green-600 text-white">{summary.completedSessions}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Completion Rate</span>
              <Badge className={
                summary.completionRate >= 80 ? 'bg-green-600 text-white' :
                summary.completionRate >= 60 ? 'bg-yellow-600 text-white' :
                'bg-red-600 text-white'
              }>
                {summary.completionRate}%
              </Badge>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(summary.totalLearningTime / 60)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Total Minutes Learned
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
