/**
 * Quiz Submission API
 * 
 * Submit quiz answers and get results
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quizId, answers } = body;

    if (!quizId || !answers) {
      return NextResponse.json(
        { success: false, error: 'Quiz ID and answers are required' },
        { status: 400 }
      );
    }

    // TODO: Fetch quiz from database
    const mockQuiz = {
      quizId,
      questions: [
        {
          id: 'q1',
          correctAnswer: 'Option B',
          points: 10
        },
        {
          id: 'q2',
          correctAnswer: true,
          points: 10
        },
        {
          id: 'q3',
          correctAnswer: 'Option C',
          points: 10
        }
      ],
      totalPoints: 30,
      passingScore: 70
    };

    // Grade the quiz
    let correctCount = 0;
    let totalPoints = 0;
    const results = mockQuiz.questions.map(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) {
        correctCount++;
        totalPoints += question.points;
      }
      return {
        questionId: question.id,
        isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
        pointsEarned: isCorrect ? question.points : 0
      };
    });

    const scorePercentage = (totalPoints / mockQuiz.totalPoints) * 100;
    const passed = scorePercentage >= mockQuiz.passingScore;

    const submission = {
      submissionId: `sub_${Date.now()}`,
      quizId,
      userId: 'current_user_id', // TODO: Get from auth
      results,
      score: totalPoints,
      totalPoints: mockQuiz.totalPoints,
      scorePercentage: Math.round(scorePercentage),
      correctCount,
      totalQuestions: mockQuiz.questions.length,
      passed,
      submittedAt: new Date().toISOString()
    };

    // TODO: Save to database and update user stats

    return NextResponse.json({
      success: true,
      data: submission,
      message: passed ? 'Congratulations! You passed!' : 'Keep practicing!'
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
