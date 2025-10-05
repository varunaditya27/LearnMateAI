'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/services/api';
import type { GroupChallenge, Discussion, StudyBuddyMatch } from '@/types/api';

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

const fetchActiveChallenges = async () => {
  const response = await api.community.getChallenges('active');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(extractErrorMessage(response.error, 'Failed to load challenges'));
};

const fetchRecentDiscussions = async () => {
  const response = await api.community.getDiscussions(undefined, 6);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(extractErrorMessage(response.error, 'Failed to load discussions'));
};

const matchTopics = ['react', 'python', 'javascript', 'ui-ux', 'data-science'];
const paceOptions: Array<'slow' | 'medium' | 'fast'> = ['slow', 'medium', 'fast'];
const skillLevels: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];
const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Singapore'];

export default function CommunityPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard();

  const isReady = isAuthenticated && !authLoading;

  const {
    data: challenges,
    loading: challengesLoading,
    error: challengesError,
    refetch: refetchChallenges,
  } = useAsyncData(fetchActiveChallenges, {
    enabled: isReady,
    immediate: isReady,
    cacheKey: 'community-active-challenges',
    watch: [isReady],
  });

  const {
    data: discussions,
    loading: discussionsLoading,
    error: discussionsError,
    refetch: refetchDiscussions,
  } = useAsyncData(fetchRecentDiscussions, {
    enabled: isReady,
    immediate: isReady,
    cacheKey: 'community-discussions',
    watch: [isReady],
  });

  const [matchForm, setMatchForm] = useState({
    topic: matchTopics[0],
    timezone: timezones[0],
    pace: paceOptions[1],
    skillLevel: skillLevels[1],
  });

  const [matchResults, setMatchResults] = useState<StudyBuddyMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(null);
  const [joinFeedback, setJoinFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeForm, setChallengeForm] = useState({
    name: '',
    description: '',
    topic: matchTopics[0],
    durationDays: 7,
    maxParticipants: 20,
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
  });
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);

  const [showDiscussionForm, setShowDiscussionForm] = useState(false);
  const [discussionForm, setDiscussionForm] = useState({
    title: '',
    content: '',
    topic: matchTopics[0],
    tags: '',
  });
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [discussionError, setDiscussionError] = useState<string | null>(null);

  const [joinedChallenges, setJoinedChallenges] = useState<Set<string>>(new Set());
  const [expandedDiscussions, setExpandedDiscussions] = useState<Set<string>>(new Set());
  const [discussionReplies, setDiscussionReplies] = useState<Record<string, Array<{
    id: string;
    content: string;
    author: { displayName: string; photoURL: string | null };
    createdAt: string;
  }>>>({});
  const [replyForms, setReplyForms] = useState<Record<string, string>>({});
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({});
  const [likedDiscussions, setLikedDiscussions] = useState<Set<string>>(new Set());
  const [likingDiscussions, setLikingDiscussions] = useState<Set<string>>(new Set());

  const isInitialLoading = authLoading || ((challengesLoading || discussionsLoading) && !challenges && !discussions);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchChallenges(), refetchDiscussions()]);
  }, [refetchChallenges, refetchDiscussions]);

  const handleMatchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMatchLoading(true);
    setMatchError(null);

    try {
      const response = await api.community.matchStudyBuddy(matchForm);
      if (response.success && response.data) {
        setMatchResults(response.data.matches);
      } else {
        throw new Error(extractErrorMessage(response.error, 'Unable to find study buddies'));
      }
    } catch (error) {
      setMatchError(extractErrorMessage(error, 'Unable to find study buddies'));
      setMatchResults([]);
    } finally {
      setMatchLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    setJoiningChallengeId(challengeId);
    setJoinFeedback(null);

    try {
      const response = await api.community.joinChallenge(challengeId);
      if (response.success) {
        setJoinedChallenges(prev => new Set(prev).add(challengeId));
        setJoinFeedback({ 
          type: 'success', 
          message: '🎉 You successfully joined the challenge! Check your dashboard progress tracker to start learning.' 
        });
        await refetchChallenges();
      } else {
        throw new Error(extractErrorMessage(response.error, 'Unable to join challenge'));
      }
    } catch (error) {
      setJoinFeedback({ type: 'error', message: extractErrorMessage(error, 'Unable to join challenge') });
    } finally {
      setJoiningChallengeId(null);
    }
  };

  const handleLikeDiscussion = async (discussionId: string) => {
    if (likingDiscussions.has(discussionId)) return;

    setLikingDiscussions(prev => new Set(prev).add(discussionId));

    try {
      const response = await api.community.likeDiscussion(discussionId);
      if (response.success && response.data) {
        if (response.data.liked) {
          setLikedDiscussions(prev => new Set(prev).add(discussionId));
        } else {
          setLikedDiscussions(prev => {
            const newSet = new Set(prev);
            newSet.delete(discussionId);
            return newSet;
          });
        }
        await refetchDiscussions();
      }
    } catch (error) {
      console.error('Failed to like discussion:', error);
    } finally {
      setLikingDiscussions(prev => {
        const newSet = new Set(prev);
        newSet.delete(discussionId);
        return newSet;
      });
    }
  };

  const toggleDiscussionReplies = async (discussionId: string) => {
    if (expandedDiscussions.has(discussionId)) {
      // Collapse
      setExpandedDiscussions(prev => {
        const newSet = new Set(prev);
        newSet.delete(discussionId);
        return newSet;
      });
    } else {
      // Expand and fetch replies
      setExpandedDiscussions(prev => new Set(prev).add(discussionId));
      
      try {
        const response = await api.community.getReplies(discussionId);
        if (response.success && response.data) {
          setDiscussionReplies(prev => ({
            ...prev,
            [discussionId]: response.data || [],
          }));
        }
      } catch (error) {
        console.error('Failed to fetch replies:', error);
      }
    }
  };

  const handlePostReply = async (discussionId: string) => {
    const content = replyForms[discussionId]?.trim();
    if (!content) return;

    setReplyLoading(prev => ({ ...prev, [discussionId]: true }));

    try {
      const response = await api.community.postReply(discussionId, content);
      if (response.success && response.data) {
        // Add new reply to the list
        setDiscussionReplies(prev => {
          const existingReplies = prev[discussionId] || [];
          return {
            ...prev,
            [discussionId]: [...existingReplies, response.data!],
          };
        });
        // Clear form
        setReplyForms(prev => ({ ...prev, [discussionId]: '' }));
        // Refresh to update reply count
        await refetchDiscussions();
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setReplyLoading(prev => ({ ...prev, [discussionId]: false }));
    }
  };

  const handleCreateChallenge = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChallengeLoading(true);
    setChallengeError(null);

    try {
      const response = await api.community.createChallenge({
        name: challengeForm.name,
        description: challengeForm.description,
        topic: challengeForm.topic,
        durationDays: challengeForm.durationDays,
        maxParticipants: challengeForm.maxParticipants,
        difficulty: challengeForm.difficulty,
      });

      if (response.success) {
        setShowChallengeForm(false);
        setChallengeForm({
          name: '',
          description: '',
          topic: matchTopics[0],
          durationDays: 7,
          maxParticipants: 20,
          difficulty: 'beginner',
        });
        await refetchChallenges();
        setJoinFeedback({ type: 'success', message: 'Challenge created successfully!' });
      } else {
        throw new Error(extractErrorMessage(response.error, 'Unable to create challenge'));
      }
    } catch (error) {
      setChallengeError(extractErrorMessage(error, 'Unable to create challenge'));
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleCreateDiscussion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDiscussionLoading(true);
    setDiscussionError(null);

    try {
      const tags = discussionForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await api.community.createDiscussion({
        title: discussionForm.title,
        content: discussionForm.content,
        topic: discussionForm.topic,
        tags,
      });

      if (response.success) {
        setShowDiscussionForm(false);
        setDiscussionForm({
          title: '',
          content: '',
          topic: matchTopics[0],
          tags: '',
        });
        await refetchDiscussions();
        setJoinFeedback({ type: 'success', message: 'Discussion posted successfully!' });
      } else {
        throw new Error(extractErrorMessage(response.error, 'Unable to create discussion'));
      }
    } catch (error) {
      setDiscussionError(extractErrorMessage(error, 'Unable to create discussion'));
    } finally {
      setDiscussionLoading(false);
    }
  };

  const activeChallenges = challenges ?? [];
  const latestDiscussions = discussions ?? [];

  const errorMessage = challengesError || discussionsError;

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
            <p className="text-[var(--muted-foreground)] text-lg">Loading the community hub...</p>
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
            <h1 className="text-3xl font-heading font-bold mb-2">🤝 Community Hub</h1>
            <p className="text-[var(--muted-foreground)]">
              Join challenges, find study buddies, and share insights with other learners.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} isLoading={challengesLoading || discussionsLoading}>
              Refresh
            </Button>
          </div>
        </motion.div>

        {errorMessage && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-600"
          >
            <p className="font-semibold">We couldn&apos;t load all community data.</p>
            <p className="text-sm">{errorMessage}</p>
          </motion.div>
        )}

        {joinFeedback && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-xl border ${joinFeedback.type === 'success' ? 'border-green-500/40 bg-green-500/10 text-green-700' : 'border-red-500/40 bg-red-500/10 text-red-600'}`}
          >
            <p className="font-semibold">{joinFeedback.message}</p>
          </motion.div>
        )}

        {/* Create Challenge Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.02 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create a New Challenge</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowChallengeForm(!showChallengeForm)}
                >
                  {showChallengeForm ? 'Cancel' : 'New Challenge'}
                </Button>
              </div>
            </CardHeader>
            {showChallengeForm && (
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreateChallenge}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                        Challenge Name *
                      </label>
                      <input
                        type="text"
                        value={challengeForm.name}
                        onChange={(e) => setChallengeForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="e.g., 30-Day React Mastery"
                        className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                        Description *
                      </label>
                      <textarea
                        value={challengeForm.description}
                        onChange={(e) => setChallengeForm(prev => ({ ...prev, description: e.target.value }))}
                        required
                        rows={3}
                        placeholder="Describe the challenge goals and what participants will learn..."
                        className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Topic *</label>
                      <select
                        value={challengeForm.topic}
                        onChange={(e) => setChallengeForm(prev => ({ ...prev, topic: e.target.value }))}
                        className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        {matchTopics.map((topic) => (
                          <option key={topic} value={topic}>{topic}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Difficulty</label>
                      <select
                        value={challengeForm.difficulty}
                        onChange={(e) => setChallengeForm(prev => ({ ...prev, difficulty: e.target.value as typeof prev.difficulty }))}
                        className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Duration (days)</label>
                      <input
                        type="number"
                        value={challengeForm.durationDays}
                        onChange={(e) => setChallengeForm(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 7 }))}
                        min={1}
                        max={365}
                        className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Max Participants</label>
                      <input
                        type="number"
                        value={challengeForm.maxParticipants}
                        onChange={(e) => setChallengeForm(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 20 }))}
                        min={2}
                        max={1000}
                        className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>
                  {challengeError && (
                    <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-600 text-sm">
                      {challengeError}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Rewards: {challengeForm.durationDays * 100} points
                    </p>
                    <Button type="submit" variant="primary" isLoading={challengeLoading}>
                      Create Challenge
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Featured Challenges</h2>
            <Badge variant="accent">{activeChallenges.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeChallenges.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-[var(--muted-foreground)]">
                  No active challenges yet. Check back soon or start a new one!
                </CardContent>
              </Card>
            ) : (
              activeChallenges.map((challenge: GroupChallenge) => (
                <Card key={challenge.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between gap-2">
                      <span className="line-clamp-1">{challenge.name}</span>
                      <Badge variant="secondary" size="sm">{challenge.difficulty}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-3">{challenge.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
                      <div>
                        <span className="font-semibold text-[var(--foreground)]">Topic:</span> {challenge.topic}
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--foreground)]">Duration:</span> {challenge.durationDays} days
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--foreground)]">Participants:</span> {challenge.currentParticipants}/{challenge.maxParticipants}
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--foreground)]">Rewards:</span> {challenge.rewards?.points ?? 0} pts
                      </div>
                    </div>
                    <Button
                      variant={joinedChallenges.has(challenge.id) ? "secondary" : "primary"}
                      fullWidth
                      isLoading={joiningChallengeId === challenge.id}
                      disabled={joiningChallengeId !== null || joinedChallenges.has(challenge.id)}
                      onClick={() => handleJoinChallenge(challenge.id)}
                    >
                      {joinedChallenges.has(challenge.id) ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Joined
                        </span>
                      ) : 'Join Challenge'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Find a Study Buddy</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleMatchSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Topic</label>
                    <select
                      value={matchForm.topic}
                      onChange={(event) => setMatchForm((prev) => ({ ...prev, topic: event.target.value }))}
                      className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      {matchTopics.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Timezone</label>
                    <select
                      value={matchForm.timezone}
                      onChange={(event) => setMatchForm((prev) => ({ ...prev, timezone: event.target.value }))}
                      className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Preferred Pace</label>
                    <select
                      value={matchForm.pace}
                      onChange={(event) => setMatchForm((prev) => ({ ...prev, pace: event.target.value as typeof prev.pace }))}
                      className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      {paceOptions.map((pace) => (
                        <option key={pace} value={pace}>
                          {pace}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Skill Level</label>
                    <select
                      value={matchForm.skillLevel}
                      onChange={(event) => setMatchForm((prev) => ({ ...prev, skillLevel: event.target.value as typeof prev.skillLevel }))}
                      className="w-full px-3 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      {skillLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    We&apos;ll match you with learners who share similar goals and schedules.
                  </p>
                  <Button type="submit" variant="primary" isLoading={matchLoading}>
                    Find Matches
                  </Button>
                </div>
              </form>

              {matchError && (
                <div className="mt-4 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-600 text-sm">
                  {matchError}
                </div>
              )}

              <div className="mt-6 space-y-4">
                {matchResults.length === 0 && !matchLoading ? (
                  <p className="text-sm text-[var(--muted-foreground)]">No matches yet. Submit the form to discover your next study buddy!</p>
                ) : (
                  matchResults.map((match) => (
                    <div key={match.userId} className="p-4 border border-[var(--border)] rounded-xl bg-[var(--card)] hover:border-[var(--primary)]/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--foreground)]">{match.displayName}</h3>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {match.topic} • {match.skillLevel}
                            {match.studyPreferences?.timezone && ` • ${match.studyPreferences.timezone}`}
                            {match.studyPreferences?.pace && ` • ${match.studyPreferences.pace} pace`}
                          </p>
                        </div>
                        <Badge variant="accent">{match.matchScore}% Match</Badge>
                      </div>
                      <p className="mt-3 text-sm text-[var(--muted-foreground)]">{match.matchReason}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Latest Discussions</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowDiscussionForm(!showDiscussionForm)}
                >
                  {showDiscussionForm ? 'Cancel' : 'New Discussion'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showDiscussionForm && (
                <form className="space-y-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--card)]" onSubmit={handleCreateDiscussion}>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Discussion Title *
                    </label>
                    <input
                      type="text"
                      value={discussionForm.title}
                      onChange={(e) => setDiscussionForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                      placeholder="e.g., Best practices for React hooks?"
                      className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Content *
                    </label>
                    <textarea
                      value={discussionForm.content}
                      onChange={(e) => setDiscussionForm(prev => ({ ...prev, content: e.target.value }))}
                      required
                      rows={4}
                      placeholder="Share your thoughts, questions, or insights..."
                      className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Topic *</label>
                      <select
                        value={discussionForm.topic}
                        onChange={(e) => setDiscussionForm(prev => ({ ...prev, topic: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        {matchTopics.map((topic) => (
                          <option key={topic} value={topic}>{topic}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={discussionForm.tags}
                        onChange={(e) => setDiscussionForm(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="hooks, best-practices"
                        className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>
                  {discussionError && (
                    <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-600 text-sm">
                      {discussionError}
                    </div>
                  )}
                  <Button type="submit" variant="primary" isLoading={discussionLoading} fullWidth>
                    Post Discussion
                  </Button>
                </form>
              )}

              {latestDiscussions.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No discussions yet. Start the conversation by posting your questions!</p>
              ) : (
                latestDiscussions.map((discussion: Discussion) => (
                  <div key={discussion.id} className="p-4 border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/60 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" size="sm">{discussion.topic}</Badge>
                      <span className="text-xs text-[var(--muted-foreground)]">{new Date(discussion.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{discussion.title}</h3>
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-3">{discussion.content}</p>
                    
                    {/* Interactive buttons */}
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        onClick={() => handleLikeDiscussion(discussion.id)}
                        disabled={likingDiscussions.has(discussion.id)}
                        className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
                      >
                        <svg 
                          className="w-4 h-4" 
                          fill={likedDiscussions.has(discussion.id) ? "currentColor" : "none"}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{discussion.likes}</span>
                      </button>
                      
                      <button
                        onClick={() => toggleDiscussionReplies(discussion.id)}
                        className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{discussion.replies} {expandedDiscussions.has(discussion.id) ? '▲' : '▼'}</span>
                      </button>
                    </div>

                    {discussion.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {discussion.tags.map((tag) => (
                          <Badge key={tag} variant="accent" size="sm">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Reply section */}
                    {expandedDiscussions.has(discussion.id) && (
                      <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
                        {/* Reply form */}
                        <div className="space-y-2">
                          <textarea
                            value={replyForms[discussion.id] || ''}
                            onChange={(e) => setReplyForms(prev => ({ ...prev, [discussion.id]: e.target.value }))}
                            placeholder="Write your reply..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)]"
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePostReply(discussion.id)}
                            isLoading={replyLoading[discussion.id]}
                            disabled={!replyForms[discussion.id]?.trim()}
                          >
                            Post Reply
                          </Button>
                        </div>

                        {/* Replies list */}
                        <div className="space-y-2">
                          {discussionReplies[discussion.id]?.map((reply) => (
                            <div key={reply.id} className="p-3 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-[var(--foreground)]">{reply.author.displayName}</span>
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-[var(--foreground)]">{reply.content}</p>
                            </div>
                          ))}
                          {!discussionReplies[discussion.id] && (
                            <p className="text-xs text-[var(--muted-foreground)] italic">Loading replies...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </DashboardLayout>
  );
}
