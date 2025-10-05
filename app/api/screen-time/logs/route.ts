/**
 * Screen Time API - Logs Route
 * GET /api/screen-time/logs
 * POST /api/screen-time/logs
 * 
 * Track and retrieve screen time data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Format: YYYY-MM-DD
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const logsRef = collection(db, 'screenTimeLogs');
    let q = query(logsRef, where('userId', '==', auth.uid), orderBy('startTime', 'desc'));

    if (date) {
      q = query(logsRef, where('userId', '==', auth.uid), where('date', '==', date));
    } else if (startDate && endDate) {
      const start = Timestamp.fromDate(new Date(startDate));
      const end = Timestamp.fromDate(new Date(endDate));
      q = query(
        logsRef,
        where('userId', '==', auth.uid),
        where('startTime', '>=', start),
        where('startTime', '<=', end)
      );
    }

    const querySnapshot = await getDocs(q);

    const logs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get screen time logs error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get screen time logs' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { appName, appCategory, durationMinutes, date } = body;

    if (!appName || !appCategory || !durationMinutes) {
      return NextResponse.json(
        { success: false, error: 'appName, appCategory, and durationMinutes are required' },
        { status: 400 }
      );
    }

    const validCategories = ['productive', 'social', 'entertainment', 'educational', 'other'];
    if (!validCategories.includes(appCategory)) {
      return NextResponse.json(
        { success: false, error: 'Invalid appCategory' },
        { status: 400 }
      );
    }

    const now = new Date();
    const logDate = date || now.toISOString().split('T')[0];

    const logsRef = collection(db, 'screenTimeLogs');
    const docRef = await addDoc(logsRef, {
      userId: auth.uid,
      appName,
      appCategory,
      durationMinutes,
      date: logDate,
      startTime: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        userId: auth.uid,
        appName,
        appCategory,
        durationMinutes,
        date: logDate,
      },
    });
  } catch (error) {
    console.error('Create screen time log error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to create screen time log' },
      { status: 500 }
    );
  }
});
