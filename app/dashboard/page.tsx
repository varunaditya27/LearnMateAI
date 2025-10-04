/**
 * Main Dashboard Page
 * 
 * Displays user's learning overview, progress, leaderboard, and quick actions.
 */

'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProgressTracker } from '@/components/dashboard/ProgressTracker';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { ScreenTimeWidget } from '@/components/dashboard/ScreenTimeWidget';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { mockLeaderboardData } from '@/lib/mockData';

export default function DashboardPage() {
  // TODO: Fetch actual user data from Firebase
  const mockUserStats = {
    completedConcepts: 12,
    totalConcepts: 45,
    currentStreak: 5,
    longestStreak: 12,
    totalPoints: 850,
    level: 4,
  };

  const recentActivity = [
    { id: '1', concept: 'React Hooks', time: '2 hours ago', type: 'completed' },
    { id: '2', concept: 'TypeScript Basics', time: '1 day ago', type: 'completed' },
    { id: '3', concept: 'State Management', time: '2 days ago', type: 'in-progress' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Here is your learning progress today
          </p>
        </div>

        {/* Progress Tracker */}
        <ProgressTracker {...mockUserStats} />

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>📚 Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{activity.concept}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">{activity.time}</p>
                    </div>
                    <Badge variant={activity.type === 'completed' ? 'success' : 'warning'}>
                      {activity.type === 'completed' ? '✓ Completed' : 'In Progress'}
                    </Badge>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/learning">
                <Button variant="outline" fullWidth className="mt-4">
                  Continue Learning
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>⚡ Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/learning">
                <Button variant="primary" fullWidth leftIcon={<span>🎯</span>}>
                  Start New Learning Path
                </Button>
              </Link>
              <Link href="/dashboard/progress">
                <Button variant="secondary" fullWidth leftIcon={<span>📈</span>}>
                  View Detailed Progress
                </Button>
              </Link>
              <Button variant="outline" fullWidth leftIcon={<span>💡</span>}>
                Ask AI a Question
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard and Screen Time */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Leaderboard entries={mockLeaderboardData} />
          <ScreenTimeWidget />
        </div>

        {/* Daily Challenge */}
        <Card className="bg-gradient-to-r from-[var(--accent)] to-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-white">🎯 Today&apos;s Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Complete 3 concepts to maintain your streak!</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-white w-[40%]" />
              </div>
              <span className="font-bold">1/3</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
