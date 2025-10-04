/**
 * Habit Challenge API
 * 
 * Create and track personal habit-building challenges
 */

import { NextRequest, NextResponse } from 'next/server';

// GET - Get user's habit challenges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    // TODO: Fetch from database
    const mockChallenges = [
      {
        id: 'habit_1',
        name: 'Learn 30 minutes daily',
        description: 'Commit to learning for at least 30 minutes every day',
        type: 'daily_learning',
        targetValue: 30,
        currentStreak: 5,
        longestStreak: 8,
        status: 'active',
        startDate: '2025-09-30',
        progress: [
          { date: '2025-09-30', completed: true, value: 35 },
          { date: '2025-10-01', completed: true, value: 42 },
          { date: '2025-10-02', completed: true, value: 30 },
          { date: '2025-10-03', completed: true, value: 55 },
          { date: '2025-10-04', completed: true, value: 40 }
        ],
        rewards: {
          milestone5: 'Early Bird Badge',
          milestone10: '100 bonus points',
          milestone30: 'Consistency Champion Badge'
        }
      },
      {
        id: 'habit_2',
        name: 'Complete 1 concept daily',
        description: 'Finish at least one learning concept every day',
        type: 'concept_completion',
        targetValue: 1,
        currentStreak: 3,
        longestStreak: 5,
        status: 'active',
        startDate: '2025-10-01',
        progress: [
          { date: '2025-10-02', completed: true, value: 1 },
          { date: '2025-10-03', completed: true, value: 2 },
          { date: '2025-10-04', completed: true, value: 1 }
        ],
        rewards: {
          milestone7: 'Weekly Warrior Badge',
          milestone14: '200 bonus points',
          milestone21: 'Habit Master Badge'
        }
      }
    ];

    const filtered = mockChallenges.filter(c => c.status === status);

    return NextResponse.json({
      success: true,
      data: filtered,
      meta: {
        total: filtered.length,
        status
      }
    });

  } catch (error) {
    console.error('Get habit challenges error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch habit challenges' },
      { status: 500 }
    );
  }
}

// POST - Create new habit challenge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, targetValue, duration } = body;

    if (!name || !type || !targetValue) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validTypes = ['daily_learning', 'concept_completion', 'streak_maintenance', 'focus_time'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid habit type' },
        { status: 400 }
      );
    }

    const newChallenge = {
      id: `habit_${Date.now()}`,
      name,
      description,
      type,
      targetValue,
      currentStreak: 0,
      longestStreak: 0,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      progress: [],
      rewards: {
        milestone5: 'First Steps Badge',
        milestone10: '100 bonus points',
        milestone30: 'Habit Champion Badge'
      },
      createdAt: new Date().toISOString()
    };

    // TODO: Save to database

    return NextResponse.json({
      success: true,
      data: newChallenge,
      message: 'Habit challenge created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create habit challenge error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create habit challenge' },
      { status: 500 }
    );
  }
}

// PATCH - Update habit progress
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { habitId, date, value, completed } = body;

    if (!habitId || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Update in database
    const progressEntry = {
      habitId,
      date,
      value,
      completed: completed !== undefined ? completed : value > 0,
      recordedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: progressEntry,
      message: 'Progress updated successfully'
    });

  } catch (error) {
    console.error('Update habit progress error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
