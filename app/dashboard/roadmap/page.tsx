'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, RefreshCw } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/services/api';
import type { CareerRoadmap } from '@/types/api';

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

const fetchRoadmaps = async (statusFilter: 'all' | 'active' | 'completed') => {
  const response = await api.roadmap.getRoadmaps(statusFilter === 'all' ? undefined : statusFilter);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(extractErrorMessage(response.error, 'Unable to load career roadmaps'));
};

const experienceLevels = ['beginner', 'intermediate', 'advanced'] as const;

type ExperienceLevel = typeof experienceLevels[number];

export default function RoadmapPage() {
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

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const {
    data: roadmaps,
    loading: roadmapsLoading,
    error: roadmapsError,
    refetch: refetchRoadmaps,
    invalidate: invalidateRoadmaps,
  } = useAsyncData(() => fetchRoadmaps(statusFilter), {
    enabled: isReady,
    immediate: isReady,
    cacheKey: `career-roadmaps-${statusFilter}`,
    watch: [isReady, statusFilter],
  });

  const [form, setForm] = useState({
    careerGoal: '',
    experienceLevel: experienceLevels[0] as ExperienceLevel,
    timeframe: '6 months',
    currentSkills: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isInitialLoading = authLoading || (roadmapsLoading && !roadmaps);

  const handleRefresh = useCallback(async () => {
    await refetchRoadmaps();
  }, [refetchRoadmaps]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFeedback(null);

    try {
      const currentSkills = form.currentSkills
        .split(',')
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      const response = await api.roadmap.generate({
        careerGoal: form.careerGoal,
        experienceLevel: form.experienceLevel,
        timeframe: form.timeframe,
        currentSkills: currentSkills.length > 0 ? currentSkills : undefined,
      });

      if (response.success && response.data) {
        setForm({ careerGoal: '', experienceLevel: experienceLevels[0], timeframe: '6 months', currentSkills: '' });
        setFeedback({ type: 'success', message: 'Career roadmap generated successfully!' });
        
        // Invalidate cache and refetch to show new roadmap
        invalidateRoadmaps();
        setTimeout(async () => {
          await refetchRoadmaps();
        }, 500);
      } else {
        throw new Error(extractErrorMessage(response.error, 'Unable to generate roadmap'));
      }
    } catch (error) {
      const message = extractErrorMessage(error, 'Unable to generate roadmap');
      setFormError(message);
      setFeedback({ type: 'error', message });
    } finally {
      setSubmitting(false);
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
            <p className="text-[var(--muted-foreground)] text-lg">Preparing your personalized roadmaps...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const roadmapsList = roadmaps ?? [];
  const activeCount = roadmapsList.filter((roadmap) => roadmap.status === 'active').length;
  const completedCount = roadmapsList.filter((roadmap) => roadmap.status === 'completed').length;
  const averageProgress = roadmapsList.length
    ? Math.round(
        roadmapsList.reduce((sum, roadmap) => sum + (roadmap.progress ?? 0), 0) / roadmapsList.length,
      )
    : 0;

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
            <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
              <Rocket className="w-8 h-8 text-[var(--primary)]" />
              Career Roadmaps
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Map your path from where you are to the role you want next.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="px-4 py-2 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="all">All roadmaps</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <Button variant="outline" onClick={handleRefresh} isLoading={roadmapsLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {roadmapsError && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-600"
          >
            <p className="font-semibold">We couldn&apos;t load your roadmaps.</p>
            <p className="text-sm">{roadmapsError}</p>
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
              <CardTitle>Active Roadmaps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeCount}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Currently guiding your journey</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{completedCount}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Roadmaps you&apos;ve finished</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Average Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{averageProgress}%</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Across all generated roadmaps</p>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Generate a New Roadmap</CardTitle>
              <Badge variant="accent">AI Planning</Badge>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  label="Career Goal"
                  placeholder="E.g., Frontend Engineer at a startup"
                  value={form.careerGoal}
                  onChange={(event) => setForm((prev) => ({ ...prev, careerGoal: event.target.value }))}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Experience Level</label>
                    <select
                      value={form.experienceLevel}
                      onChange={(event) => setForm((prev) => ({ ...prev, experienceLevel: event.target.value as ExperienceLevel }))}
                      className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      {experienceLevels.map((level) => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Input
                      label="Target Timeframe"
                      placeholder="6 months"
                      value={form.timeframe}
                      onChange={(event) => setForm((prev) => ({ ...prev, timeframe: event.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                    Current Skills
                    <span className="ml-2 text-xs text-[var(--muted-foreground)]">Comma separated</span>
                  </label>
                  <textarea
                    value={form.currentSkills}
                    onChange={(event) => setForm((prev) => ({ ...prev, currentSkills: event.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    placeholder="HTML, CSS, basic JavaScript"
                  />
                </div>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" isLoading={submitting}>
                    Generate Roadmap
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Why Roadmaps Help</CardTitle>
              <Badge variant="secondary">Career Insights</Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[var(--muted-foreground)]">
              <p>
                Personalized roadmaps translate big goals into actionable steps. Stay focused, track progress, and build the exact skills employers want.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Break complex career transitions into clear milestones.</li>
                <li>Get AI-curated resources, certifications, and project ideas.</li>
                <li>Track progress visually and celebrate completed phases.</li>
              </ul>
              <p>
                Tip: Update your current skills regularly so recommendations stay relevant and stretch you just enough.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Your Roadmaps</h2>
            <Badge variant="accent">{roadmapsList.length}</Badge>
          </div>

          {roadmapsList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-[var(--muted-foreground)]">
                No roadmaps yet. Generate one to start a guided journey toward your next role!
              </CardContent>
            </Card>
          ) : (
            roadmapsList.map((roadmap: CareerRoadmap) => (
              <Card key={roadmap.id} className="overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-1/3 border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--muted)]/40 p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={roadmap.status === 'completed' ? 'secondary' : 'accent'}>{roadmap.status}</Badge>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        Progress: <strong>{roadmap.progress}%</strong>
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">{roadmap.careerGoal}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{roadmap.overview}</p>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-[var(--foreground)]">Required Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {roadmap.requiredSkills?.technical?.map((skill) => (
                          <span key={`${roadmap.id}-tech-${skill}`} className="px-3 py-1 text-xs rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                            {skill}
                          </span>
                        ))}
                        {roadmap.requiredSkills?.soft?.map((skill) => (
                          <span key={`${roadmap.id}-soft-${skill}`} className="px-3 py-1 text-xs rounded-full bg-amber-500/15 text-amber-600">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    {roadmap.nextSteps?.length ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[var(--foreground)]">Next Steps</p>
                        <ul className="list-disc list-inside text-sm text-[var(--muted-foreground)] space-y-1">
                          {roadmap.nextSteps.map((step, index) => (
                            <li key={`${roadmap.id}-next-${index}`}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[var(--muted-foreground)]">
                      {roadmap.estimatedTimeToJob && (
                        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                          <p className="font-semibold text-[var(--foreground)]">Estimated Timeline</p>
                          <p>{roadmap.estimatedTimeToJob}</p>
                        </div>
                      )}
                      {roadmap.salaryRange && (
                        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                          <p className="font-semibold text-[var(--foreground)]">Salary Range</p>
                          <p>{roadmap.salaryRange}</p>
                        </div>
                      )}
                      {roadmap.jobOutlook && (
                        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                          <p className="font-semibold text-[var(--foreground)]">Job Outlook</p>
                          <p>{roadmap.jobOutlook}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardContent className="lg:w-2/3 space-y-6">
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-[var(--foreground)]">Roadmap Phases</h4>
                      {roadmap.phases?.map((phase) => (
                        <div key={`${roadmap.id}-phase-${phase.phase}`} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-[var(--primary)]">Phase {phase.phase}</p>
                              <h5 className="text-lg font-semibold text-[var(--foreground)]">{phase.title}</h5>
                            </div>
                            <Badge variant="secondary" className="uppercase tracking-wide">
                              {phase.duration}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)]">{phase.description}</p>
                          {phase.skills?.length ? (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
                                Focus Skills
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {phase.skills.map((skill) => (
                                  <span key={`${roadmap.id}-phase-${phase.phase}-skill-${skill}`} className="px-2 py-1 text-xs rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {phase.milestones?.length ? (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
                                Milestones
                              </p>
                              <ul className="list-disc list-inside text-sm text-[var(--muted-foreground)] space-y-1">
                                {phase.milestones.map((milestone, index) => (
                                  <li key={`${roadmap.id}-phase-${phase.phase}-milestone-${index}`}>{milestone}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {phase.resources?.length ? (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
                                Recommended Resources
                              </p>
                              <ul className="list-disc list-inside text-sm text-[var(--muted-foreground)] space-y-1">
                                {phase.resources.map((resource, index) => (
                                  <li key={`${roadmap.id}-phase-${phase.phase}-resource-${index}`}>{resource}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {roadmap.projectIdeas?.length ? (
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-[var(--foreground)]">Project Ideas</h4>
                        <ul className="list-disc list-inside text-sm text-[var(--muted-foreground)] space-y-1">
                          {roadmap.projectIdeas.map((idea, index) => (
                            <li key={`${roadmap.id}-project-${index}`}>{idea}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {roadmap.certifications?.length ? (
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-[var(--foreground)]">Recommended Certifications</h4>
                        <div className="flex flex-wrap gap-2">
                          {roadmap.certifications.map((certification) => (
                            <span key={`${roadmap.id}-cert-${certification}`} className="px-3 py-1 text-xs rounded-full bg-purple-500/15 text-purple-600">
                              {certification}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </div>
              </Card>
            ))
          )}
        </motion.section>
      </div>
    </DashboardLayout>
  );
}
