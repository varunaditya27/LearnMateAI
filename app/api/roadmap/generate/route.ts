/**
 * Career Roadmap Generation API
 * 
 * AI-powered career path planning and skill roadmap generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { careerGoal, currentSkills, experienceLevel, timeframe } = body;

    if (!careerGoal) {
      return NextResponse.json(
        { success: false, error: 'Career goal is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
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

    const roadmapData = {
      id: `roadmap_${Date.now()}`,
      userId: 'current_user_id', // TODO: Get from auth
      ...roadmap,
      createdAt: new Date().toISOString(),
      status: 'active',
      progress: 0
    };

    // TODO: Save to database

    return NextResponse.json({
      success: true,
      data: roadmapData,
      message: 'Career roadmap generated successfully'
    });

  } catch (error) {
    console.error('Generate roadmap error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate career roadmap' },
      { status: 500 }
    );
  }
}

// GET - Get user's roadmaps
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // TODO: Fetch from database
    const mockRoadmaps = [
      {
        id: 'roadmap_1',
        careerGoal: 'Full Stack Developer',
        overview: 'Comprehensive path to becoming a full-stack developer',
        progress: 35,
        status: 'active',
        createdAt: '2025-09-15T00:00:00Z',
        phases: [
          {
            phase: 1,
            title: 'Frontend Fundamentals',
            duration: '2 months',
            completed: true
          },
          {
            phase: 2,
            title: 'Backend Development',
            duration: '2 months',
            completed: false
          }
        ]
      }
    ];

    const filtered = status 
      ? mockRoadmaps.filter(r => r.status === status)
      : mockRoadmaps;

    return NextResponse.json({
      success: true,
      data: filtered,
      meta: {
        total: filtered.length
      }
    });

  } catch (error) {
    console.error('Get roadmaps error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roadmaps' },
      { status: 500 }
    );
  }
}
