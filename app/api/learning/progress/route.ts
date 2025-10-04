/**
 * Learning API - Progress Route
 * GET /api/learning/progress
 * POST /api/learning/progress
 * 
 * Track user progress on concepts and resources.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

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
    const conceptId = searchParams.get('conceptId');
    const resourceId = searchParams.get('resourceId');

    const progressRef = collection(db, 'progress');
    let q = query(progressRef, where('userId', '==', user.uid));

    if (conceptId) {
      q = query(q, where('conceptId', '==', conceptId));
    }

    if (resourceId) {
      q = query(q, where('resourceId', '==', resourceId));
    }

    const querySnapshot = await getDocs(q);

    const progress = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conceptId, resourceId, status, timeSpentMinutes, notes } = body;

    if (!conceptId) {
      return NextResponse.json(
        { success: false, error: 'conceptId is required' },
        { status: 400 }
      );
    }

    // Check if progress entry already exists
    const progressRef = collection(db, 'progress');
    const q = query(
      progressRef,
      where('userId', '==', user.uid),
      where('conceptId', '==', conceptId),
      where('resourceId', '==', resourceId || null)
    );
    const existingDocs = await getDocs(q);

    if (!existingDocs.empty) {
      // Update existing progress
      const docRef = doc(db, 'progress', existingDocs.docs[0].id);
      const currentData = existingDocs.docs[0].data();

      const updateData: Record<string, unknown> = {
        lastAccessedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (status !== undefined) {
        updateData.status = status;
        if (status === 'completed' && !currentData.completedAt) {
          updateData.completedAt = serverTimestamp();
        }
      }

      if (timeSpentMinutes !== undefined) {
        updateData.timeSpentMinutes = (currentData.timeSpentMinutes || 0) + timeSpentMinutes;
      }

      if (notes !== undefined) updateData.notes = notes;

      await updateDoc(docRef, updateData);

      const updatedDoc = await getDoc(docRef);

      return NextResponse.json({
        success: true,
        data: {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        },
      });
    } else {
      // Create new progress entry
      const newProgress = {
        userId: user.uid,
        conceptId,
        resourceId: resourceId || null,
        status: status || 'not-started',
        timeSpentMinutes: timeSpentMinutes || 0,
        notes: notes || '',
        startedAt: serverTimestamp(),
        lastAccessedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      if (status === 'completed') {
        Object.assign(newProgress, { completedAt: serverTimestamp() });
      }

      const docRef = await addDoc(progressRef, newProgress);

      return NextResponse.json({
        success: true,
        data: {
          id: docRef.id,
          ...newProgress,
        },
      });
    }
  } catch (error) {
    console.error('Update progress error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
