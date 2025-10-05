/**
 * Career Roadmap Generation API
 * 
 * AI-powered career path planning and skill roadmap generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await verifyAuth(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = authResult.uid;

    const body = await request.json();
    const { careerGoal, currentSkills, experienceLevel, timeframe } = body;

    if (!careerGoal) {
      return NextResponse.json(
        { success: false, error: 'Career goal is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const systemPrompt = `You are an expert career counselor and learning path architect. Generate a comprehensive, actionable career roadmap.

Career Goal: ${careerGoal}
Current Skills: ${currentSkills?.join(', ') || 'None specified'}
Experience Level: ${experienceLevel || 'beginner'}
Timeframe: ${timeframe || '6 months'}

Create a detailed roadmap with the following structure (respond in JSON format):
{
  "careerGoal": "${careerGoal}",
  "overview": "Brief overview of the career path",
  "phases": [
    {
      "phase": 1,
      "title": "Foundation Phase",
      "duration": "2 months",
      "description": "What to focus on in this phase",
      "skills": ["skill1", "skill2"],
      "milestones": ["milestone1", "milestone2"],
      "resources": ["resource type 1", "resource type 2"]
    }
  ],
  "requiredSkills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"]
  },
  "projectIdeas": ["project1", "project2"],
  "certifications": ["cert1", "cert2"],
  "nextSteps": ["immediate action 1", "immediate action 2"],
  "estimatedTimeToJob": "6-12 months",
  "salaryRange": "$X - $Y",
  "jobOutlook": "Brief outlook"
}

Make it specific, actionable, and realistic. Include 3-4 phases.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    let roadmap;
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        roadmap = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Error parsing AI response:', e);
      // Fallback structured response
      roadmap = {
        careerGoal,
        overview: responseText.substring(0, 200),
        phases: [
          {
            phase: 1,
            title: 'Foundation Phase',
            duration: '2 months',
            description: 'Build fundamental skills',
            skills: currentSkills || [],
            milestones: ['Complete basics', 'Build first project'],
            resources: ['Online courses', 'Documentation']
          }
        ],
        requiredSkills: {
          technical: [],
          soft: ['Communication', 'Problem-solving']
        },
        projectIdeas: ['Build a portfolio project'],
        certifications: [],
        nextSteps: ['Start learning', 'Join communities'],
        estimatedTimeToJob: timeframe || '6-12 months'
      };
    }

    // Save to Firestore
    const roadmapsRef = collection(db, 'roadmaps');
    const roadmapData = {
      userId,
      ...roadmap,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'active',
      progress: 0,
    };

    const docRef = await addDoc(roadmapsRef, roadmapData);

    const savedRoadmap = {
      id: docRef.id,
      ...roadmapData,
      createdAt: roadmapData.createdAt.toDate().toISOString(),
      updatedAt: roadmapData.updatedAt.toDate().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: savedRoadmap,
      message: 'Career roadmap generated successfully'
    });

  } catch (error) {
    console.error('Generate roadmap error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate career roadmap';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// GET - Get user's roadmaps
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await verifyAuth(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = authResult.uid;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Query Firestore
    const roadmapsRef = collection(db, 'roadmaps');
    let q = query(
      roadmapsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // Add status filter if provided
    if (status && (status === 'active' || status === 'completed')) {
      q = query(
        roadmapsRef,
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const roadmaps = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: roadmaps,
      meta: {
        total: roadmaps.length
      }
    });

  } catch (error) {
    console.error('Get roadmaps error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch roadmaps';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PATCH - Update roadmap progress or status
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await verifyAuth(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { roadmapId, progress, status } = body;

    if (!roadmapId) {
      return NextResponse.json(
        { success: false, error: 'Roadmap ID is required' },
        { status: 400 }
      );
    }

    // Update in Firestore
    const roadmapRef = doc(db, 'roadmaps', roadmapId);
    const updates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (progress !== undefined) {
      updates.progress = progress;
    }

    if (status) {
      updates.status = status;
    }

    await updateDoc(roadmapRef, updates);

    return NextResponse.json({
      success: true,
      message: 'Roadmap updated successfully'
    });

  } catch (error) {
    console.error('Update roadmap error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update roadmap';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
