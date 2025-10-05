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
        setJoinFeedback({ type: 'success', message: 'You successfully joined the challenge!' });
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
                      variant="primary"
                      fullWidth
                      isLoading={joiningChallengeId === challenge.id}
                      disabled={joiningChallengeId !== null}
                      onClick={() => handleJoinChallenge(challenge.id)}
                    >
                      Join Challenge
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
                          <p className="text-xs text-[var(--muted-foreground)]">Timezone: {match.timezone} • Pace: {match.pace}</p>
                        </div>
                        <Badge variant="accent">Match Score {match.matchScore}%</Badge>
                      </div>
                      <p className="mt-3 text-sm text-[var(--muted-foreground)]">{match.matchReason}</p>
                      {match.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {match.interests.map((interest) => (
                            <Badge key={interest} variant="secondary" size="sm">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Latest Discussions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      <span>Replies: {discussion.replies}</span>
                      <span>Likes: {discussion.likes}</span>
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
