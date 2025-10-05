/**
 * Learning API - Generate Path Route
 * POST /api/learning/generate
 * 
 * Generate AI-powered learning path using Gemini.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateLearningPath } from '@/services/gemini';
import { withAuth } from '@/lib/api-helpers';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { domain, subdomain, topic, userLevel, learningStyle, timeCommitment } = body;

    if (!domain || !subdomain || !topic) {
      return NextResponse.json(
        { success: false, error: 'domain, subdomain, and topic are required' },
        { status: 400 }
      );
    }

    // Generate learning path using Gemini AI service
    const learningPath = await generateLearningPath({
      userId: auth.uid,
      domain,
      subdomain,
      topic,
      userLevel: userLevel || 'beginner',
      learningStyle: learningStyle || 'balanced',
      timeCommitment: timeCommitment || 30,
    });

    // Save to Firestore
    const pathsRef = collection(db, 'learningPaths');
    const docRef = await addDoc(pathsRef, {
      ...learningPath,
      startedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        ...learningPath,
        id: docRef.id,
      },
      message: 'Learning path generated successfully',
    });
  } catch (error) {
    console.error('Generate learning path error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate learning path' 
      },
      { status: 500 }
    );
  }
});
