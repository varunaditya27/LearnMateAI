/**
 * Leaderboard Component
 * 
 * Displays top learners ranked by points and engagement.
 * 
 * TODO: Add filtering options (weekly, monthly, all-time)
 * TODO: Add user's current rank highlight
 * TODO: Implement real-time updates
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LeaderboardEntry } from '@/types';
import Image from 'next/image';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentUserId }) => {
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            return (
              <div
                key={entry.userId}
                className={`
                  flex items-center gap-4 p-3 rounded-lg
                  transition-colors duration-200
                  ${
                    isCurrentUser
                      ? 'bg-[var(--primary)]/10 border-2 border-[var(--primary)]'
                      : 'bg-[var(--muted)] hover:bg-[var(--muted)]/70'
                  }
                `}
              >
                {/* Rank */}
                <div className="w-12 text-center font-bold text-lg">
                  {getRankEmoji(entry.rank)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold overflow-hidden">
                  {entry.photoURL ? (
                    <Image 
                      src={entry.photoURL} 
                      alt={entry.displayName} 
                      width={40}
                      height={40}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    entry.displayName[0].toUpperCase()
                  )}
                </div>

                {/* Name and Level */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{entry.displayName}</span>
                    {isCurrentUser && (
                      <Badge variant="primary" size="sm">You</Badge>
                    )}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    Level {entry.level}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="font-bold text-[var(--primary)]">
                    {entry.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    points
                  </div>
                </div>

                {/* Streak */}
                <div className="hidden sm:block text-center">
                  <div className="text-xl">🔥</div>
                  <div className="text-xs font-semibold">{entry.streak}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
