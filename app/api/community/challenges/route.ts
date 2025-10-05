/**
 * Group Challenges API
 * 
 * Create and manage group learning challenges with full Firestore integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { withAuth } from '@/lib/api-helpers';

// GET - List all available challenges
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const topic = searchParams.get('topic');

    const challengesRef = collection(db, 'challenges');
    let challenges: Array<{ id: string; [key: string]: unknown }> = [];

    try {
      let q;
      if (topic) {
        // Query by status and topic
        q = query(
          challengesRef,
          where('status', '==', status),
          where('topic', '==', topic),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Query by status only
        q = query(
          challengesRef,
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);

      challenges = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          topic: data.topic,
          durationDays: data.durationDays,
          startDate: data.startDate,
          endDate: data.endDate,
          maxParticipants: data.maxParticipants,
          currentParticipants: data.currentParticipants || 0,
          difficulty: data.difficulty,
          status: data.status,
          rewards: data.rewards,
          createdBy: data.createdBy,
          participants: data.participants || [],
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        };
      });
    } catch (err: unknown) {
      // Fallback if index is missing
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'failed-precondition') {
        console.warn('[challenges] Missing index, using fallback query');
        const fallbackQuery = query(challengesRef, where('status', '==', status));
        const querySnapshot = await getDocs(fallbackQuery);

        challenges = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              description: data.description,
              topic: data.topic,
              durationDays: data.durationDays,
              startDate: data.startDate,
              endDate: data.endDate,
              maxParticipants: data.maxParticipants,
              currentParticipants: data.currentParticipants || 0,
              difficulty: data.difficulty,
              status: data.status,
              rewards: data.rewards,
              createdBy: data.createdBy,
              participants: data.participants || [],
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            };
          })
          .filter(c => !topic || c.topic === topic)
          .sort((a, b) => {
            const dateA = new Date(a.createdAt as string).getTime();
            const dateB = new Date(b.createdAt as string).getTime();
            return dateB - dateA;
          });
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      success: true,
      data: challenges,
      meta: {
        total: challenges.length,
        status,
        topic,
      },
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
});

// POST - Create a new challenge
export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const {
      name,
      description,
      topic,
      durationDays,
      maxParticipants,
      difficulty,
      startDate,
    } = body;

    // Validate required fields
    if (!name || !topic || !durationDays) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, topic, durationDays' },
        { status: 400 }
      );
    }

    // Calculate dates
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);

    // Create challenge document
    const challengesRef = collection(db, 'challenges');
    const docRef = await addDoc(challengesRef, {
      name,
      description: description || '',
      topic,
      durationDays,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      maxParticipants: maxParticipants || 20,
      currentParticipants: 0,
      difficulty: difficulty || 'beginner',
      status: 'active',
      rewards: {
        points: durationDays * 100,
        badge: `${name} Champion`,
      },
      createdBy: auth.uid,
      participants: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        name,
        description,
        topic,
        durationDays,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        maxParticipants: maxParticipants || 20,
        currentParticipants: 0,
        difficulty: difficulty || 'beginner',
        status: 'active',
        rewards: {
          points: durationDays * 100,
          badge: `${name} Champion`,
        },
        createdBy: auth.uid,
      },
      message: 'Challenge created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
});
