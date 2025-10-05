/**
 * Learning Path Page
 * 
 * Displays skill selection and active learning paths with resources.
 */

'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SkillSelector } from '@/components/learning/SkillSelector';
import { EnhancedResourceCard } from '@/components/learning/EnhancedResourceCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { mockDomains } from '@/lib/mockData';
import { LearningPath } from '@/types';
import { learningApi, userApi } from '@/services/api';

export default function LearningPage() {
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleTopicSelect = async (topicId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate learning path using API
      const response = await learningApi.generatePath('web-dev', 'frontend', topicId);
      
      if (response.success && response.data) {
        setActivePath(response.data);
      } else {
        throw new Error(response.error || 'Failed to generate learning path');
      }
    } catch (err) {
      console.error('Failed to generate learning path:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate learning path');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResourceStart = async (resourceId: string, resourceType: string) => {
    console.log('Starting resource:', resourceId);
    
    // Start a new session
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/learning/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resourceId,
          conceptId: activePath?.steps.find(s => 
            s.resources.some(r => r.id === resourceId)
          )?.conceptId,
          pathId: activePath?.id,
          resourceType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleResourceProgress = async (resourceId: string, data: { watchTime: number; progress: number }) => {
    if (!sessionId) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await fetch('/api/learning/session', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          progress: data.progress,
          watchTime: data.watchTime,
          focusTime: data.watchTime * 0.8, // Estimate if not available
        }),
      });
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  const handleFavoriteToggle = (resourceId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(resourceId)) {
        newFavorites.delete(resourceId);
      } else {
        newFavorites.add(resourceId);
      }
      return newFavorites;
    });
  };

  const handleResourceComplete = async (resourceId: string) => {
    if (!activePath) return;

    try {
      // Find which step contains this resource
      const stepWithResource = activePath.steps.find(step =>
        step.resources.some(r => r.id === resourceId)
      );

      if (!stepWithResource) return;

      // Update progress
      await learningApi.updateProgress({
        conceptId: stepWithResource.conceptId,
        resourceId,
        status: 'completed',
        timeSpentMinutes: 0,
      });

      // Update user stats
      await userApi.updateStats({
        pointsToAdd: 10,
        minutesToAdd: stepWithResource.resources.find(r => r.id === resourceId)?.estimatedTime || 0,
      });

      // Refresh the path
      if (activePath.id) {
        const pathResponse = await learningApi.getPath(activePath.id);
        if (pathResponse.success && pathResponse.data) {
          setActivePath(pathResponse.data);
        }
      }
    } catch (err) {
      console.error('Failed to complete resource:', err);
    }
  };

  const handleStepComplete = async (stepId: string) => {
    if (!activePath) return;

    try {
      const step = activePath.steps.find(s => s.id === stepId);
      if (!step) return;

      // Update progress for this step
      await learningApi.updateProgress({
        conceptId: step.conceptId,
        status: 'completed',
        timeSpentMinutes: 0,
      });

      // Update the path with new step statuses
      const updatedSteps = activePath.steps.map((s, index) => {
        if (s.id === stepId) {
          return { ...s, status: 'completed' as const };
        }
        // Unlock next step
        if (index > 0 && activePath.steps[index - 1].id === stepId && s.status === 'locked') {
          return { ...s, status: 'available' as const };
        }
        return s;
      });

      const completedSteps = updatedSteps.filter(s => s.status === 'completed').length;
      const newProgress = Math.round((completedSteps / updatedSteps.length) * 100);

      if (activePath.id) {
        await learningApi.updatePath(activePath.id, {
          steps: updatedSteps,
          progress: newProgress,
          status: newProgress === 100 ? 'completed' : 'active',
        });

        // Refresh path
        const pathResponse = await learningApi.getPath(activePath.id);
        if (pathResponse.success && pathResponse.data) {
          setActivePath(pathResponse.data);
        }
      }

      // Update user stats
      await userApi.updateStats({
        pointsToAdd: 50,
        conceptsToAdd: 1,
      });
    } catch (err) {
      console.error('Failed to complete step:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">
            {activePath ? 'Your Learning Path' : 'Choose Your Learning Path'}
          </h1>
          <p className="text-[var(--muted-foreground)]">
            {activePath 
              ? 'Follow these resources to master your chosen topic'
              : 'Select a domain and topic to get started'}
          </p>
        </div>

        {error && (
          <Card className="border-red-500">
            <CardContent className="py-4">
              <p className="text-red-600 font-medium">⚠️ {error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">Generating your personalized learning path...</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  AI is analyzing the best resources for you
                </p>
              </div>
            </CardContent>
          </Card>
        ) : activePath ? (
          <>
            {/* Learning Path Header */}
            <Card className="bg-gradient-to-r from-[var(--primary)] to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-white text-2xl">{activePath.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 opacity-90">{activePath.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Overall Progress</span>
                    <span className="font-bold">{activePath.progress}%</span>
                  </div>
                  <Progress value={activePath.progress} color="accent" size="lg" />
                </div>
                <div className="flex gap-4 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActivePath(null)}
                    className="bg-white/10 backdrop-blur"
                  >
                    Choose Different Topic
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Learning Steps */}
            {activePath.steps.map((step, index) => (
              <div key={step.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    {step.title || `Step ${index + 1}`}
                  </h2>
                  {step.status === 'completed' && (
                    <Badge variant="secondary">✓ Completed</Badge>
                  )}
                  {step.status === 'in-progress' && (
                    <Badge variant="primary">In Progress</Badge>
                  )}
                  {step.status === 'locked' && (
                    <Badge variant="default">🔒 Locked</Badge>
                  )}
                </div>

                {step.description && (
                  <p className="text-[var(--muted-foreground)]">{step.description}</p>
                )}

                {step.objectives && step.objectives.length > 0 && (
                  <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Learning Objectives:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {step.objectives.map((obj, i) => (
                        <li key={i} className="text-sm text-[var(--muted-foreground)]">{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {step.resources.map((resource) => (
                    <EnhancedResourceCard
                      key={resource.id}
                      resource={resource}
                      onStart={() => handleResourceStart(resource.id, resource.type)}
                      onComplete={() => handleResourceComplete(resource.id)}
                      onProgress={handleResourceProgress}
                      onToggleFavorite={() => handleFavoriteToggle(resource.id)}
                      isFavorite={favorites.has(resource.id)}
                      isCompleted={step.status === 'completed'}
                      progress={0}
                    />
                  ))}
                </div>

                {step.status !== 'completed' && step.status !== 'locked' && (
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => handleStepComplete(step.id)}
                    >
                      Mark Step as Complete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <SkillSelector domains={mockDomains} onSelect={handleTopicSelect} />
        )}
      </div>
    </DashboardLayout>
  );
}
