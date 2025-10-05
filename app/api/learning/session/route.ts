/**
 * Learning Session Tracking API
 * 
 * POST /api/learning/session - Start a new session
 * PUT /api/learning/session - Update session progress
 * DELETE /api/learning/session - End session
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';

// Start new session
async function handlePost(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.uid;

    try {
      const body = await req.json();
      const { resourceId, conceptId, pathId, resourceType } = body;

      if (!resourceId) {
        return NextResponse.json(
          { error: 'Resource ID is required' },
          { status: 400 }
        );
      }

      // Create new session
      const sessionRef = await addDoc(collection(db, 'learningSessions'), {
        userId,
        resourceId,
        conceptId: conceptId || null,
        pathId: pathId || null,
        resourceType: resourceType || 'unknown',
        startTime: serverTimestamp(),
        totalDuration: 0,
        activeDuration: 0,
        focusTime: 0,
        pauseCount: 0,
        playbackSpeed: 1,
        progress: 0,
        completed: false,
        notes: [],
        engagementScore: 0,
        distractions: 0,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        sessionId: sessionRef.id,
        message: 'Session started successfully',
      });
    } catch (error) {
      console.error('Failed to start session:', error);
      return NextResponse.json(
        { error: 'Failed to start session' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// Update session progress
async function handlePut(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.uid;
    try {
      const body = await req.json();
      const { 
        sessionId, 
        progress, 
        watchTime,
        focusTime,
        playbackSpeed,
        notes,
        pauseCount,
        distractions,
      } = body;

      if (!sessionId) {
        return NextResponse.json(
          { error: 'Session ID is required' },
          { status: 400 }
        );
      }

      // Verify session ownership
      const sessionRef = doc(db, 'learningSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      const sessionData = sessionDoc.data();
      if (sessionData.userId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Build update object
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (progress !== undefined) updateData.progress = progress;
      if (watchTime !== undefined) updateData.totalDuration = watchTime;
      if (focusTime !== undefined) updateData.focusTime = focusTime;
      if (playbackSpeed !== undefined) updateData.playbackSpeed = playbackSpeed;
      if (notes !== undefined) updateData.notes = notes;
      if (pauseCount !== undefined) updateData.pauseCount = pauseCount;
      if (distractions !== undefined) updateData.distractions = distractions;

      // Calculate engagement score
      if (watchTime !== undefined && focusTime !== undefined && watchTime > 0) {
        const engagementScore = Math.round((focusTime / watchTime) * 100);
        updateData.engagementScore = Math.min(100, engagementScore);
      }

      // Update session
      await updateDoc(sessionRef, updateData);

      return NextResponse.json({
        success: true,
        message: 'Session updated successfully',
      });
    } catch (error) {
      console.error('Failed to update session:', error);
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// End session
async function handleDelete(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.uid;
    try {
      const { searchParams } = new URL(req.url);
      const sessionId = searchParams.get('sessionId');
      const completed = searchParams.get('completed') === 'true';
      const finalProgress = parseInt(searchParams.get('progress') || '0');

      if (!sessionId) {
        return NextResponse.json(
          { error: 'Session ID is required' },
          { status: 400 }
        );
      }

      // Verify session ownership
      const sessionRef = doc(db, 'learningSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      const sessionData = sessionDoc.data();
      if (sessionData.userId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Calculate final metrics
      const watchTime = sessionData.totalDuration || 0;
      const focusTime = sessionData.focusTime || 0;
      const engagementScore = watchTime > 0 
        ? Math.round((focusTime / watchTime) * 100)
        : 0;

      // Update session as completed
      await updateDoc(sessionRef, {
        endTime: serverTimestamp(),
        progress: finalProgress,
        completed,
        engagementScore: Math.min(100, engagementScore),
        status: 'completed',
        updatedAt: serverTimestamp(),
      });

      // Update user stats if completed
      if (completed) {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const stats = userData.stats || {};

          await updateDoc(userRef, {
            'stats.totalLearningTime': (stats.totalLearningTime || 0) + watchTime,
            'stats.completedResources': (stats.completedResources || 0) + 1,
            'stats.averageEngagement': engagementScore,
            'stats.lastActive': serverTimestamp(),
            points: (userData.points || 0) + Math.floor(watchTime / 60) * 5, // 5 points per minute
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Session ended successfully',
        stats: {
          watchTime,
          focusTime,
          engagementScore,
          pointsEarned: completed ? Math.floor(watchTime / 60) * 5 : 0,
        },
      });
    } catch (error) {
      console.error('Failed to end session:', error);
      return NextResponse.json(
        { error: 'Failed to end session' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export { handlePost as POST, handlePut as PUT, handleDelete as DELETE };
