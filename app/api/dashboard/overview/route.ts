/**
 * Dashboard API - Overview Route
 * GET /api/dashboard/overview
 * 
 * Get comprehensive dashboard data including stats, progress, and recent activity.
 */

import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user profile and stats
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Get recent progress (last 5 items)
    const progressRef = collection(db, 'progress');
    const progressQuery = query(
      progressRef,
      where('userId', '==', user.uid),
      orderBy('lastAccessedAt', 'desc'),
      limit(5)
    );
    const progressSnapshot = await getDocs(progressQuery);
    const recentProgress = progressSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get active learning paths
    const pathsRef = collection(db, 'learningPaths');
    const pathsQuery = query(
      pathsRef,
      where('userId', '==', user.uid),
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
      where('userId', '==', user.uid),
      where('date', '==', today)
    );
    const screenTimeSnapshot = await getDocs(screenTimeQuery);
    let todayScreenTime = 0;
    screenTimeSnapshot.docs.forEach((doc) => {
      todayScreenTime += doc.data().durationMinutes || 0;
    });

    // Get user's leaderboard rank
    const usersRef = collection(db, 'users');
    const leaderboardQuery = query(usersRef, orderBy('stats.totalPoints', 'desc'));
    const leaderboardSnapshot = await getDocs(leaderboardQuery);
    
    let rank = 0;
    leaderboardSnapshot.docs.forEach((doc, index) => {
      if (doc.id === user.uid) {
        rank = index + 1;
      }
    });

    // Calculate daily goal progress
    const dailyGoalMinutes = userData.preferences?.dailyGoalMinutes || 60;
    const dailyGoalProgress = Math.min(100, Math.round((todayScreenTime / dailyGoalMinutes) * 100));

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          email: user.email,
        },
        stats: userData.stats || {
          totalPoints: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalMinutesLearned: 0,
          completedConcepts: 0,
          level: 1,
          rank: rank || null,
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
