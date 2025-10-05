/**
 * Resource Recommendation API
 * 
 * AI-powered personalized learning resource recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const learningStyle = searchParams.get('learningStyle');
    const difficulty = searchParams.get('difficulty') || 'beginner';

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    // TODO: Fetch user's learning history and preferences
    const userContext = {
      learningStyle: learningStyle || 'visual',
      completedTopics: ['html', 'css'],
      preferredFormats: ['video', 'interactive'],
      averageSessionMinutes: 45
    };

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const systemPrompt = `You are a personalized learning resource curator. Recommend the best learning resources for a student.

Topic: ${topic}
Difficulty Level: ${difficulty}
Learning Style: ${userContext.learningStyle}
Preferred Formats: ${userContext.preferredFormats.join(', ')}

Generate recommendations in this JSON format:
{
  "topic": "${topic}",
  "recommendations": [
    {
      "title": "Resource Title",
      "type": "video|article|interactive|course|documentation",
      "description": "Why this resource is valuable",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedMinutes": 30,
      "platform": "YouTube|MDN|Coursera|etc",
      "url": "https://example.com",
      "tags": ["tag1", "tag2"],
      "matchScore": 95,
      "matchReason": "Perfect for visual learners"
    }
  ],
  "learningPath": ["Step 1", "Step 2", "Step 3"],
  "additionalTips": ["Tip 1", "Tip 2"]
}

Recommend 5-7 high-quality, diverse resources. Focus on free, accessible content. Prioritize ${userContext.learningStyle} learning style.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    let recommendations;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Error parsing AI response:', e);
      // Fallback recommendations
      recommendations = {
        topic,
        recommendations: [
          {
            title: `Introduction to ${topic}`,
            type: 'video',
            description: 'Comprehensive introduction covering fundamentals',
            difficulty,
            estimatedMinutes: 30,
            platform: 'YouTube',
            url: `https://youtube.com/search?q=${encodeURIComponent(topic)}`,
            tags: [topic, 'tutorial'],
            matchScore: 85,
            matchReason: 'Great starting point'
          },
          {
            title: `${topic} Documentation`,
            type: 'documentation',
            description: 'Official documentation and reference',
            difficulty,
            estimatedMinutes: 60,
            platform: 'Official Docs',
            url: '#',
            tags: [topic, 'reference'],
            matchScore: 90,
            matchReason: 'Authoritative source'
          }
        ],
        learningPath: [
          'Start with video tutorials',
          'Practice with interactive exercises',
          'Build a small project'
        ],
        additionalTips: [
          'Take notes while learning',
          'Practice regularly',
          'Join study groups'
        ]
      };
    }

    const responseData = {
      ...recommendations,
      userId: 'current_user_id', // TODO: Get from auth
      generatedAt: new Date().toISOString(),
      userContext: {
        learningStyle: userContext.learningStyle,
        preferredFormats: userContext.preferredFormats
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Recommendations generated successfully'
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

// POST - Save resource feedback (liked/completed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceUrl, resourceTitle, action, rating } = body;

    if (!resourceUrl || !action) {
      return NextResponse.json(
        { success: false, error: 'Resource URL and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['liked', 'completed', 'saved', 'dismissed'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    const feedback = {
      id: `feedback_${Date.now()}`,
      userId: 'current_user_id', // TODO: Get from auth
      resourceUrl,
      resourceTitle,
      action,
      rating: rating || null,
      createdAt: new Date().toISOString()
    };

    // TODO: Save to database for improving recommendations

    return NextResponse.json({
      success: true,
      data: feedback,
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    console.error('Save resource feedback error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
