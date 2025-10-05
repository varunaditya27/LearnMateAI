/**
 * Study Buddy System Component
 * 
 * Complete study buddy matching system with request creation, browsing,
 * connection management, and active buddies display
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/services/api';

const matchTopics = ['react', 'python', 'javascript', 'ui-ux', 'data-science'];
const paceOptions: Array<'slow' | 'medium' | 'fast'> = ['slow', 'medium', 'fast'];
const skillLevels: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];
const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Singapore'];

type TabType = 'browse' | 'requests' | 'my-buddies';

interface StudyBuddySystemProps {
  isReady: boolean;
}

export function StudyBuddySystem({ isReady }: StudyBuddySystemProps) {
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [filterTopic, setFilterTopic] = useState<string>('');
  const [filterPace, setFilterPace] = useState<string>('');
  const [filterSkillLevel, setFilterSkillLevel] = useState<string>('');
  
  // Create Request Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    topic: matchTopics[0],
    timezone: timezones[0],
    pace: paceOptions[1],
    skillLevel: skillLevels[1],
    description: '',
  });
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Send Connection State
  const [sendingConnection, setSendingConnection] = useState<Set<string>>(new Set());
  const [connectionMessage, setConnectionMessage] = useState<Record<string, string>>({});

  // Fetch available study buddies
  const {
    data: availableBuddies,
    loading: buddiesLoading,
    refetch: refetchBuddies,
  } = useAsyncData(
    async () => {
      const response = await api.community.getStudyBuddyRequests({
        topic: filterTopic || undefined,
        pace: filterPace || undefined,
        skillLevel: filterSkillLevel || undefined,
      });
      return response.success ? response.data || [] : [];
    },
    {
      enabled: isReady && activeTab === 'browse',
      immediate: isReady && activeTab === 'browse',
      cacheKey: `study-buddies-${filterTopic}-${filterPace}-${filterSkillLevel}`,
      watch: [isReady, activeTab, filterTopic, filterPace, filterSkillLevel],
    }
  );

  // Fetch connection requests
  const {
    data: connectionRequests,
    loading: requestsLoading,
    refetch: refetchRequests,
  } = useAsyncData(
    async () => {
      const response = await api.community.getConnectionRequests();
      return response.success ? response.data || [] : [];
    },
    {
      enabled: isReady && activeTab === 'requests',
      immediate: isReady && activeTab === 'requests',
      cacheKey: 'connection-requests',
      watch: [isReady, activeTab],
    }
  );

  // Fetch my study buddies
  const {
    data: myBuddies,
    loading: myBuddiesLoading,
    refetch: refetchMyBuddies,
  } = useAsyncData(
    async () => {
      const response = await api.community.getMyStudyBuddies();
      return response.success ? response.data || [] : [];
    },
    {
      enabled: isReady && activeTab === 'my-buddies',
      immediate: isReady && activeTab === 'my-buddies',
      cacheKey: 'my-study-buddies',
      watch: [isReady, activeTab],
    }
  );

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRequest(true);
    setCreateError(null);

    try {
      const response = await api.community.createStudyBuddyRequest(requestForm);
      if (response.success) {
        setShowCreateForm(false);
        setRequestForm({
          topic: matchTopics[0],
          timezone: timezones[0],
          pace: paceOptions[1],
          skillLevel: skillLevels[1],
          description: '',
        });
        refetchBuddies();
      } else {
        setCreateError(response.error || 'Failed to create request');
      }
    } catch (error) {
      setCreateError('An error occurred');
    } finally {
      setCreatingRequest(false);
    }
  };

  const handleSendConnection = async (recipientId: string) => {
    setSendingConnection(prev => new Set(prev).add(recipientId));

    try {
      const message = connectionMessage[recipientId] || '';
      const response = await api.community.sendConnectionRequest(recipientId, message);
      
      if (response.success) {
        alert('Connection request sent successfully!');
        setConnectionMessage(prev => {
          const updated = { ...prev };
          delete updated[recipientId];
          return updated;
        });
      } else {
        alert(response.error || 'Failed to send connection request');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSendingConnection(prev => {
        const updated = new Set(prev);
        updated.delete(recipientId);
        return updated;
      });
    }
  };

  const handleRespondToRequest = async (connectionId: string, action: 'accept' | 'reject') => {
    try {
      const response = await api.community.respondToConnectionRequest(connectionId, action);
      if (response.success) {
        alert(`Connection request ${action}ed successfully!`);
        refetchRequests();
        if (action === 'accept') {
          refetchMyBuddies();
        }
      } else {
        alert(response.error || `Failed to ${action} request`);
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const pendingRequests = connectionRequests?.filter(r => r.status === 'pending') || [];
  const incomingRequests = pendingRequests.filter(r => r.type === 'incoming');
  const outgoingRequests = pendingRequests.filter(r => r.type === 'outgoing');

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>🤝 Study Buddy Network</CardTitle>
          {activeTab === 'browse' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancel' : "I'm Looking for a Buddy"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--border)] pb-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'browse'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Browse ({availableBuddies?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Requests ({incomingRequests.length})
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('my-buddies')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'my-buddies'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            My Buddies ({myBuddies?.length || 0})
          </button>
        </div>

        {/* Create Request Form */}
        <AnimatePresence>
          {showCreateForm && activeTab === 'browse' && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateRequest}
              className="space-y-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--card)]"
            >
              <h3 className="font-semibold text-[var(--foreground)]">Create Study Buddy Request</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Topic</label>
                  <select
                    value={requestForm.topic}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, topic: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] outline-none"
                  >
                    {matchTopics.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <select
                    value={requestForm.timezone}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] outline-none"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pace</label>
                  <select
                    value={requestForm.pace}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, pace: e.target.value as typeof prev.pace }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] outline-none"
                  >
                    {paceOptions.map(pace => (
                      <option key={pace} value={pace}>{pace}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Skill Level</label>
                  <select
                    value={requestForm.skillLevel}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, skillLevel: e.target.value as typeof prev.skillLevel }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] outline-none"
                  >
                    {skillLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell potential buddies about your learning goals..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              {createError && (
                <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-600 text-sm">
                  {createError}
                </div>
              )}
              <Button type="submit" variant="primary" isLoading={creatingRequest} fullWidth>
                Post Request
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="">All Topics</option>
                {matchTopics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
              <select
                value={filterPace}
                onChange={(e) => setFilterPace(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="">All Paces</option>
                {paceOptions.map(pace => (
                  <option key={pace} value={pace}>{pace}</option>
                ))}
              </select>
              <select
                value={filterSkillLevel}
                onChange={(e) => setFilterSkillLevel(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="">All Levels</option>
                {skillLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Browse Results */}
            {buddiesLoading ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">Loading...</div>
            ) : availableBuddies && availableBuddies.length > 0 ? (
              <div className="space-y-3">
                {availableBuddies.map((buddy) => (
                  <div key={buddy.id} className="p-4 border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/60 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-[var(--foreground)]">{buddy.userName}</h3>
                          <Badge variant="secondary" size="sm">{buddy.skillLevel}</Badge>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] mb-2">
                          {buddy.topic} • {buddy.pace} pace • {buddy.timezone}
                        </p>
                        {buddy.description && (
                          <p className="text-sm text-[var(--foreground)] mb-3">{buddy.description}</p>
                        )}
                        <textarea
                          value={connectionMessage[buddy.userId] || ''}
                          onChange={(e) => setConnectionMessage(prev => ({ ...prev, [buddy.userId]: e.target.value }))}
                          placeholder="Add a personal message (optional)..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:border-[var(--primary)] outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendConnection(buddy.userId)}
                        isLoading={sendingConnection.has(buddy.userId)}
                      >
                        Send Connection Request
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                No study buddy requests found. Be the first to post!
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {requestsLoading ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">Loading...</div>
            ) : (
              <>
                {/* Incoming Requests */}
                {incomingRequests.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Incoming Requests ({incomingRequests.length})</h3>
                    <div className="space-y-3">
                      {incomingRequests.map((request) => (
                        <div key={request.id} className="p-4 border-2 border-green-500/40 rounded-xl bg-green-500/5">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold">
                              {request.senderName[0]}
                            </div>
                            <div>
                              <h4 className="font-semibold">{request.senderName}</h4>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {request.message && (
                            <p className="text-sm text-[var(--foreground)] mb-3 pl-13">{request.message}</p>
                          )}
                          <div className="flex gap-2 pl-13">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleRespondToRequest(request.id, 'accept')}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRespondToRequest(request.id, 'reject')}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outgoing Requests */}
                {outgoingRequests.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Sent Requests ({outgoingRequests.length})</h3>
                    <div className="space-y-3">
                      {outgoingRequests.map((request) => (
                        <div key={request.id} className="p-4 border border-[var(--border)] rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold">
                              {request.recipientName[0]}
                            </div>
                            <div>
                              <h4 className="font-semibold">{request.recipientName}</h4>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                Sent {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="secondary" size="sm" className="ml-auto">Pending</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingRequests.length === 0 && (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    No pending requests
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* My Buddies Tab */}
        {activeTab === 'my-buddies' && (
          <div className="space-y-4">
            {myBuddiesLoading ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">Loading...</div>
            ) : myBuddies && myBuddies.length > 0 ? (
              <div className="space-y-3">
                {myBuddies.map((buddy) => (
                  <div key={buddy.connectionId} className="p-4 border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold text-lg">
                        {buddy.buddyName[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--foreground)]">{buddy.buddyName}</h3>
                        {buddy.buddyEmail && (
                          <p className="text-sm text-[var(--muted-foreground)]">{buddy.buddyEmail}</p>
                        )}
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Connected {new Date(buddy.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="success" size="sm">Connected</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                No study buddies yet. Start browsing!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
