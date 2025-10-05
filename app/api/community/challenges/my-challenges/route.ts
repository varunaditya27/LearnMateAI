/**
 * My Challenges API
 * 
 * Fetch all challenges the authenticated user has joined
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    // Get all challenge participations for this user
    const participantsRef = collection(db, 'challengeParticipants');
    const userParticipationsQuery = query(
      participantsRef,
      where('userId', '==', auth.uid)
    );
    
    const participationsSnapshot = await getDocs(userParticipationsQuery);
    
    if (participationsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          userId: auth.uid,
        },
      });
    }

    // Fetch full challenge details for each participation
    const challenges = await Promise.all(
      participationsSnapshot.docs.map(async (participationDoc) => {
        const participationData = participationDoc.data();
        const challengeRef = doc(db, 'challenges', participationData.challengeId);
        const challengeDoc = await getDoc(challengeRef);
        
        if (!challengeDoc.exists()) {
          return null;
        }
        
        const challengeData = challengeDoc.data();
        
        return {
          // Participation data
          participationId: participationDoc.id,
          userId: participationData.userId,
          joinedAt: participationData.joinedAt?.toDate?.()?.toISOString() || participationData.joinedAt,
          progress: participationData.progress || 0,
          status: participationData.status || 'active',
          completedTasks: participationData.completedTasks || [],
          lastActivityAt: participationData.lastActivityAt?.toDate?.()?.toISOString() || participationData.lastActivityAt,
          
          // Challenge data
          challenge: {
            id: challengeDoc.id,
            name: challengeData.name,
            description: challengeData.description,
            topic: challengeData.topic,
            difficulty: challengeData.difficulty,
            durationDays: challengeData.durationDays,
            currentParticipants: challengeData.currentParticipants || 0,
            maxParticipants: challengeData.maxParticipants || 0,
            rewards: challengeData.rewards,
            tasks: challengeData.tasks || [],
            startDate: challengeData.startDate?.toDate?.()?.toISOString() || challengeData.startDate,
            endDate: challengeData.endDate?.toDate?.()?.toISOString() || challengeData.endDate,
            status: challengeData.status,
            createdAt: challengeData.createdAt?.toDate?.()?.toISOString() || challengeData.createdAt,
          },
        };
      })
    );

    // Filter out null entries (challenges that no longer exist)
    const validChallenges = challenges.filter(Boolean);

    return NextResponse.json({
      success: true,
      data: validChallenges,
      meta: {
        total: validChallenges.length,
        userId: auth.uid,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get my challenges error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch your challenges' },
      { status: 500 }
    );
  }
});
