/**
 * Authentication API - Logout Route
 * POST /api/auth/logout
 * 
 * Handles user logout and session cleanup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export async function POST() {
  try {
    await signOut(auth);

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
