/**
 * Join Challenge API
 * 
 * Join an existing group challenge with full Firestore integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp, increment } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // Get challenge document
    const challengeRef = doc(db, 'challenges', challengeId);
    const challengeDoc = await getDoc(challengeRef);

    if (!challengeDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const challengeData = challengeDoc.data();

    // Check if challenge is full
    if (challengeData.currentParticipants >= challengeData.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Challenge is full' },
        { status: 409 }
      );
    }

    // Check if challenge is active
    if (challengeData.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Challenge is not active' },
        { status: 400 }
      );
    }

    // Check if user already joined
    const participantsRef = collection(db, 'challengeParticipants');
    const existingQuery = query(
      participantsRef,
      where('challengeId', '==', challengeId),
      where('userId', '==', auth.uid)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'You have already joined this challenge' },
        { status: 409 }
      );
    }

    // Add user to challenge participants
    const participationRef = await addDoc(participantsRef, {
      challengeId,
      userId: auth.uid,
      joinedAt: serverTimestamp(),
      progress: 0,
      status: 'active',
      completedTasks: [],
      lastActivityAt: serverTimestamp(),
    });

    // Update challenge participant count
    await updateDoc(challengeRef, {
      currentParticipants: increment(1),
      updatedAt: serverTimestamp(),
    });

    // Get updated challenge data
    const updatedDoc = await getDoc(challengeRef);
    const updatedData = updatedDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        participationId: participationRef.id,
        challengeId,
        userId: auth.uid,
        joinedAt: new Date().toISOString(),
        progress: 0,
        status: 'active',
        challenge: {
          name: updatedData?.name,
          currentParticipants: updatedData?.currentParticipants,
          maxParticipants: updatedData?.maxParticipants,
        },
      },
      message: 'Successfully joined challenge',
    });
  } catch (error) {
    console.error('Join challenge error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join challenge' },
      { status: 500 }
    );
  }
});
