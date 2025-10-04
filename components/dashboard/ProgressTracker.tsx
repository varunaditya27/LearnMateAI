/**
 * Progress Tracker Component
 * 
 * Displays user's learning progress with visual elements.
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
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
    <Card className="bg-gradient-to-br from-[var(--primary)] to-purple-600 text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Your Progress</CardTitle>
          <Badge variant="accent" size="md">
            Level {level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm opacity-90">Concepts Completed</span>
            <span className="font-bold">{completedConcepts} / {totalConcepts}</span>
          </div>
          <Progress value={progressPercentage} color="accent" size="lg" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-xs opacity-75 mt-1">Total Points</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">🔥 {currentStreak}</div>
            <div className="text-xs opacity-75 mt-1">Day Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">⭐ {longestStreak}</div>
            <div className="text-xs opacity-75 mt-1">Best Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
