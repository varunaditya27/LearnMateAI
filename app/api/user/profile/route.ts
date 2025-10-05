/**
 * User API - Profile Route
 * GET /api/user/profile
 * PUT /api/user/profile
 * 
 * Get and update user profile information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const userDocRef = doc(db, 'users', auth.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userDoc.data(),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { displayName, photoURL, preferences } = body;

    const userDocRef = doc(db, 'users', auth.uid);
    
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    if (preferences !== undefined) updateData.preferences = preferences;

    await updateDoc(userDocRef, updateData);

    const updatedDoc = await getDoc(userDocRef);

    return NextResponse.json({
      success: true,
      data: updatedDoc.data(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
});

