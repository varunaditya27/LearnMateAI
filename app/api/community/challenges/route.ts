/**
 * Group Challenges API
 * 
 * Create and manage group learning challenges
 */

import { NextRequest, NextResponse } from 'next/server';

// GET - List all available challenges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const topic = searchParams.get('topic');

    // TODO: Fetch from database
    const mockChallenges = [
      {
        id: 'challenge_1',
        name: 'Python Basics in 5 Days',
        description: 'Master Python fundamentals together',
        topic: 'python',
        durationDays: 5,
        startDate: '2025-10-05',
        endDate: '2025-10-10',
        maxParticipants: 10,
        currentParticipants: 7,
        difficulty: 'beginner',
        status: 'active',
        rewards: {
          points: 500,
          badge: 'Python Pioneer'
        },
        createdBy: 'user_admin',
        participants: []
      },
      {
        id: 'challenge_2',
        name: 'React Mastery Challenge',
        description: 'Build 3 projects in React',
        topic: 'react',
        durationDays: 14,
        startDate: '2025-10-01',
        endDate: '2025-10-15',
        maxParticipants: 15,
        currentParticipants: 12,
        difficulty: 'intermediate',
        status: 'active',
        rewards: {
          points: 1000,
          badge: 'React Master'
        },
        createdBy: 'user_admin',
        participants: []
      }
    ];

    let filteredChallenges = mockChallenges.filter(c => c.status === status);
    if (topic) {
      filteredChallenges = filteredChallenges.filter(c => c.topic === topic);
    }

    return NextResponse.json({
      success: true,
      data: filteredChallenges,
      meta: {
        total: filteredChallenges.length,
        status,
        topic
      }
    });

  } catch (error) {
    console.error('Get challenges error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// POST - Create a new challenge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      topic, 
      durationDays, 
      maxParticipants,
      difficulty,
      startDate 
    } = body;

    // Validate required fields
    if (!name || !topic || !durationDays) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate end date
    const start = new Date(startDate || new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);

    const newChallenge = {
      id: `challenge_${Date.now()}`,
      name,
      description,
      topic,
      durationDays,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      maxParticipants: maxParticipants || 10,
      currentParticipants: 0,
      difficulty: difficulty || 'beginner',
      status: 'active',
      rewards: {
        points: durationDays * 100,
        badge: `${name} Champion`
      },
      createdBy: 'current_user_id', // TODO: Get from auth
      participants: [],
      createdAt: new Date().toISOString()
    };

    // TODO: Save to database

    return NextResponse.json({
      success: true,
      data: newChallenge,
      message: 'Challenge created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}
