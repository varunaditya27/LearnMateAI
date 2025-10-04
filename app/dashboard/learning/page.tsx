/**
 * Learning Path Page
 * 
 * Displays skill selection and active learning paths with resources.
 */

'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SkillSelector } from '@/components/learning/SkillSelector';
import { ResourceCard } from '@/components/learning/ResourceCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { mockDomains } from '@/lib/mockData';
import { generateLearningPath } from '@/services/ai';
import { LearningPath } from '@/types';

export default function LearningPage() {
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTopicSelect = async (topicId: string) => {
    setIsLoading(true);
    try {
      // Generate learning path using AI service (mock for now)
      const path = await generateLearningPath('user-123', 'web-dev', 'frontend', topicId);
      setActivePath(path);
    } catch (error) {
      console.error('Failed to generate learning path:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResourceStart = (resourceId: string) => {
    console.log('Starting resource:', resourceId);
    // TODO: Track session start in Firestore
  };

  const handleResourceComplete = (resourceId: string) => {
    console.log('Completing resource:', resourceId);
    // TODO: Update progress in Firestore
    // TODO: Update streak and points
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
                <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  Step {index + 1}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {step.resources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onStart={handleResourceStart}
                      onComplete={handleResourceComplete}
                      isCompleted={step.status === 'completed'}
                    />
                  ))}
                </div>
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
