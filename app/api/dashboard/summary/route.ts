/**
 * Dashboard API - Summary Route
 * GET /api/dashboard/summary
 * 
 * Get daily/weekly summary with AI insights.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day'; // 'day' or 'week'

    // Calculate date range
    const startDate = new Date();

    if (period === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    }

    // Get progress data
    const progressRef = collection(db, 'progress');
    const progressQuery = query(
      progressRef,
      where('userId', '==', user.uid),
      where('lastAccessedAt', '>=', Timestamp.fromDate(startDate))
    );
    const progressSnapshot = await getDocs(progressQuery);

    let completedConcepts = 0;
    let totalMinutesLearned = 0;

    progressSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'completed') {
        completedConcepts++;
      }
      totalMinutesLearned += data.timeSpentMinutes || 0;
    });

    // Get screen time data
    const screenTimeRef = collection(db, 'screenTimeLogs');
    const screenTimeQuery = query(
      screenTimeRef,
      where('userId', '==', user.uid),
      where('startTime', '>=', Timestamp.fromDate(startDate))
    );
    const screenTimeSnapshot = await getDocs(screenTimeQuery);

    let productiveMinutes = 0;
    let distractionMinutes = 0;

    screenTimeSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const minutes = data.durationMinutes || 0;
      
      if (data.appCategory === 'educational' || data.appCategory === 'productive') {
        productiveMinutes += minutes;
      } else {
        distractionMinutes += minutes;
      }
    });

    const totalScreenTime = productiveMinutes + distractionMinutes;
    const focusScore = totalScreenTime > 0 
      ? Math.round((productiveMinutes / totalScreenTime) * 100) 
      : 0;

    // Generate insights
    const insights = [];
    
    if (completedConcepts > 0) {
      insights.push(`🎯 Great job! You completed ${completedConcepts} concept${completedConcepts > 1 ? 's' : ''} this ${period}.`);
    }
    
    if (focusScore >= 70) {
      insights.push(`🔥 Excellent focus! Your productivity score is ${focusScore}%.`);
    } else if (focusScore >= 50) {
      insights.push(`💪 Good focus score of ${focusScore}%. Keep it up!`);
    } else if (totalScreenTime > 0) {
      insights.push(`⚠️ Your focus score is ${focusScore}%. Try reducing distractions.`);
    }

    if (totalMinutesLearned >= 60) {
      insights.push(`⏰ You've invested ${Math.round(totalMinutesLearned / 60)} hour${totalMinutesLearned >= 120 ? 's' : ''} in learning!`);
    }

    return NextResponse.json({
      success: true,
      data: {
        period,
        completedConcepts,
        totalMinutesLearned,
        totalHoursLearned: Math.round((totalMinutesLearned / 60) * 10) / 10,
        productiveMinutes,
        distractionMinutes,
        focusScore,
        insights,
      },
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get dashboard summary' },
      { status: 500 }
    );
  }
}
