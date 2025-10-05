/**
 * Learning Branch API
 * 
 * Create and manage branching learning journeys with alternate paths
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateLearningBranches } from '@/services/gemini';
import { withAuth } from '@/lib/api-helpers';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { pathId, currentStep, branchOption, userPreference } = body;

    if (!pathId || !currentStep) {
      return NextResponse.json(
        { success: false, error: 'Path ID and current step are required' },
        { status: 400 }
      );
    }

    // Fetch learning path from database
    const pathRef = doc(db, 'learningPaths', pathId);
    const pathSnap = await getDoc(pathRef);

    if (!pathSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Learning path not found' },
        { status: 404 }
      );
    }

    const pathData = pathSnap.data();

    // Verify ownership
    if (pathData.userId !== auth.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to this learning path' },
        { status: 403 }
      );
    }

    // Generate branches using Gemini AI
    const branchData = await generateLearningBranches({
      pathName: pathData.name,
      topic: pathData.topicId,
      currentStep,
      branchOption: branchOption || 'balanced',
      userPreference: userPreference || 'balanced',
    });

    const responseData = {
      branches: typeof branchData === 'object' && branchData !== null ? branchData : {},
      pathId,
      userId: auth.uid,
      createdAt: new Date().toISOString(),
      status: 'available'
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Learning branches generated successfully'
    });

  } catch (error) {
    console.error('Generate branch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate learning branches' 
      },
      { status: 500 }
    );
  }
});

// PUT - Select and activate a branch
export const PUT = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { pathId, branchId } = body;

    if (!pathId || !branchId) {
      return NextResponse.json(
        { success: false, error: 'Path ID and branch ID are required' },
        { status: 400 }
      );
    }

    // Update user's learning path in database
    const pathRef = doc(db, 'learningPaths', pathId);
    const pathSnap = await getDoc(pathRef);

    if (!pathSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Learning path not found' },
        { status: 404 }
      );
    }

    const pathData = pathSnap.data();

    // Verify ownership
    if (pathData.userId !== auth.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to this learning path' },
        { status: 403 }
      );
    }

    await updateDoc(pathRef, {
      activeBranch: branchId,
      branchStartedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        pathId,
        activeBranch: branchId,
      },
      message: 'Learning branch activated successfully'
    });

  } catch (error) {
    console.error('Activate branch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to activate branch' 
      },
      { status: 500 }
    );
  }
});

// GET - Get available branches for a path
export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');

    if (!pathId) {
      return NextResponse.json(
        { success: false, error: 'Path ID is required' },
        { status: 400 }
      );
    }

    const pathRef = doc(db, 'learningPaths', pathId);
    const pathSnap = await getDoc(pathRef);

    if (!pathSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Learning path not found' },
        { status: 404 }
      );
    }

    const pathData = pathSnap.data();

    // Verify ownership
    if (pathData.userId !== auth.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to this learning path' },
        { status: 403 }
      );
    }

    // Return branches if they exist
    const branches = pathData.branches || [];

    return NextResponse.json({
      success: true,
      data: branches,
      meta: {
        pathId,
        total: branches.length,
        activeBranch: pathData.activeBranch || null,
      }
    });

  } catch (error) {
    console.error('Get branches error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch branches' 
      },
      { status: 500 }
    );
  }
});
