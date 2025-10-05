/**
 * Screen Time API - Analytics Route
 * GET /api/screen-time/analytics
 * 
 * Get aggregated screen time analytics and insights.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // 'day', 'week', 'month'

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const logsRef = collection(db, 'screenTimeLogs');
    const q = query(
      logsRef,
      where('userId', '==', auth.uid),
      where('startTime', '>=', Timestamp.fromDate(startDate)),
      where('startTime', '<=', Timestamp.fromDate(endDate))
    );

    const querySnapshot = await getDocs(q);

    // Aggregate data by category
    const categoryTotals: Record<string, number> = {
      productive: 0,
      social: 0,
      entertainment: 0,
      educational: 0,
      other: 0,
    };

    const appTotals: Record<string, number> = {};
    let totalMinutes = 0;

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const minutes = data.durationMinutes || 0;
      const category = data.appCategory || 'other';
      const app = data.appName;

      totalMinutes += minutes;
      categoryTotals[category] = (categoryTotals[category] || 0) + minutes;
      appTotals[app] = (appTotals[app] || 0) + minutes;
    });

    // Get top apps
    const topApps = Object.entries(appTotals)
      .map(([appName, minutes]) => ({ appName, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    // Calculate focus score (educational + productive vs total)
    const productiveMinutes = (categoryTotals.educational || 0) + (categoryTotals.productive || 0);
    const focusScore = totalMinutes > 0 ? Math.round((productiveMinutes / totalMinutes) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        period,
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        categoryBreakdown: categoryTotals,
        topApps,
        focusScore,
        productiveMinutes,
        distractionMinutes: totalMinutes - productiveMinutes,
      },
    });
  } catch (error) {
    console.error('Get screen time analytics error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get screen time analytics' },
      { status: 500 }
    );
  }
});
