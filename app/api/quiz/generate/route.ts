/**
 * Quiz Generation API
 * 
 * AI-powered quiz generation for learning concepts
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, difficulty, questionCount, questionTypes } = body;

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    const numQuestions = questionCount || 5;
    const level = difficulty || 'medium';
    const types = questionTypes || ['multiple-choice', 'true-false'];

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const systemPrompt = `You are an expert educator creating high-quality quiz questions. Generate a quiz to test understanding of: ${topic}

Requirements:
- Difficulty level: ${level}
- Number of questions: ${numQuestions}
- Question types: ${types.join(', ')}
- Each question should test practical understanding, not just memorization
- Include clear explanations for correct answers

Respond in this exact JSON format:
{
  "quizId": "quiz_${Date.now()}",
  "topic": "${topic}",
  "difficulty": "${level}",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Detailed explanation why this is correct",
      "points": 10
    },
    {
      "id": "q2",
      "type": "true-false",
      "question": "Statement to evaluate",
      "correctAnswer": true,
      "explanation": "Explanation",
      "points": 5
    }
  ],
  "totalPoints": 50,
  "passingScore": 70,
  "estimatedMinutes": 10
}

Make questions engaging and educational. Vary difficulty within the level.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    let quiz;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quiz = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Error parsing AI response:', e);
      // Fallback quiz structure
      quiz = {
        quizId: `quiz_${Date.now()}`,
        topic,
        difficulty: level,
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            question: `What is a key concept in ${topic}?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            explanation: 'This is the correct answer based on fundamental principles.',
            points: 10
          }
        ],
        totalPoints: 10,
        passingScore: 70,
        estimatedMinutes: 5
      };
    }

    const quizData = {
      ...quiz,
      userId: 'current_user_id', // TODO: Get from auth
      createdAt: new Date().toISOString(),
      status: 'active',
      attempts: 0,
      bestScore: null
    };

    // TODO: Save to database

    return NextResponse.json({
      success: true,
      data: quizData,
      message: 'Quiz generated successfully'
    });

  } catch (error) {
    console.error('Generate quiz error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

// GET - Get user's quizzes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');

    // TODO: Fetch from database
    const mockQuizzes = [
      {
        quizId: 'quiz_1',
        topic: 'React Hooks',
        difficulty: 'medium',
        totalPoints: 50,
        attempts: 2,
        bestScore: 85,
        createdAt: '2025-10-03T10:00:00Z'
      }
    ];

    const filtered = topic 
      ? mockQuizzes.filter(q => q.topic.toLowerCase().includes(topic.toLowerCase()))
      : mockQuizzes;

    return NextResponse.json({
      success: true,
      data: filtered,
      meta: {
        total: filtered.length
      }
    });

  } catch (error) {
    console.error('Get quizzes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}
