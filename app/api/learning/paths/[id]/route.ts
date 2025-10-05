/**
 * Learning API - Path by ID Route
 * GET /api/learning/paths/[id]
 * PUT /api/learning/paths/[id]
 * DELETE /api/learning/paths/[id]
 * 
 * Get, update, or delete a specific learning path.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, auth) => {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Path ID is required' },
          { status: 400 }
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
      if (pathData.userId !== auth.uid) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized access to this learning path' },
          { status: 403 }
        );
      }

      // Convert Firestore Timestamps to serializable format
      const serializedData = {
        id: pathDoc.id,
        ...pathData,
        createdAt: pathData.createdAt?.toDate?.()?.toISOString() || pathData.createdAt,
        updatedAt: pathData.updatedAt?.toDate?.()?.toISOString() || pathData.updatedAt,
        startedAt: pathData.startedAt?.toDate?.()?.toISOString() || pathData.startedAt,
        completedAt: pathData.completedAt?.toDate?.()?.toISOString() || pathData.completedAt,
        steps: pathData.steps?.map((step: { completedAt?: { toDate?: () => Date } }) => ({
          ...step,
          completedAt: step.completedAt?.toDate?.()?.toISOString() || step.completedAt,
        })) || [],
      };

      return NextResponse.json({
        success: true,
        data: serializedData,
      });
    } catch (error) {
      console.error('Get learning path error:', error);
      
      return NextResponse.json(
        { success: false, error: 'Failed to get learning path' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, auth) => {
    try {
      const { id } = await params;
      const requestBody = await req.json();
      const { progress: updatedProgress, status: updatedStatus, steps: updatedSteps } = requestBody;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Path ID is required' },
          { status: 400 }
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
      if (pathData.userId !== auth.uid) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized access to this learning path' },
          { status: 403 }
        );
      }

      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (updatedSteps !== undefined) updateData.steps = updatedSteps;
      if (updatedProgress !== undefined) updateData.progress = updatedProgress;
      if (updatedStatus !== undefined) {
        updateData.status = updatedStatus;
        if (updatedStatus === 'completed' && !pathData.completedAt) {
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
        message: 'Learning path updated successfully',
      });
    } catch (error) {
      console.error('Update learning path error:', error);
      
      return NextResponse.json(
        { success: false, error: 'Failed to update learning path' },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, auth) => {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Path ID is required' },
          { status: 400 }
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
      if (pathData.userId !== auth.uid) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized access to this learning path' },
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
  })(request);
}
