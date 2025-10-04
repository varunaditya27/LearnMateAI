/**
 * Study Buddy Matching API
 * 
 * Matches users with study buddies based on preferences and goals
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, timezone, pace, skillLevel, userId } = body;

    // Validate required fields
    if (!topic || !timezone || !pace || !skillLevel) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: In production, fetch actual users from database
    // For now, using mock data
    const mockUsers = [
      {
        userId: 'user_123',
        displayName: 'Alice Johnson',
        topic,
        timezone,
        pace,
        skillLevel,
        interests: ['web development', 'javascript'],
        photoURL: null,
        matchScore: 95
      },
      {
        userId: 'user_456',
        displayName: 'Bob Smith',
        topic,
        timezone: 'America/Los_Angeles',
        pace,
        skillLevel,
        interests: ['python', 'data science'],
        photoURL: null,
        matchScore: 87
      },
      {
        userId: 'user_789',
        displayName: 'Carol White',
        topic,
        timezone,
        pace: 'medium',
        skillLevel,
        interests: ['react', 'frontend'],
        photoURL: null,
        matchScore: 82
      }
    ];

    // Use AI to enhance matching with personalized reasons
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a study buddy matching assistant. Given a user learning "${topic}" at ${skillLevel} level with ${pace} pace in ${timezone} timezone, provide a brief reason why each potential match would be a good study partner.

Potential matches:
${mockUsers.map((u, i) => `${i + 1}. ${u.displayName} - ${u.pace} pace, ${u.timezone}, interests: ${u.interests.join(', ')}`).join('\n')}

For each match, provide a one-sentence compelling reason. Format as JSON array:
[{"userId": "user_123", "reason": "..."}, ...]`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    let matchReasons: any[] = [];
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matchReasons = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing AI response:', e);
    }

    // Enhance matches with AI-generated reasons
    const enhancedMatches = mockUsers.map(user => {
      const aiReason = matchReasons.find(r => r.userId === user.userId);
      return {
        ...user,
        matchReason: aiReason?.reason || `Great match for learning ${topic} together!`
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        matches: enhancedMatches,
        totalMatches: enhancedMatches.length
      }
    });

  } catch (error: any) {
    console.error('Study buddy matching error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to find study buddies' },
      { status: 500 }
    );
  }
}
