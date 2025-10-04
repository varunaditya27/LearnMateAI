/**
 * Authentication API - Register Route
 * POST /api/auth/register
 * 
 * Handles new user registration and profile creation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName } = body;

    // Validate input
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName });

    // Create user profile in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      id: user.uid,
      email: user.email,
      displayName,
      photoURL: null,
      role: 'student',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      preferences: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dailyGoalMinutes: 60,
        reminderEnabled: true,
        learningStyle: 'visual',
        notificationSettings: {
          email: true,
          push: false,
          dailySummary: true,
          weeklyReport: true,
          streakReminders: true,
        },
      },
      stats: {
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalMinutesLearned: 0,
        completedConcepts: 0,
        level: 1,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.uid,
          email: user.email,
          displayName,
          role: 'student',
        },
        token: await user.getIdToken(),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    let errorMessage = 'Registration failed';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('email-already-in-use')) {
        errorMessage = 'Email already registered';
        statusCode = 409;
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
