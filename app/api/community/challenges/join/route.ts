/**
 * Join Challenge API
 * 
 * Join an existing group challenge
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, userId } = body;

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // TODO: Get from database and verify capacity
    const mockChallenge = {
      id: challengeId,
      name: 'Python Basics in 5 Days',
      currentParticipants: 7,
      maxParticipants: 10,
      status: 'active'
    };

    if (mockChallenge.currentParticipants >= mockChallenge.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Challenge is full' },
        { status: 409 }
      );
    }

    if (mockChallenge.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Challenge is not active' },
        { status: 400 }
      );
    }

    // TODO: Add user to challenge participants in database
    const participation = {
      challengeId,
      userId: userId || 'current_user_id',
      joinedAt: new Date().toISOString(),
      progress: 0,
      status: 'active'
    };

    return NextResponse.json({
      success: true,
      data: participation,
      message: 'Successfully joined challenge'
    });

  } catch (error) {
    console.error('Join challenge error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join challenge' },
      { status: 500 }
    );
  }
}
