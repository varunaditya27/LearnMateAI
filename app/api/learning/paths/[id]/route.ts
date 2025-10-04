/**
 * Learning API - Path by ID Route
 * GET /api/learning/paths/[id]
 * PUT /api/learning/paths/[id]
 * DELETE /api/learning/paths/[id]
 * 
 * Get, update, or delete a specific learning path.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const pathDocRef = doc(db, 'learningPaths', id);
    const pathDoc = await getDoc(pathDocRef);

    if (!pathDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Learning path not found' },
        { status: 404 }
      );
    }

    const pathData = pathDoc.data();

    // Verify ownership
    if (pathData.userId !== user.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: pathDoc.id,
        ...pathData,
      },
    });
  } catch (error) {
    console.error('Get learning path error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get learning path' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const pathDocRef = doc(db, 'learningPaths', id);
    const pathDoc = await getDoc(pathDocRef);

    if (!pathDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Learning path not found' },
        { status: 404 }
      );
    }

    const pathData = pathDoc.data();

    // Verify ownership
    if (pathData.userId !== user.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { steps, progress, status } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (steps !== undefined) updateData.steps = steps;
    if (progress !== undefined) updateData.progress = progress;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = serverTimestamp();
      }
    }

    await updateDoc(pathDocRef, updateData);

    const updatedDoc = await getDoc(pathDocRef);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error('Update learning path error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update learning path' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const pathDocRef = doc(db, 'learningPaths', id);
    const pathDoc = await getDoc(pathDocRef);

    if (!pathDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Learning path not found' },
        { status: 404 }
      );
    }

    const pathData = pathDoc.data();

    // Verify ownership
    if (pathData.userId !== user.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await deleteDoc(pathDocRef);

    return NextResponse.json({
      success: true,
      message: 'Learning path deleted successfully',
    });
  } catch (error) {
    console.error('Delete learning path error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete learning path' },
      { status: 500 }
    );
  }
}
