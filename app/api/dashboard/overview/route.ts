/**
 * Dashboard API - Overview Route
 * GET /api/dashboard/overview
 * 
 * Get comprehensive dashboard data including stats, progress, and recent activity.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { verifyAuth } from '@/lib/auth-middleware';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    const userId = authResult.uid;

    // Get user profile and stats
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    const userData = userDoc.data();

    // Get recent progress (last 5 items)
    // NOTE: If missing composite index on (userId, lastAccessedAt), fallback to fetching without ordering
    let recentProgress: Array<{ id: string; [key: string]: unknown }> = [];
    try {
      const progressRef = collection(db, 'progress');
      const progressQuery = query(
        progressRef,
        where('userId', '==', userId),
        orderBy('lastAccessedAt', 'desc'),
        limit(5)
      );
      const progressSnapshot = await getDocs(progressQuery);
      recentProgress = progressSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'failed-precondition') {
        console.warn('[overview] Missing index for progress query. Fetching without ordering. Error:', 'message' in err ? (err as { message?: string }).message : '');
        // Fallback: fetch without ordering
        const progressRef = collection(db, 'progress');
        const fallbackQuery = query(
          progressRef,
          where('userId', '==', userId),
          limit(5)
        );
        const progressSnapshot = await getDocs(fallbackQuery);
        recentProgress = progressSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
      } else {
        console.warn('[overview] Progress query error (non-fatal):', err);
        recentProgress = [];
      }
    }

    // Get active learning paths
    const pathsRef = collection(db, 'learningPaths');
    const pathsQuery = query(
      pathsRef,
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    const pathsSnapshot = await getDocs(pathsQuery);
    const activePaths = pathsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get today's screen time
    const today = new Date().toISOString().split('T')[0];
    const screenTimeRef = collection(db, 'screenTimeLogs');
    const screenTimeQuery = query(
      screenTimeRef,
      where('userId', '==', userId),
      where('date', '==', today)
    );
    const screenTimeSnapshot = await getDocs(screenTimeQuery);
    let todayScreenTime = 0;
    screenTimeSnapshot.docs.forEach((doc) => {
      todayScreenTime += doc.data().durationMinutes || 0;
    });

    // Get user's leaderboard rank (graceful fallback if index / large scan problematic)
    let rank: number | null = null;
    try {
      const usersRef = collection(db, 'users');
      // Optimization: fetch only top N to see if user is within first N, else skip to fallback
      const TOP_WINDOW = 200; // adjustable window size
      const topQuery = query(usersRef, orderBy('stats.totalPoints', 'desc'), limit(TOP_WINDOW));
      const topSnapshot = await getDocs(topQuery);
      for (let i = 0; i < topSnapshot.docs.length; i++) {
        if (topSnapshot.docs[i].id === userId) {
          rank = i + 1;
          break;
        }
      }

      if (rank === null) {
        // Fallback strategy: fetch the user's own points then count how many users have more points using a paged approximation.
        // NOTE: Precise rank without a full scan or appropriate index is costly; we report null in this degraded path.
        // A composite index on stats.totalPoints descending is typically automatic; additional filters would need manual index.
        rank = null; // leave null to indicate unknown beyond top window
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'failed-precondition') {
        const message = 'message' in err ? (err as { message?: string }).message : undefined;
        console.warn('[overview] Missing index for rank computation. Returning rank=null. Error:', message);
        rank = null;
      } else {
        console.warn('[overview] Rank computation error (non-fatal):', err);
        rank = null;
      }
    }

    // Calculate daily goal progress
  const dailyGoalMinutes = userData.preferences?.dailyGoalMinutes || 60;
  const dailyGoalProgress = dailyGoalMinutes > 0 ? Math.min(100, Math.round((todayScreenTime / dailyGoalMinutes) * 100)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userId,
          displayName: userData.displayName || 'Anonymous',
          photoURL: userData.photoURL || null,
          email: userData.email || null,
        },
        stats: userData.stats || {
          totalPoints: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalMinutesLearned: 0,
          completedConcepts: 0,
          level: 1,
          rank: rank,
        },
        recentProgress,
        activePaths,
        todayActivity: {
          screenTimeMinutes: todayScreenTime,
          dailyGoalMinutes,
          dailyGoalProgress,
        },
        leaderboardRank: rank,
      },
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get dashboard overview' },
      { status: 500 }
    );
  }
}
