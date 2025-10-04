/**
 * Main Dashboard Page
 * 
 * Consistent greyish theme with improved button UX
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProgressTracker } from '@/components/dashboard/ProgressTracker';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { ScreenTimeWidget } from '@/components/dashboard/ScreenTimeWidget';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { mockLeaderboardData } from '@/lib/mockData';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const mockUserStats = {
    completedConcepts: 12,
    totalConcepts: 45,
    currentStreak: 5,
    longestStreak: 12,
    totalPoints: 850,
    level: 4,
  };

  const recentActivity = [
    {
      id: '1',
      title: 'Understanding React Hooks',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
      progress: 75,
      duration: '12:30',
      totalDuration: '18:00',
    },
    {
      id: '2',
      title: 'TypeScript Best Practices',
      thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop',
      progress: 100,
      duration: '15:45',
      totalDuration: '15:45',
    },
    {
      id: '3',
      title: 'Next.js App Router Guide',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop',
      progress: 45,
      duration: '8:20',
      totalDuration: '20:00',
    },
    {
      id: '4',
      title: 'State Management Patterns',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
      progress: 30,
      duration: '5:10',
      totalDuration: '16:30',
    },
  ];

  return (
    <DashboardLayout>
  <div className="space-y-12 mt-12 px-4">    
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-5xl lg:text-5xl md:text-5xl font-bold mb-5 px-2">
            Welcome back
          </h1>
          <p className="text-3xl text-[var(--muted-foreground)] px-2">
            Continue your learning journey !
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Today's Challenge - Same card style */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Challenge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)] md:!text-2xl mb-6">
                Complete 3 concepts to maintain your streak
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-[var(--muted)] rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '33%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-[var(--primary)] rounded-full"
                  />
                </div>
                <span className="font-bold text-xl">1/3</span>
              </div>
            </CardContent>
          </Card>

          <ProgressTracker {...mockUserStats} />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold mb-6">Continue Watching</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-6 pb-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex-shrink-0 w-[320px] bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={activity.thumbnail}
                      alt={activity.title}
                      className="w-full h-[180px] object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--muted)]">
                      <div
                        className="h-full bg-[var(--primary)]"
                        style={{ width: `${activity.progress}%` }}
                      />
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-white text-xs font-semibold">
                      {activity.duration} / {activity.totalDuration}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-3 line-clamp-2">
                      {activity.title}
                    </h3>
                    <Button variant="primary" fullWidth>
                      {activity.progress === 100 ? 'Watch Again' : 'Continue'}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

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
  <CardContent className="flex  flex-col  !gap-5">
  <Link href="/dashboard/learning">
    <Button variant="primary" fullWidth leftIcon={<span>🎯</span>}>
        Start New Learning Path
      </Button>
    </Link>
    <Link href="/dashboard/progress">
      <Button variant="secondary" fullWidth leftIcon={<span>📈</span>}>
        View Your Progress
      </Button>
    </Link>
    <Button variant="outline" fullWidth leftIcon={<span>💡</span>}>
      Ask AI a Question
    </Button>
  </CardContent>
</Card>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Leaderboard entries={mockLeaderboardData} />
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