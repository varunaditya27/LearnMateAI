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
  const { topic, timezone, pace, skillLevel } = body;

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
    
    interface MatchReason {
      userId: string;
      reason: string;
    }

    const parseMatchReasons = (text: string): MatchReason[] => {
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];
        const parsed = JSON.parse(jsonMatch[0]) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item): item is MatchReason =>
          typeof item === 'object' && item !== null && 'userId' in item && 'reason' in item
        );
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return [];
      }
    };

    const matchReasons = parseMatchReasons(response);

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

  } catch (error) {
    console.error('Study buddy matching error:', error);
    const message = error instanceof Error ? error.message : 'Failed to find study buddies';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
