/**
 * Screen Time Widget Component
 * 
 * Consistent greyish theme screen time tracker
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface AppShortcut {
  name: string;
  icon: string;
  url: string;
  category: 'social' | 'entertainment' | 'productive';
}

const appShortcuts: AppShortcut[] = [
  { name: 'Instagram', icon: '📷', url: 'https://instagram.com', category: 'social' },
  { name: 'YouTube', icon: '▶️', url: 'https://youtube.com', category: 'entertainment' },
  { name: 'Twitter', icon: '🐦', url: 'https://twitter.com', category: 'social' },
  { name: 'Reddit', icon: '🤖', url: 'https://reddit.com', category: 'social' },
  { name: 'Netflix', icon: '🎬', url: 'https://netflix.com', category: 'entertainment' },
  { name: 'LinkedIn', icon: '💼', url: 'https://linkedin.com', category: 'productive' },
];

interface TrackedSession {
  appName: string;
  startTime: number;
  url: string;
}

export const ScreenTimeWidget: React.FC = () => {
  const [activeSession, setActiveSession] = useState<TrackedSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeSession.startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const handleAppClick = (app: AppShortcut) => {
    if (activeSession) {
      const sessionDuration = Math.floor((Date.now() - activeSession.startTime) / 1000);
      setTodayTotal((prev) => prev + sessionDuration);
      setActiveSession(null);
      setElapsedTime(0);
    }

    window.open(app.url, '_blank');

    setActiveSession({
      appName: app.name,
      startTime: Date.now(),
      url: app.url,
    });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getCategoryColor = (category: AppShortcut['category']) => {
    switch (category) {
      case 'social': return 'warning';
      case 'entertainment': return 'danger';
      case 'productive': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Screen Time</CardTitle>
          <Badge variant="accent">{formatTime(todayTotal)} today</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-[var(--accent)]/10 border border-[var(--accent)] rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[var(--foreground)]">Tracking: {activeSession.appName}</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {formatTime(elapsedTime)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const sessionDuration = Math.floor((Date.now() - activeSession.startTime) / 1000);
                  setTodayTotal((prev) => prev + sessionDuration);
                  setActiveSession(null);
                  setElapsedTime(0);
                }}
              >
                Stop
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {appShortcuts.map((app, index) => (
            <motion.button
              key={app.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAppClick(app)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--muted)] hover:bg-[var(--muted)]/70 transition-colors"
            >
              <span className="text-3xl">{app.icon}</span>
              <span className="text-xs font-medium text-center text-[var(--foreground)]">{app.name}</span>
              <Badge variant={getCategoryColor(app.category)} size="sm">
                {app.category}
              </Badge>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-[var(--muted)] rounded-xl"
        >
          <p className="text-sm text-[var(--muted-foreground)]">
            Click an app to start tracking. Return here to stop the timer.
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
};