/**
 * Quiz Submission API
 * 
 * Submit quiz answers and get results
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';

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
    const { quizId, answers } = body;

    if (!quizId || !answers) {
      return NextResponse.json(
        { success: false, error: 'Quiz ID and answers are required' },
        { status: 400 }
      );
    }

    // Fetch quiz from database
    const quizRef = doc(db, 'quizzes', quizId);
    const quizSnap = await getDoc(quizRef);

    if (!quizSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    const quizData = quizSnap.data();

    // Verify ownership
    if (quizData.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to quiz' },
        { status: 403 }
      );
    }

    const questions = quizData.questions || [];
    const totalPoints = quizData.totalPoints || 0;
    const passingScore = quizData.passingScore || 70;

    // Grade the quiz
    let correctCount = 0;
    let earnedPoints = 0;
    const results = questions.map((question: {
      id: string;
      correctAnswer: string | boolean;
      points: number;
      explanation?: string;
    }) => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) {
        correctCount++;
        earnedPoints += question.points;
      }
      return {
        questionId: question.id,
        isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
        pointsEarned: isCorrect ? question.points : 0,
        explanation: question.explanation,
      };
    });

    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = scorePercentage >= passingScore;

    // Save submission to Firestore
    const submissionsRef = collection(db, 'quizSubmissions');
    const submission = {
      quizId,
      userId,
      results,
      score: earnedPoints,
      totalPoints,
      scorePercentage,
      correctCount,
      totalQuestions: questions.length,
      passed,
      submittedAt: Timestamp.now(),
    };

    const submissionDocRef = await addDoc(submissionsRef, submission);

    // Update quiz stats
    const updates: Record<string, unknown> = {
      attempts: increment(1),
      updatedAt: Timestamp.now(),
    };

    // Update best score if this is better
    if (!quizData.bestScore || scorePercentage > quizData.bestScore) {
      updates.bestScore = scorePercentage;
    }

    // Update status to completed if passed
    if (passed && quizData.status === 'active') {
      updates.status = 'completed';
    }

    await updateDoc(quizRef, updates);

    // Update user stats (total points earned)
    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, {
        'stats.totalPoints': increment(earnedPoints),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.warn('Failed to update user stats:', error);
      // Continue even if user stats update fails
    }

    const savedSubmission = {
      submissionId: submissionDocRef.id,
      ...submission,
      submittedAt: submission.submittedAt.toDate().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: savedSubmission,
      message: passed ? 'Congratulations! You passed!' : 'Keep practicing!'
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit quiz';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
