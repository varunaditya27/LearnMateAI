/**
 * Learning Branch API
 * 
 * Create and manage branching learning journeys with alternate paths
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pathId, currentStep, branchOption, userPreference } = body;

    if (!pathId || !currentStep) {
      return NextResponse.json(
        { success: false, error: 'Path ID and current step are required' },
        { status: 400 }
      );
    }

    // TODO: Fetch learning path from database
    const mockPath = {
      id: pathId,
      name: 'React.js Learning Path',
      topic: 'react',
      currentStep
    };

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const systemPrompt = `You are an adaptive learning path designer. Create alternate learning routes based on user preferences.

Current Learning Path: ${mockPath.name}
Current Step: ${currentStep}
Branch Option: ${branchOption || 'not specified'}
User Preference: ${userPreference || 'balanced'}

Valid branch options:
- project-based: More hands-on projects
- theory-heavy: Deeper conceptual understanding
- fast-track: Condensed, essential concepts only
- comprehensive: Detailed coverage with examples

Generate alternate learning branches in JSON format:
{
  "pathId": "${pathId}",
  "branches": [
    {
      "id": "branch_1",
      "name": "Project-Based Path",
      "type": "project-based",
      "description": "Learn by building real projects",
      "difficulty": "intermediate",
      "estimatedHours": 20,
      "steps": [
        {
          "stepNumber": 1,
          "title": "Step title",
          "description": "What you'll learn",
          "type": "project|video|reading|exercise",
          "estimatedMinutes": 30,
          "resources": ["resource 1", "resource 2"]
        }
      ],
      "projects": ["Project 1", "Project 2"],
      "outcomes": ["Outcome 1", "Outcome 2"]
    }
  ],
  "recommendation": "Based on your preference, we recommend the Project-Based Path"
}

Create 2-3 distinct branches with 3-5 steps each.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    let branchData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        branchData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Error parsing AI response:', e);
      // Fallback branch structure
      branchData = {
        pathId,
        branches: [
          {
            id: 'branch_1',
            name: 'Project-Based Path',
            type: 'project-based',
            description: 'Learn by building practical projects',
            difficulty: 'intermediate',
            estimatedHours: 20,
            steps: [
              {
                stepNumber: 1,
                title: 'Build a To-Do App',
                description: 'Create your first React application',
                type: 'project',
                estimatedMinutes: 120,
                resources: ['Tutorial', 'Starter Code']
              }
            ],
            projects: ['To-Do App', 'Weather Dashboard'],
            outcomes: ['Practical experience', 'Portfolio projects']
          },
          {
            id: 'branch_2',
            name: 'Theory-First Path',
            type: 'theory-heavy',
            description: 'Deep dive into concepts before coding',
            difficulty: 'intermediate',
            estimatedHours: 25,
            steps: [
              {
                stepNumber: 1,
                title: 'React Core Concepts',
                description: 'Understand the fundamentals deeply',
                type: 'reading',
                estimatedMinutes: 60,
                resources: ['Documentation', 'Articles']
              }
            ],
            projects: [],
            outcomes: ['Strong foundation', 'Conceptual clarity']
          }
        ],
        recommendation: 'Project-Based Path is recommended for hands-on learners'
      };
    }

    const responseData = {
      ...branchData,
      userId: 'current_user_id', // TODO: Get from auth
      createdAt: new Date().toISOString(),
      status: 'available'
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Learning branches generated successfully'
    });

  } catch (error) {
    console.error('Generate branch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate learning branches' },
      { status: 500 }
    );
  }
}

// PUT - Select and activate a branch
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { pathId, branchId } = body;

    if (!pathId || !branchId) {
      return NextResponse.json(
        { success: false, error: 'Path ID and branch ID are required' },
        { status: 400 }
      );
    }

    // TODO: Update user's learning path in database
    const updatedPath = {
      pathId,
      activeBranch: branchId,
      branchStartedAt: new Date().toISOString(),
      previousBranch: null
    };

    return NextResponse.json({
      success: true,
      data: updatedPath,
      message: 'Learning branch activated successfully'
    });

  } catch (error) {
    console.error('Activate branch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to activate branch' },
      { status: 500 }
    );
  }
}

// GET - Get available branches for a path
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');

    if (!pathId) {
      return NextResponse.json(
        { success: false, error: 'Path ID is required' },
        { status: 400 }
      );
    }

    // TODO: Fetch from database
    const mockBranches = [
      {
        id: 'branch_1',
        pathId,
        name: 'Project-Based Path',
        type: 'project-based',
        description: 'Learn by building',
        isActive: true,
        progress: 45
      },
      {
        id: 'branch_2',
        pathId,
        name: 'Theory-First Path',
        type: 'theory-heavy',
        description: 'Deep conceptual understanding',
        isActive: false,
        progress: 0
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockBranches,
      meta: {
        pathId,
        total: mockBranches.length
      }
    });

  } catch (error) {
    console.error('Get branches error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}
