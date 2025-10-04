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
  { name: 'Instagram', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg', url: 'https://instagram.com', category: 'social' },
  { name: 'YouTube', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg', url: 'https://youtube.com', category: 'entertainment' },
  { name: 'Twitter', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg', url: 'https://twitter.com', category: 'social' },
  { name: 'Reddit', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/reddit.svg', url: 'https://reddit.com', category: 'social' },
  { name: 'Netflix', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/netflix.svg', url: 'https://netflix.com', category: 'entertainment' },
  { name: 'LinkedIn', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg', url: 'https://linkedin.com', category: 'productive' },
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
    className="mb-6 !p-6 bg-[var(--accent)]/10 border border-[var(--accent)] rounded-xl"
  >
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="var(--muted)"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke={elapsedTime > 2700 ? '#ef4444' : elapsedTime > 1800 ? '#f59e0b' : '#10b981'}
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - Math.min(elapsedTime / 2700, 1))}`}
              className="transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        <div>
          <p className="font-semibold text-[var(--foreground)]">{activeSession.appName}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            {elapsedTime < 2700 ? `${Math.floor((2700 - elapsedTime) / 60)} min left` : 'Over 45 min!'}
          </p>
        </div>
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
  className="flex flex-col items-center gap-3 p-5 rounded-xl bg-[var(--muted)] hover:bg-[var(--muted)]/70 transition-colors"
>
  <img src={app.icon} alt={app.name} className="w-10 h-10 mt-3" style={{ filter: 'grayscale(0%)' }} />
  <span className="text-md font-semibold text-center text-[var(--foreground)]">{app.name}</span>
<span className="!px-3 !py-1 sm:!px-4 sm:!py-1.5 text-xs mb-2 font-semibold rounded-full bg-orange-100 text-orange-700">    {app.category}
  </span>
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