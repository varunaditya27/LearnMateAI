'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, RefreshCw, ExternalLink, ThumbsUp, CheckCircle, Bookmark, X, Video, FileText, Gamepad2, GraduationCap, BookMarked } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/services/api';
import type { ResourceRecommendation } from '@/types/api';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const learningStyles = ['visual', 'auditory', 'kinesthetic', 'reading'] as const;

type LearningStyle = (typeof learningStyles)[number];

type RecommendationQuery = {
  topic: string;
  difficulty: ResourceRecommendation['difficulty'];
  learningStyle?: LearningStyle;
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

const difficultyStyles: Record<ResourceRecommendation['difficulty'], string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-rose-100 text-rose-700',
};

const resourceIconsMap: Record<ResourceRecommendation['type'], React.ComponentType<{ className?: string }>> = {
  video: Video,
  article: FileText,
  interactive: Gamepad2,
  course: GraduationCap,
  documentation: BookMarked,
};

const fetchRecommendations = async (query: RecommendationQuery | null) => {
  if (!query) {
    throw new Error('No topic selected.');
  }
  const response = await api.resources.getRecommendations(query.topic, query.learningStyle, query.difficulty);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(extractErrorMessage(response.error, 'Unable to fetch recommendations'));
};

export default function ResourceRecommendationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard();
  const isReady = isAuthenticated && !authLoading;

  const [form, setForm] = useState({
    topic: '',
    difficulty: 'beginner' as ResourceRecommendation['difficulty'],
    learningStyle: '' as '' | LearningStyle,
  });

  const [query, setQuery] = useState<RecommendationQuery | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null);

  const {
    data: recommendations,
    loading,
    error,
    refetch,
  } = useAsyncData(() => fetchRecommendations(query), {
    enabled: isReady && !!query,
    immediate: !!query,
    cacheKey: query ? `resource-${query.topic}-${query.difficulty}-${query.learningStyle ?? 'any'}` : undefined,
    watch: [isReady, query?.topic, query?.difficulty, query?.learningStyle],
  });

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.topic.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a topic to receive recommendations.' });
      return;
    }

    const nextQuery: RecommendationQuery = {
      topic: form.topic.trim(),
      difficulty: form.difficulty,
      learningStyle: form.learningStyle || undefined,
    };

    setQuery(nextQuery);
  };

  const handleFeedback = async (
    resource: ResourceRecommendation,
    action: 'liked' | 'completed' | 'saved' | 'dismissed',
  ) => {
    setFeedback(null);
    setFeedbackLoading(`${resource.url}-${action}`);

    try {
      const response = await api.resources.saveFeedback({
        resourceUrl: resource.url,
        resourceTitle: resource.title,
        action,
      });

      if (response.success) {
        setFeedback({ type: 'success', message: `Thanks! We registered that you ${action} this resource.` });
      } else {
        throw new Error(extractErrorMessage(response.error, 'Unable to save feedback'));
      }
    } catch (error) {
      setFeedback({ type: 'error', message: extractErrorMessage(error, 'Unable to save your feedback') });
    } finally {
      setFeedbackLoading(null);
    }
  };

  const isInitialLoading = authLoading || (loading && !recommendations);

  const summary = useMemo(() => {
    if (!recommendations) return null;
    const total = recommendations.recommendations.length;
    const byType = recommendations.recommendations.reduce<Record<string, number>>((acc, resource) => {
      acc[resource.type] = (acc[resource.type] ?? 0) + 1;
      return acc;
    }, {});

    const averageMinutes = total
      ? Math.round(
          recommendations.recommendations.reduce((sum, resource) => sum + resource.estimatedMinutes, 0) / total,
        )
      : 0;

    return { total, byType, averageMinutes };
  }, [recommendations]);

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
            <p className="text-[var(--muted-foreground)] text-lg">Gathering learning resources...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
              <BookOpen className="w-8 h-8 text-[var(--primary)]" />
              Smart Resources
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Discover tailored videos, articles, and hands-on projects crafted for how you learn best.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} isLoading={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

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

        {error && query && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-600"
          >
            <p className="font-semibold">We couldn&apos;t load recommendations.</p>
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid grid-cols-1 xl:grid-cols-[2fr,3fr] gap-6"
        >
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Personalize Your Feed</CardTitle>
              <Badge variant="accent">AI Curated</Badge>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSearch}>
                <Input
                  label="Learning Topic"
                  placeholder="TypeScript generics"
                  value={form.topic}
                  onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Difficulty</label>
                    <select
                      value={form.difficulty}
                      onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value as ResourceRecommendation['difficulty'] }))}
                      className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Preferred Style</label>
                    <select
                      value={form.learningStyle}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          learningStyle: (event.target.value as LearningStyle) || '',
                        }))
                      }
                      className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">Any style</option>
                      {learningStyles.map((style) => (
                        <option key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" isLoading={loading}>
                    Find Resources
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Why Personalization Matters</CardTitle>
              <Badge variant="secondary">Learning Science</Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[var(--muted-foreground)]">
              <p>
                The right resource at the right time keeps momentum high. We map content to your goals, preferred formats, and time budget.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Recommendations adapt as you log feedback on what helped most.</li>
                <li>Balance quick wins with deeper dives using estimated time commitments.</li>
                <li>Complement your learning paths with fresh resources each week.</li>
              </ul>
              <p>
                Tip: After completing a resource, mark it as completed so new suggestions keep stretching your skills.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {recommendations ? (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Recommended for {recommendations.topic}</h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Tailored to your {recommendations.userContext.learningStyle} learning style.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
                <span className="px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                  {summary?.total ?? 0} resources
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-600">
                  Avg. {summary?.averageMinutes ?? 0} min each
                </span>
                {summary?.byType &&
                  Object.entries(summary.byType).map(([type, count]) => {
                    const IconComponent = resourceIconsMap[type as ResourceRecommendation['type']];
                    return (
                      <span key={type} className="px-3 py-1 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] flex items-center gap-1.5">
                        {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                        {type}: {count}
                      </span>
                    );
                  })}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {recommendations.recommendations.map((resource) => {
                const ResourceIcon = resourceIconsMap[resource.type];
                return (
                  <Card key={resource.url} className="border-2 border-[var(--border)] hover:border-[var(--primary)]/60 transition-colors">
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {ResourceIcon && <ResourceIcon className="w-5 h-5 text-[var(--primary)]" />}
                          {resource.title}
                        </CardTitle>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">{resource.platform}</p>
                      </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold ${difficultyStyles[resource.difficulty]}`}>
                        {resource.difficulty}
                      </span>
                      <span className="px-3 py-1 text-xs rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                        {resource.estimatedMinutes} min
                      </span>
                      <span className="px-3 py-1 text-xs rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                        Match: {Math.round(resource.matchScore * 100)}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-[var(--foreground)]">{resource.description}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{resource.matchReason}</p>
                    <div className="flex flex-wrap gap-2">
                      {resource.tags.map((tag) => (
                        <span key={`${resource.url}-tag-${tag}`} className="px-3 py-1 text-xs rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-[var(--primary)] underline underline-offset-4"
                      >
                        Open resource
                      </a>
                      <div className="flex flex-wrap gap-2">
                        {(['liked', 'saved', 'completed', 'dismissed'] as const).map((action) => (
                          <Button
                            key={`${resource.url}-${action}`}
                            variant="outline"
                            size="sm"
                            onClick={() => handleFeedback(resource, action)}
                            isLoading={feedbackLoading === `${resource.url}-${action}`}
                          >
                            {action === 'liked' && <><ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> Like</>}
                            {action === 'saved' && <><Bookmark className="w-3.5 h-3.5 mr-1.5" /> Save</>}
                            {action === 'completed' && <><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Completed</>}
                            {action === 'dismissed' && <><X className="w-3.5 h-3.5 mr-1.5" /> Dismiss</>}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>

            {recommendations.learningPath?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Learning Sequence</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {recommendations.learningPath.map((step, index) => (
                      <li key={`${recommendations.topic}-step-${index}`} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-semibold">
                          {index + 1}
                        </span>
                        <p className="text-sm text-[var(--foreground)]">{step}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ) : null}

            {recommendations.additionalTips?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle>Extra Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-sm text-[var(--muted-foreground)]">
                    {recommendations.additionalTips.map((tip, index) => (
                      <li key={`${recommendations.topic}-tip-${index}`}>{tip}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </motion.section>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-[var(--muted-foreground)]">
              Search for a topic to see curated resource recommendations tailored to your learning style.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
