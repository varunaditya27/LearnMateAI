/**
 * User API - Stats Route
 * GET /api/user/stats
 * PATCH /api/user/stats
 * 
 * Get and update user statistics (points, streaks, etc.).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

export async function GET() {
  try {
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    return NextResponse.json({
      success: true,
      data: userData.stats || {
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalMinutesLearned: 0,
        completedConcepts: 0,
        level: 1,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      pointsToAdd, 
      minutesToAdd, 
      conceptsToAdd, 
      currentStreak, 
      longestStreak 
    } = body;

    const userDocRef = doc(db, 'users', user.uid);
    
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    // Use Firebase increment for atomic updates
    if (pointsToAdd) updateData['stats.totalPoints'] = increment(pointsToAdd);
    if (minutesToAdd) updateData['stats.totalMinutesLearned'] = increment(minutesToAdd);
    if (conceptsToAdd) updateData['stats.completedConcepts'] = increment(conceptsToAdd);
    if (currentStreak !== undefined) updateData['stats.currentStreak'] = currentStreak;
    if (longestStreak !== undefined) updateData['stats.longestStreak'] = longestStreak;

    // Calculate level based on total points (100 points per level)
    if (pointsToAdd) {
      const userDoc = await getDoc(userDocRef);
      const currentPoints = userDoc.data()?.stats?.totalPoints || 0;
      const newPoints = currentPoints + pointsToAdd;
      const newLevel = Math.floor(newPoints / 100) + 1;
      updateData['stats.level'] = newLevel;
    }

    await updateDoc(userDocRef, updateData);

    const updatedDoc = await getDoc(userDocRef);

    return NextResponse.json({
      success: true,
      data: updatedDoc.data()?.stats,
    });
  } catch (error) {
    console.error('Update stats error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update stats' },
      { status: 500 }
    );
  }
}
