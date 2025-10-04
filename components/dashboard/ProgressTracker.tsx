/**
 * Progress Tracker Component
 * 
 * Consistent greyish theme with smooth animations
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ProgressTrackerProps {
  completedConcepts: number;
  totalConcepts: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  completedConcepts,
  totalConcepts,
  currentStreak,
  longestStreak,
  totalPoints,
  level,
}) => {
  const progressPercentage = totalConcepts > 0 
    ? (completedConcepts / totalConcepts) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Progress</CardTitle>
          <Badge variant="accent" size="md">
            Level {level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[var(--muted-foreground)]">Concepts Completed</span>
            <span className="font-bold">{completedConcepts} / {totalConcepts}</span>
          </div>
          <div className="w-full bg-[var(--muted)] rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-[var(--primary)] rounded-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--muted)] rounded-xl p-4 text-center hover:bg-[var(--muted)]/70 transition-colors"
          >
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-sm text-[var(--muted-foreground)] mt-1">Points</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[var(--muted)] rounded-xl p-4 text-center hover:bg-[var(--muted)]/70 transition-colors"
          >
            <div className="text-2xl font-bold">{currentStreak}</div>
            <div className="text-sm text-[var(--muted-foreground)] mt-1">Day Streak</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[var(--muted)] rounded-xl p-4 text-center hover:bg-[var(--muted)]/70 transition-colors"
          >
            <div className="text-2xl font-bold">{longestStreak}</div>
            <div className="text-sm text-[var(--muted-foreground)] mt-1">Best</div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};