/**
 * Authentication API - Session Route
 * GET /api/auth/session
 * 
 * Gets current user session information.
 */

import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user profile from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.uid,
          email: user.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          role: userData.role || 'student',
          stats: userData.stats,
          preferences: userData.preferences,
        },
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
