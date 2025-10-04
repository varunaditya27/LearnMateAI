/**
 * Authentication API - Login Route
 * POST /api/auth/login
 * 
 * Handles user login with email/password or OAuth providers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, idToken } = body;

    // Validate input
    if (!email || (!password && !idToken)) {
      return NextResponse.json(
        { success: false, error: 'Email and password or idToken required' },
        { status: 400 }
      );
    }

    let userCredential;

    // Handle email/password login
    if (password) {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } else {
      // Handle OAuth login (idToken from Google, etc.)
      // This would use Firebase Admin SDK in production
      return NextResponse.json(
        { success: false, error: 'OAuth login not yet implemented on server' },
        { status: 501 }
      );
    }

    const user = userCredential.user;

    // Get user document from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Update last login timestamp
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
    });

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
        },
        token: await user.getIdToken(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 401 }
    );
  }
}
