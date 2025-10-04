/**
 * Motivation Boost API
 * 
 * Send motivational messages and boosts to users
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, context } = body;

    // TODO: Fetch user stats and learning context from database
    const userContext = {
      currentStreak: 5,
      totalPoints: 850,
      level: 4,
      recentActivity: 'Learning React Hooks',
      strugglingWith: context || null
    };

    // Use Gemini to generate personalized motivation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const systemPrompt = `You are an enthusiastic and supportive learning coach. Your role is to motivate learners with personalized, encouraging messages.

User Context:
- Current streak: ${userContext.currentStreak} days
- Total points: ${userContext.totalPoints}
- Level: ${userContext.level}
- Recent activity: ${userContext.recentActivity}
${userContext.strugglingWith ? `- Currently struggling with: ${userContext.strugglingWith}` : ''}

Generate a short, motivating message (2-3 sentences) that:
1. Acknowledges their progress
2. Encourages them to keep going
3. Is specific to their situation
4. Uses emojis appropriately

Keep it genuine, uplifting, and actionable.`;

    const result = await model.generateContent(systemPrompt);
    const motivationMessage = result.response.text();

    const boost = {
      id: `boost_${Date.now()}`,
      userId: userId || 'current_user_id',
      message: motivationMessage,
      type: 'motivation',
      createdAt: new Date().toISOString()
    };

    // TODO: Save to database and send notification

    return NextResponse.json({
      success: true,
      data: boost,
      message: 'Motivation boost sent successfully'
    });

  } catch (error) {
    console.error('Motivation boost error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send motivation boost' },
      { status: 500 }
    );
  }
}

// GET - Get recent motivation boosts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // TODO: Fetch from database
    const mockBoosts = [
      {
        id: 'boost_1',
        message: '🔥 Amazing 5-day streak! You\'re building real momentum. Keep this energy going!',
        type: 'motivation',
        createdAt: '2025-10-04T08:00:00Z'
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockBoosts.slice(0, limit)
    });

  } catch (error) {
    console.error('Get motivation boosts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch motivation boosts' },
      { status: 500 }
    );
  }
}
