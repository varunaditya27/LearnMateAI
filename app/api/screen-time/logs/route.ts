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
    let logs: Array<{ id: string; [key: string]: unknown }> = [];

    try {
      let q;
      
      if (date) {
        // Query by specific date
        q = query(logsRef, where('userId', '==', auth.uid), where('date', '==', date));
      } else if (startDate && endDate) {
        // Query by date range using startTime
        const start = Timestamp.fromDate(new Date(startDate));
        const end = Timestamp.fromDate(new Date(endDate));
        q = query(
          logsRef,
          where('userId', '==', auth.uid),
          where('startTime', '>=', start),
          where('startTime', '<=', end),
          orderBy('startTime', 'desc')
        );
      } else {
        // Default: get all logs for user, ordered by startTime
        q = query(logsRef, where('userId', '==', auth.uid), orderBy('startTime', 'desc'));
      }

      const querySnapshot = await getDocs(q);

      logs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          appName: data.appName,
          appCategory: data.appCategory,
          durationMinutes: data.durationMinutes,
          date: data.date,
          startTime: data.startTime?.toDate?.()?.toISOString() || data.startTime,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        };
      });
    } catch (err: unknown) {
      // Fallback if index is missing
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'failed-precondition') {
        console.warn('[screen-time/logs] Missing index, using fallback query without ordering');
        
        // Fallback: fetch without ordering
        let fallbackQuery;
        if (date) {
          fallbackQuery = query(logsRef, where('userId', '==', auth.uid), where('date', '==', date));
        } else {
          fallbackQuery = query(logsRef, where('userId', '==', auth.uid));
        }
        
        const querySnapshot = await getDocs(fallbackQuery);
        logs = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            appName: data.appName,
            appCategory: data.appCategory,
            durationMinutes: data.durationMinutes,
            date: data.date,
            startTime: data.startTime?.toDate?.()?.toISOString() || data.startTime,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          };
        });
        
        // Sort client-side if needed
        if (startDate && endDate) {
          const startTime = new Date(startDate).getTime();
          const endTime = new Date(endDate).getTime();
          logs = logs.filter(log => {
            const logTime = new Date(log.date as string).getTime();
            return logTime >= startTime && logTime <= endTime;
          });
        }
        
        // Sort by date descending
        logs.sort((a, b) => {
          const dateA = new Date(a.startTime as string || a.date as string).getTime();
          const dateB = new Date(b.startTime as string || b.date as string).getTime();
          return dateB - dateA;
        });
      } else {
        throw err;
      }
    }

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
