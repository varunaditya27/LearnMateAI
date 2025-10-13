/**
 * Leaderboard Page
 * 
 * Full leaderboard view with filtering and pagination.
 */

'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { mockLeaderboardData } from '@/lib/mockData';

export default function LeaderboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[var(--primary)]" />
            Leaderboard
          </h1>
          <p className="text-[var(--muted-foreground)]">
            See how you rank against other learners
          </p>
        </div>

        {/* Filter Options */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button variant="primary" size="sm">Weekly</Button>
              <Button variant="outline" size="sm">Monthly</Button>
              <Button variant="outline" size="sm">All Time</Button>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Leaderboard entries={mockLeaderboardData} currentUserId="user-1" />
      </div>
    </DashboardLayout>
  );
}
