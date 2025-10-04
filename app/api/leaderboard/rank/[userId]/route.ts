/**
 * Leaderboard API - User Rank Route
 * GET /api/leaderboard/rank/[userId]
 * 
 * Get a specific user's rank and position on the leaderboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get user data
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const userPoints = userData.stats?.totalPoints || 0;

    // Get all users sorted by points to calculate rank
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('stats.totalPoints', 'desc'));
    const querySnapshot = await getDocs(q);

    let rank = 0;
    let totalUsers = 0;

    querySnapshot.docs.forEach((doc, index) => {
      totalUsers++;
      if (doc.id === userId) {
        rank = index + 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        displayName: userData.displayName || 'Anonymous',
        photoURL: userData.photoURL || null,
        points: userPoints,
        streak: userData.stats?.currentStreak || 0,
        rank,
        level: userData.stats?.level || 1,
        totalUsers,
        percentile: totalUsers > 0 ? Math.round(((totalUsers - rank) / totalUsers) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Get user rank error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get user rank' },
      { status: 500 }
    );
  }
}
