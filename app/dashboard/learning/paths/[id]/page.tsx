/**
 * Individual Learning Path View Page
 * 
 * Displays detailed view of a specific learning path with steps and resources
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { LearningPath, LearningStep } from '@/types';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function LearningPathViewPage() {
  const params = useParams();
  const router = useRouter();
  const pathId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);

  useEffect(() => {
    const fetchPath = async () => {
      if (!pathId) return;

      try {
        setLoading(true);
        const response = await api.learning.getPath(pathId);

        if (response.success && response.data) {
          // Apply sequential progression logic
          const pathData = response.data;
          const updatedSteps = pathData.steps.map((step, index) => {
            if (index === 0) {
              // First step is always available if not completed
              return { 
                ...step, 
                status: (step.status === 'completed' ? 'completed' : 'available') as 'locked' | 'available' | 'in-progress' | 'completed'
              };
            } else {
              // Check if previous step is completed
              const prevStep = pathData.steps[index - 1];
              if (prevStep.status === 'completed') {
                return { 
                  ...step, 
                  status: (step.status === 'completed' ? 'completed' : 'available') as 'locked' | 'available' | 'in-progress' | 'completed'
                };
              } else {
                // Lock steps until previous is completed
                return { ...step, status: 'locked' as const };
              }
            }
          });

          setPath({ ...pathData, steps: updatedSteps });
        } else {
          throw new Error(response.error || 'Failed to fetch learning path');
        }

        setError(null);
      } catch (err) {
        console.error('Fetch path error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load learning path');
      } finally {
        setLoading(false);
      }
    };

    fetchPath();
  }, [pathId]);

  const handleStepComplete = async (step: LearningStep) => {
    if (!path || step.status === 'locked') return;

    try {
      setUpdatingStep(step.id);

      const response = await api.learning.updateProgress({
        conceptId: step.conceptId,
        status: 'completed',
        timeSpentMinutes: 0,
      });

      if (response.success) {
        // Update steps with sequential progression
        const updatedSteps = path.steps.map((s, index) => {
          if (s.id === step.id) {
            // Mark current step as completed
            return { ...s, status: 'completed' as const };
          }
          // Unlock the NEXT step only
          const currentStepIndex = path.steps.findIndex(st => st.id === step.id);
          if (index === currentStepIndex + 1 && s.status === 'locked') {
            return { ...s, status: 'available' as const };
          }
          return s;
        });

        // Calculate new progress
        const completedCount = updatedSteps.filter(s => s.status === 'completed').length;
        const newProgress = Math.round((completedCount / updatedSteps.length) * 100);

        // Update in Firestore
        await api.learning.updatePath(pathId, {
          steps: updatedSteps,
          progress: newProgress,
          status: newProgress === 100 ? 'completed' : 'active',
        });

        // Refresh the path data
        const refreshResponse = await api.learning.getPath(pathId);
        if (refreshResponse.success && refreshResponse.data) {
          setPath(refreshResponse.data);
        }
      }
    } catch (err) {
      console.error('Update step error:', err);
    } finally {
      setUpdatingStep(null);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in-progress':
        return '🔄';
      case 'available':
        return '📖';
      case 'locked':
        return '🔒';
      default:
        return '📝';
    }
  };

  const getStatusBadgeVariant = (status: string): 'primary' | 'secondary' | 'accent' | 'default' => {
    switch (status) {
      case 'completed':
        return 'secondary';
      case 'in-progress':
        return 'primary';
      case 'available':
        return 'accent';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto border-4 border-[var(--primary)] border-t-transparent rounded-full"
            />
            <p className="text-[var(--muted-foreground)] text-lg">Loading learning path...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !path) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-6xl mb-6">⚠️</div>
              <h2 className="text-2xl font-bold mb-4">Learning Path Not Found</h2>
              <p className="text-[var(--muted-foreground)] mb-8">{error || 'Unable to load this path'}</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
                <Link href="/dashboard/learning/paths">
                  <Button variant="primary">View All Paths</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const completedSteps = path.steps?.filter((s) => s.status === 'completed').length || 0;
  const totalSteps = path.steps?.length || 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <Link href="/dashboard/learning/paths">
              <Button variant="outline" leftIcon={<span>←</span>}>
                All Paths
              </Button>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">{path.name}</h1>
              <p className="text-lg text-[var(--muted-foreground)]">
                {path.description || 'Your personalized learning journey'}
              </p>
            </div>
            <Badge variant="primary" size="md">
              {path.status}
            </Badge>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-[var(--muted-foreground)]">
                      {completedSteps} of {totalSteps} steps completed
                    </span>
                    <span className="font-bold text-xl">{path.progress}%</span>
                  </div>
                  <div className="w-full bg-[var(--muted)] rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${path.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-[var(--primary)] rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[var(--muted)] rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold">{totalSteps}</div>
                    <div className="text-sm text-[var(--muted-foreground)] mt-1">Total Steps</div>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                      {completedSteps}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 mt-1">Completed</div>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                      {totalSteps - completedSteps}
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">Remaining</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Learning Steps */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-6">Learning Steps</h2>
          <div className="space-y-4">
            {path.steps?.map((step, index) => {
              const isLocked = step.status === 'locked';
              const isCompleted = step.status === 'completed';
              const isAvailable = step.status === 'available' || step.status === 'in-progress';

              return (
                <Card 
                  key={step.id} 
                  className={`${isCompleted ? 'opacity-75' : ''} ${isLocked ? 'opacity-50' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Step Number */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${
                            isCompleted
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : isLocked
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                              : step.status === 'in-progress'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                          }`}
                        >
                          {isCompleted ? getStepIcon('completed') : isLocked ? '🔒' : getStepIcon(step.status)}
                        </div>
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="text-xl font-bold mb-2">
                              Step {step.order}: {step.conceptId}
                            </h3>
                            <Badge variant={getStatusBadgeVariant(step.status)} size="sm">
                              {isLocked ? '🔒 Locked - Complete Previous Step' : step.status}
                            </Badge>
                          </div>
                        </div>

                        {isLocked && (
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-300 my-4">
                            <p className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                              🔒 <span>Complete Step {index} to unlock this content</span>
                            </p>
                          </div>
                        )}

                        {/* Resources */}
                        {!isLocked && step.resources && step.resources.length > 0 && (
                          <div className="space-y-3 mb-4">
                            <h4 className="font-semibold text-sm text-[var(--muted-foreground)]">
                              Resources:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {step.resources.map((resource, idx) => (
                                <a
                                  key={idx}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 bg-[var(--muted)] rounded-lg hover:bg-[var(--muted)]/70 transition-colors"
                                >
                                  <span className="text-2xl">
                                    {resource.type === 'video'
                                      ? '🎥'
                                      : resource.type === 'article'
                                      ? '📄'
                                      : resource.type === 'interactive'
                                      ? '🎮'
                                      : '📝'}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{resource.title}</div>
                                    <div className="text-xs text-[var(--muted-foreground)]">
                                      {resource.type} • {resource.duration} min
                                    </div>
                                  </div>
                                  <span className="text-[var(--primary)]">→</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        {!isLocked && !isCompleted && (
                          <Button
                            variant="primary"
                            onClick={() => handleStepComplete(step)}
                            disabled={updatingStep === step.id}
                          >
                            {updatingStep === step.id
                              ? 'Marking Complete...'
                              : step.status === 'in-progress'
                              ? 'Mark as Complete'
                              : 'Start Learning'}
                          </Button>
                        )}

                        {isCompleted && step.completedAt && (
                          <div className="text-sm text-[var(--muted-foreground)]">
                            ✓ Completed {new Date(
                              typeof step.completedAt === 'string' 
                                ? step.completedAt 
                                : step.completedAt.seconds * 1000
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex gap-4"
        >
          <Link href="/dashboard/learning/paths" className="flex-1">
            <Button variant="outline" fullWidth>
              View All Paths
            </Button>
          </Link>
          <Link href="/dashboard/learning/generate" className="flex-1">
            <Button variant="primary" fullWidth>
              Generate New Path
            </Button>
          </Link>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
