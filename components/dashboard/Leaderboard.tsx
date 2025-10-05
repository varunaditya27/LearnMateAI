/**
 * Leaderboard Component
 * 
 * Consistent greyish theme leaderboard
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LeaderboardEntry } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  timeframe?: 'weekly' | 'monthly' | 'all-time';
  timeframeOptions?: Array<{ label: string; value: 'weekly' | 'monthly' | 'all-time' }>;
  onTimeframeChange?: (value: 'weekly' | 'monthly' | 'all-time') => void;
  loading?: boolean;
  errorMessage?: string;
  onRefresh?: () => void | Promise<unknown>;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  currentUserId,
  timeframe = 'weekly',
  timeframeOptions = [
    { label: 'This Week', value: 'weekly' },
    { label: 'This Month', value: 'monthly' },
    { label: 'All Time', value: 'all-time' },
  ],
  onTimeframeChange,
  loading = false,
  errorMessage,
  onRefresh,
}) => {
  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  const handleTimeframeClick = (value: 'weekly' | 'monthly' | 'all-time') => {
    if (value === timeframe) return;
    onTimeframeChange?.(value);
  };

  const hasEntries = entries.length > 0;
  const sortedEntries = useMemo(() => entries.slice().sort((a, b) => a.rank - b.rank), [entries]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>🏆 Leaderboard</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {timeframeOptions.map((option) => {
              const isActive = option.value === timeframe;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTimeframeClick(option.value)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    isActive
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                      : 'bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--muted)]'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRefresh?.()}
                disabled={loading}
              >
                Refresh
              </Button>
            )}
          </div>
        </div>
        {errorMessage && (
          <p className="text-sm text-[var(--destructive)] flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading && !hasEntries && (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full"
            />
          </div>
        )}

        {!loading && !hasEntries && (
          <p className="text-center text-sm text-[var(--muted-foreground)]">
            No leaderboard data yet. Keep learning to climb the charts!
          </p>
        )}

        {hasEntries && (
          <div className="space-y-4">
            {sortedEntries.map((entry, index) => {
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
        )}
      </CardContent>
    </Card>
  );
};