/**
 * Leaderboard Component
 * 
 * Consistent greyish theme leaderboard
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LeaderboardEntry } from '@/types';
import Image from 'next/image';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentUserId }) => {
  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry, index) => {
            const isCurrentUser = entry.userId === currentUserId;
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex items-center gap-10 p-4 rounded-xl transition-all ${isCurrentUser ? 'bg-[var(--primary)]/10 border-2 border-[var(--primary)]' : 'bg-[var(--muted)] hover:bg-[var(--muted)]/70'}`}
              >
                <div className="w-12 text-center font-bold text-lg">
                  {getRankDisplay(entry.rank)}
                </div>

                <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-bold overflow-hidden">
                  {entry.photoURL ? (
                    <Image 
                      src={entry.photoURL} 
                      alt={entry.displayName} 
                      width={48}
                      height={48}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    entry.displayName[0].toUpperCase()
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--foreground)]">{entry.displayName}</span>
                    {isCurrentUser && (
                      <Badge variant="primary" size="sm">You</Badge>
                    )}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    Level {entry.level}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-[var(--primary)]">
                    {entry.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    points
                  </div>
                </div>

                <div className="hidden sm:block text-center">
                  <div className="text-xl">🔥</div>
                  <div className="text-xs font-semibold">{entry.streak}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};