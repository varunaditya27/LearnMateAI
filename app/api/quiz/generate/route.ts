/**
 * Quiz Generation API
 * 
 * AI-powered quiz generation for learning concepts
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';

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
    const { topic, difficulty, questionCount, questionTypes } = body;

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    const numQuestions = questionCount || 5;
    const level = difficulty || 'beginner';
    const types = questionTypes || ['multiple-choice', 'true-false'];

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const systemPrompt = `You are an expert educator creating high-quality quiz questions. Generate a quiz to test understanding of: ${topic}

Requirements:
- Difficulty level: ${level}
- Number of questions: ${numQuestions}
- Question types: ${types.join(', ')}
- Each question should test practical understanding, not just memorization
- Include clear explanations for correct answers

Respond in this exact JSON format:
{
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

    // Save to Firestore
    const quizzesRef = collection(db, 'quizzes');
    const quizData = {
      userId,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      questions: quiz.questions,
      totalPoints: quiz.totalPoints,
      passingScore: quiz.passingScore,
      estimatedMinutes: quiz.estimatedMinutes,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'active',
      attempts: 0,
      bestScore: null,
    };

    const docRef = await addDoc(quizzesRef, quizData);

    const savedQuiz = {
      quizId: docRef.id,
      ...quizData,
      createdAt: quizData.createdAt.toDate().toISOString(),
      updatedAt: quizData.updatedAt.toDate().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: savedQuiz,
      message: 'Quiz generated successfully'
    });

  } catch (error) {
    console.error('Generate quiz error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate quiz';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// GET - Get user's quizzes
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
    const topic = searchParams.get('topic');

    // Query Firestore
    const quizzesRef = collection(db, 'quizzes');
    let q = query(
      quizzesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // Add topic filter if provided
    if (topic) {
      q = query(
        quizzesRef,
        where('userId', '==', userId),
        where('topic', '==', topic),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const quizzes = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        quizId: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: quizzes,
      meta: {
        total: quizzes.length
      }
    });

  } catch (error) {
    console.error('Get quizzes error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch quizzes';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
