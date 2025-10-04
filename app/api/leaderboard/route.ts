/**
 * Leaderboard API Route
 * GET /api/leaderboard
 * 
 * Get leaderboard rankings with filtering options.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, where, getDocs, Timestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all-time'; // 'weekly', 'monthly', 'all-time'
    const limitCount = parseInt(searchParams.get('limit') || '10');

    const usersRef = collection(db, 'users');
    let q = query(usersRef, orderBy('stats.totalPoints', 'desc'), limit(limitCount));

    // Filter by timeframe
    if (timeframe === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      q = query(
        usersRef,
        where('updatedAt', '>=', Timestamp.fromDate(weekAgo)),
        orderBy('stats.totalPoints', 'desc'),
        limit(limitCount)
      );
    } else if (timeframe === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      q = query(
        usersRef,
        where('updatedAt', '>=', Timestamp.fromDate(monthAgo)),
        orderBy('stats.totalPoints', 'desc'),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);

    const leaderboard = querySnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        userId: doc.id,
        displayName: data.displayName || 'Anonymous',
        photoURL: data.photoURL || null,
        points: data.stats?.totalPoints || 0,
        streak: data.stats?.currentStreak || 0,
        rank: index + 1,
        level: data.stats?.level || 1,
        badge: data.badge || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: leaderboard,
      meta: {
        timeframe,
        total: leaderboard.length,
      },
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get leaderboard' },
      { status: 500 }
    );
  }
}
