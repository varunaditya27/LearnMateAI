'use client';

import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/services/api';
import type { Quiz, QuizSubmission } from '@/types/api';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
};

const difficultyColors: Record<Quiz['difficulty'], string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-rose-100 text-rose-700',
};

const fetchQuizzes = async (topicFilter?: string) => {
  const response = await api.quiz.getQuizzes(topicFilter);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(extractErrorMessage(response.error, 'Failed to load quizzes'));
};

export default function QuizDashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard();
  const [authReady, setAuthReady] = useState(false);

  // Wait for auth to be fully ready before making API calls
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const timer = setTimeout(() => {
        setAuthReady(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setAuthReady(false);
    }
  }, [isAuthenticated, authLoading]);

  const isReady = isAuthenticated && !authLoading && authReady;

  const [topicFilter, setTopicFilter] = useState('');
  const [generateForm, setGenerateForm] = useState({
    topic: '',
    difficulty: 'beginner' as Quiz['difficulty'],
    questionCount: 8,
  });
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    data: quizzes,
    loading: quizzesLoading,
    error: quizzesError,
    refetch: refetchQuizzes,
    invalidate: invalidateQuizzes,
  } = useAsyncData(() => fetchQuizzes(topicFilter || undefined), {
    enabled: isReady,
    immediate: isReady,
    cacheKey: `quiz-list-${topicFilter || 'all'}`,
    watch: [isReady, topicFilter],
  });

  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmission | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const isInitialLoading = authLoading || (quizzesLoading && !quizzes);

  const quizzesList = useMemo(() => quizzes ?? [], [quizzes]);

  const selectedQuiz = useMemo(() => {
    if (!quizzesList.length) return null;
    const quiz = quizzesList.find((item) => item.quizId === selectedQuizId);
    return quiz ?? quizzesList[0] ?? null;
  }, [quizzesList, selectedQuizId]);

  React.useEffect(() => {
    if (!selectedQuizId && quizzesList.length > 0) {
      setSelectedQuizId(quizzesList[0].quizId);
    }
  }, [selectedQuizId, quizzesList]);

  React.useEffect(() => {
    if (selectedQuiz && selectedQuiz.questions && Array.isArray(selectedQuiz.questions)) {
      const initialAnswers: Record<string, string | boolean> = {};
      selectedQuiz.questions.forEach((question) => {
        switch (question.type) {
          case 'multiple-choice':
            initialAnswers[question.id] = '';
            break;
          case 'true-false':
            initialAnswers[question.id] = false;
            break;
          case 'short-answer':
            initialAnswers[question.id] = '';
            break;
          default:
            break;
        }
      });
      setAnswers(initialAnswers);
      setSubmissionResult(null);
    }
  }, [selectedQuiz]);

  const handleRefresh = useCallback(async () => {
    await refetchQuizzes();
  }, [refetchQuizzes]);

  const handleGenerateQuiz = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneratingQuiz(true);
    setFeedback(null);
    setFormErrors(null);

    try {
      if (!generateForm.topic.trim()) {
        throw new Error('Please provide a topic to generate a quiz.');
      }

      const response = await api.quiz.generate({
        topic: generateForm.topic.trim(),
        difficulty: generateForm.difficulty,
        questionCount: generateForm.questionCount,
      });

      if (response.success && response.data) {
        const newQuizId = response.data.quizId;
        setFeedback({ type: 'success', message: 'Quiz generated successfully! Ready when you are.' });
        setGenerateForm({ topic: '', difficulty: 'beginner', questionCount: 8 });
        
        // Invalidate cache and refetch to show new quiz
        invalidateQuizzes();
        setTimeout(async () => {
          await refetchQuizzes();
          setSelectedQuizId(newQuizId);
        }, 500);
      } else {
        throw new Error(extractErrorMessage(response.error, 'Unable to generate quiz')); 
      }
    } catch (error) {
      const message = extractErrorMessage(error, 'Unable to generate quiz');
      setFeedback({ type: 'error', message });
      setFormErrors(message);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz) return;
    setSubmittingQuiz(true);
    setFeedback(null);

    try {
      const response = await api.quiz.submit({
        quizId: selectedQuiz.quizId,
        answers,
      });

      if (response.success && response.data) {
        setSubmissionResult(response.data);
        setFeedback({ type: 'success', message: 'Quiz submitted! Check your results below.' });
        await refetchQuizzes();
      } else {
        throw new Error(extractErrorMessage(response.error, 'Unable to submit quiz'));
      }
    } catch (error) {
      setFeedback({ type: 'error', message: extractErrorMessage(error, 'Unable to submit quiz') });
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (isInitialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 mx-auto border-4 border-[var(--primary)] border-t-transparent rounded-full"
            />
            <p className="text-[var(--muted-foreground)] text-lg">Loading your personalized quizzes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalQuizzes = quizzesList.length;
  const activeQuizzes = quizzesList.filter((quiz) => quiz.status === 'active').length;
  const averageScore = quizzesList.length
    ? Math.round(
        quizzesList.reduce((sum, quiz) => sum + (quiz.bestScore ?? 0), 0) / quizzesList.length,
      )
    : 0;

  const totalQuestions = selectedQuiz?.questions?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">🧠 Quiz Center</h1>
            <p className="text-[var(--muted-foreground)]">
              Challenge yourself with personalized quizzes and track your mastery.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              label=""
              placeholder="Filter by topic"
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
            />
            <Button variant="outline" onClick={handleRefresh} isLoading={quizzesLoading}>
              Refresh
            </Button>
          </div>
        </motion.div>

        {quizzesError && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-600"
          >
            <p className="font-semibold">Unable to load quizzes.</p>
            <p className="text-sm">{quizzesError}</p>
          </motion.div>
        )}

        {feedback && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-xl border ${feedback.type === 'success' ? 'border-green-500/40 bg-green-500/10 text-green-700' : 'border-red-500/40 bg-red-500/10 text-red-600'}`}
          >
            <p className="font-semibold">{feedback.message}</p>
          </motion.div>
        )}

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Total Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalQuizzes}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Generated just for you</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Challenges</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeQuizzes}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Quizzes ready for a new attempt</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Average Best Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{averageScore}%</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Across all your quizzes</p>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 xl:grid-cols-[2fr,3fr] gap-6"
        >
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Generate New Quiz</CardTitle>
              <Badge variant="accent">AI Generated</Badge>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleGenerateQuiz}>
                <Input
                  label="Quiz Topic"
                  placeholder="React hooks"
                  value={generateForm.topic}
                  onChange={(event) => setGenerateForm((prev) => ({ ...prev, topic: event.target.value }))}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Difficulty</label>
                    <select
                      value={generateForm.difficulty}
                      onChange={(event) => setGenerateForm((prev) => ({ ...prev, difficulty: event.target.value as Quiz['difficulty'] }))}
                      className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Question Count</label>
                    <input
                      type="number"
                      min={3}
                      max={20}
                      value={generateForm.questionCount}
                      onChange={(event) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          questionCount: Math.max(3, Math.min(20, Number(event.target.value) || prev.questionCount)),
                        }))
                      }
                      required
                      className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>
                {formErrors && <p className="text-sm text-red-600">{formErrors}</p>}
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" isLoading={generatingQuiz}>
                    Generate Quiz
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Quiz Library</CardTitle>
              <Badge variant="secondary">Select to Practice</Badge>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {quizzesList.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  You haven&apos;t generated any quizzes yet. Create one to get started!
                </p>
              ) : (
                quizzesList.map((quiz) => (
                  <button
                    key={quiz.quizId}
                    type="button"
                    onClick={() => setSelectedQuizId(quiz.quizId)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                      quiz.quizId === selectedQuiz?.quizId
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">{quiz.topic}</h3>
                        <p className="text-xs text-[var(--muted-foreground)]">{quiz.questions?.length ?? 0} questions • {quiz.estimatedMinutes} min</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold ${difficultyColors[quiz.difficulty]}`}>
                        {quiz.difficulty}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      <span>Attempts: <strong>{quiz.attempts}</strong></span>
                      <span>Best score: <strong>{quiz.bestScore ?? 0}%</strong></span>
                      <span>Status: <strong>{quiz.status}</strong></span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </motion.section>

        {selectedQuiz ? (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>{selectedQuiz.topic}</CardTitle>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {selectedQuiz.questions?.length ?? 0} questions • Estimated {selectedQuiz.estimatedMinutes} minutes • Passing score {selectedQuiz.passingScore}%
                  </p>
                </div>
                <Badge variant="accent">{selectedQuiz.difficulty}</Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedQuiz.questions?.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[var(--primary)]">Question {index + 1}</p>
                        <p className="text-base font-semibold text-[var(--foreground)]">{question.question}</p>
                      </div>
                      <Badge variant="secondary">{question.type.replace('-', ' ')}</Badge>
                    </div>

                    {question.type === 'multiple-choice' && question.options ? (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label
                            key={`${question.id}-option-${optionIndex}`}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                              answers[question.id] === option
                                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                : 'border-[var(--border)] hover:border-[var(--primary)]/60'
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={option}
                              checked={answers[question.id] === option}
                              onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                              className="accent-[var(--primary)]"
                            />
                            <span className="text-sm text-[var(--foreground)]">{option}</span>
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {question.type === 'true-false' ? (
                      <div className="flex gap-3">
                        {[true, false].map((value) => (
                          <label
                            key={`${question.id}-${value}`}
                            className={`flex-1 px-3 py-2 rounded-lg border text-center font-semibold transition-colors ${
                              answers[question.id] === value
                                ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                                : 'border-[var(--border)] hover:border-[var(--primary)]/60'
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={String(value)}
                              checked={answers[question.id] === value}
                              onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
                              className="hidden"
                            />
                            {value ? 'True' : 'False'}
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {question.type === 'short-answer' ? (
                      <textarea
                        rows={3}
                        value={(answers[question.id] as string) || ''}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                        placeholder="Type your answer"
                      />
                    ) : null}

                    <p className="text-xs text-[var(--muted-foreground)]">{question.points} points</p>
                  </div>
                ))}

                <div className="flex justify-between items-center">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Total questions: <strong>{totalQuestions}</strong> • Estimated time: <strong>{selectedQuiz.estimatedMinutes} minutes</strong>
                  </p>
                  <Button variant="primary" onClick={handleSubmitQuiz} isLoading={submittingQuiz}>
                    Submit Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>

            {submissionResult ? (
              <Card>
                <CardHeader>
                  <CardTitle>Latest Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                      <p className="text-xs text-[var(--muted-foreground)] uppercase">Score</p>
                      <p className="text-2xl font-bold text-[var(--foreground)]">{submissionResult.score}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                      <p className="text-xs text-[var(--muted-foreground)] uppercase">Percentage</p>
                      <p className={`text-2xl font-bold ${submissionResult.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {submissionResult.scorePercentage}%
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                      <p className="text-xs text-[var(--muted-foreground)] uppercase">Correct</p>
                      <p className="text-2xl font-bold text-[var(--foreground)]">{submissionResult.correctCount}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                      <p className="text-xs text-[var(--muted-foreground)] uppercase">Total Questions</p>
                      <p className="text-2xl font-bold text-[var(--foreground)]">{submissionResult.totalQuestions}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Question Review</h3>
                    <div className="space-y-3">
                      {submissionResult.results.map((result) => {
                        const question = selectedQuiz.questions.find((item) => item.id === result.questionId);
                        if (!question) return null;
                        return (
                          <div
                            key={result.questionId}
                            className={`p-4 rounded-xl border ${
                              result.isCorrect
                                ? 'border-emerald-500/40 bg-emerald-500/10'
                                : 'border-rose-500/40 bg-rose-500/10'
                            }`}
                          >
                            <p className="text-sm font-semibold text-[var(--foreground)]">{question.question}</p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                              Your answer: <strong>{String(result.userAnswer)}</strong>
                            </p>
                            {!result.isCorrect && (
                              <p className="text-xs text-[var(--muted-foreground)]">
                                Correct answer: <strong>{String(result.correctAnswer)}</strong>
                              </p>
                            )}
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                              Points earned: <strong>{result.pointsEarned}</strong>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </motion.section>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
