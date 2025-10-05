/**
 * Session Summary API
 * GET /api/learning/session/summary - Get user learning statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.uid;

    try {
      const { searchParams } = new URL(req.url);
      const days = parseInt(searchParams.get('days') || '7');

      // Calculate date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Query sessions
      const sessionsQuery = query(
        collection(db, 'learningSessions'),
        where('userId', '==', userId),
        where('startTime', '>=', Timestamp.fromDate(startDate)),
        orderBy('startTime', 'desc')
      );

      const snapshot = await getDocs(sessionsQuery);
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate statistics
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter((s: Record<string, unknown>) => s.completed === true);
      const totalLearningTime = sessions.reduce((sum: number, s: Record<string, unknown>) => 
        sum + ((s.totalDuration as number) || 0), 0
      );
      const totalFocusTime = sessions.reduce((sum: number, s: Record<string, unknown>) => 
        sum + ((s.focusTime as number) || 0), 0
      );
      const totalEngagement = sessions.reduce((sum: number, s: Record<string, unknown>) => 
        sum + ((s.engagementScore as number) || 0), 0
      );

      const averageFocusTime = totalSessions > 0 ? Math.round(totalFocusTime / totalSessions) : 0;
      const averageEngagement = totalSessions > 0 ? Math.round(totalEngagement / totalSessions) : 0;
      const completionRate = totalSessions > 0 
        ? Math.round((completedSessions.length / totalSessions) * 100) 
        : 0;

      // Calculate streaks
      const streaks = calculateStreaks(sessions);

      // Daily breakdown
      const dailyStats = calculateDailyStats(sessions, days);

      return NextResponse.json({
        success: true,
        summary: {
          totalSessions,
          completedSessions: completedSessions.length,
          totalLearningTime, // seconds
          totalFocusTime, // seconds
          averageFocusTime, // seconds
          averageEngagement, // percentage
          completionRate, // percentage
          currentStreak: streaks.currentStreak,
          bestStreak: streaks.bestStreak,
        },
        dailyStats,
        recentSessions: sessions.slice(0, 10).map((s: Record<string, unknown>) => ({
          id: s.id,
          resourceId: s.resourceId,
          resourceType: s.resourceType,
          duration: s.totalDuration,
          completed: s.completed,
          engagementScore: s.engagementScore,
          startTime: s.startTime,
        })),
      });
    } catch (error) {
      console.error('Failed to get session summary:', error);
      return NextResponse.json(
        { error: 'Failed to get session summary' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// Calculate learning streaks
function calculateStreaks(sessions: Record<string, unknown>[]) {
  if (sessions.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Get completed sessions grouped by date
  const completedSessions = sessions.filter((s: Record<string, unknown>) => s.completed === true);
  const sessionDates = completedSessions.map((s: Record<string, unknown>) => {
    const timestamp = s.startTime;
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return new Date((timestamp as { toDate: () => Date }).toDate()).toDateString();
    }
    return new Date().toDateString();
  });

  const uniqueDates = [...new Set(sessionDates)].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Calculate current streak
  const checkDate = new Date();
  for (const date of uniqueDates) {
    const expectedDate = checkDate.toDateString();
    
    if (date === expectedDate) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best streak
  for (let i = 0; i < uniqueDates.length; i++) {
    tempStreak = 1;
    let prevDate = new Date(uniqueDates[i]);

    for (let j = i + 1; j < uniqueDates.length; j++) {
      const currDate = new Date(uniqueDates[j]);
      const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
        prevDate = currDate;
      } else {
        break;
      }
    }

    bestStreak = Math.max(bestStreak, tempStreak);
  }

  return { currentStreak, bestStreak };
}

// Calculate daily statistics
function calculateDailyStats(sessions: Record<string, unknown>[], days: number) {
  const dailyMap = new Map<string, {
    sessions: number;
    learningTime: number;
    focusTime: number;
    completed: number;
  }>();

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    dailyMap.set(dateStr, {
      sessions: 0,
      learningTime: 0,
      focusTime: 0,
      completed: 0,
    });
  }

  // Populate with session data
  sessions.forEach((session: Record<string, unknown>) => {
    const timestamp = session.startTime;
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      const dateStr = new Date((timestamp as { toDate: () => Date }).toDate()).toDateString();
      const stats = dailyMap.get(dateStr);
      
      if (stats) {
        stats.sessions++;
        stats.learningTime += (session.totalDuration as number) || 0;
        stats.focusTime += (session.focusTime as number) || 0;
        if (session.completed) stats.completed++;
      }
    }
  });

  // Convert to array format
  return Array.from(dailyMap.entries()).map(([date, stats]) => ({
    date,
    ...stats,
  })).reverse(); // Oldest first
}
