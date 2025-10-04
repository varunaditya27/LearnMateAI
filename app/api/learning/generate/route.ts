/**
 * Learning API - Generate Path Route
 * POST /api/learning/generate
 * 
 * Generate AI-powered learning path using Gemini.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { generateLearningPath } from '@/services/ai';

export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { domain, subdomain, topic } = body;

    if (!domain || !subdomain || !topic) {
      return NextResponse.json(
        { success: false, error: 'domain, subdomain, and topic are required' },
        { status: 400 }
      );
    }

    // Generate learning path using AI service
    const learningPath = await generateLearningPath(user.uid, domain, subdomain, topic);

    return NextResponse.json({
      success: true,
      data: learningPath,
    });
  } catch (error) {
    console.error('Generate learning path error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate learning path' },
      { status: 500 }
    );
  }
}
