/**
 * Comprehensive API Service Layer
 * 
 * Centralized service for all backend API calls with proper error handling,
 * TypeScript types, and authentication headers.
 */

import type {
  ApiResponse,
  StudyBuddyMatchRequest,
  StudyBuddyMatch,
  GroupChallenge,
  CreateChallengeRequest,
  Discussion,
  MotivationBoost,
  HabitChallenge,
  CreateHabitRequest,
  UpdateHabitProgressRequest,
  CareerRoadmap,
  GenerateRoadmapRequest,
  Quiz,
  GenerateQuizRequest,
  QuizSubmission,
  SubmitQuizRequest,
  ResourceRecommendationResponse,
  SaveResourceFeedbackRequest,
  LearningBranch,
  GenerateBranchRequest,
  ActivateBranchRequest,
} from '@/types/api';

import type { User, LearningPath, Progress } from '@/types';
import type { User as FirebaseUser } from 'firebase/auth';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get authentication token from Firebase
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { auth } = await import('@/lib/firebase');
    
    // If user is already available, get token immediately
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(true);
    }
    
    // Wait for auth to initialize (up to 5 seconds)
    const user = await new Promise<FirebaseUser | null>((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);

      const unsubscribe = auth.onAuthStateChanged((user) => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(user);
      });
    });

    if (!user) {
      return null;
    }
    
    return await user.getIdToken(true); // Force refresh
  } catch (error) {
    console.error('[getAuthToken] Error getting auth token:', error);
    return null;
  }
}

/**
 * Generic API call wrapper with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      const errorMessage = data?.error || `HTTP ${response.status}: ${response.statusText}`;

      if (response.status === 401) {
        return {
          success: false,
          error: errorMessage || 'Not authenticated',
          ...(data?.meta ? { meta: data.meta } : {}),
        } as ApiResponse<T>;
      }

      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (!(error instanceof Error && /not authenticated/i.test(error.message))) {
      console.error(`API call to ${endpoint} failed:`, error);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  async login(email: string, password: string) {
    return apiCall<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email: string, password: string, displayName: string) {
    return apiCall<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  },

  async logout() {
    return apiCall<void>('/api/auth/logout', {
      method: 'POST',
    });
  },

  async getSession() {
    return apiCall<{ user: User }>('/api/auth/session');
  },
};

// ============================================
// USER API
// ============================================

export const userApi = {
  async getProfile() {
    return apiCall<User>('/api/user/profile');
  },

  async updateProfile(updates: Partial<User>) {
    return apiCall<User>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async getStats() {
    return apiCall<User['stats']>('/api/user/stats');
  },

  async updateStats(updates: {
    pointsToAdd?: number;
    minutesToAdd?: number;
    conceptsToAdd?: number;
    currentStreak?: number;
  }) {
    return apiCall<User['stats']>('/api/user/stats', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async getPreferences() {
    return apiCall<User['preferences']>('/api/user/preferences');
  },

  async updatePreferences(preferences: Partial<User['preferences']>) {
    return apiCall<User['preferences']>('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },
};

// ============================================
// LEARNING PATHS API
// ============================================

export const learningApi = {
  async getPaths() {
    return apiCall<LearningPath[]>('/api/learning/paths');
  },

  async createPath(path: Partial<LearningPath>) {
    return apiCall<LearningPath>('/api/learning/paths', {
      method: 'POST',
      body: JSON.stringify(path),
    });
  },

  async getPath(id: string) {
    return apiCall<LearningPath>(`/api/learning/paths/${id}`);
  },

  async updatePath(id: string, updates: Partial<LearningPath>) {
    return apiCall<LearningPath>(`/api/learning/paths/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deletePath(id: string) {
    return apiCall<void>(`/api/learning/paths/${id}`, {
      method: 'DELETE',
    });
  },

  async generatePath(domain: string, subdomain: string, topic: string) {
    return apiCall<LearningPath>('/api/learning/generate', {
      method: 'POST',
      body: JSON.stringify({ domain, subdomain, topic }),
    });
  },

  async getProgress(conceptId?: string, resourceId?: string) {
    const params = new URLSearchParams();
    if (conceptId) params.append('conceptId', conceptId);
    if (resourceId) params.append('resourceId', resourceId);
    const query = params.toString();
    return apiCall<Progress[]>(`/api/learning/progress${query ? `?${query}` : ''}`);
  },

  async updateProgress(progress: {
    conceptId: string;
    resourceId?: string;
    status: 'not-started' | 'in-progress' | 'completed';
    timeSpentMinutes?: number;
    notes?: string;
  }) {
    return apiCall<Progress>('/api/learning/progress', {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  },
};

// ============================================
// LEADERBOARD API
// ============================================

export const leaderboardApi = {
  async getLeaderboard(timeframe: 'weekly' | 'monthly' | 'all-time' = 'all-time', limit = 10) {
    return apiCall<Array<{
      userId: string;
      displayName: string;
      points: number;
      streak: number;
      rank: number;
      level: number;
    }>>(`/api/leaderboard?timeframe=${timeframe}&limit=${limit}`);
  },

  async getUserRank(userId: string) {
    return apiCall<{
      userId: string;
      rank: number;
      points: number;
      totalUsers: number;
      percentile: number;
    }>(`/api/leaderboard/rank/${userId}`);
  },
};

// ============================================
// SCREEN TIME API
// ============================================

export const screenTimeApi = {
  async getLogs(date?: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    return apiCall<Array<{
      id: string;
      appName: string;
      appCategory: 'productive' | 'social' | 'entertainment' | 'educational' | 'other';
      durationMinutes: number;
      date: string;
    }>>(`/api/screen-time/logs${query ? `?${query}` : ''}`);
  },

  async logScreenTime(log: {
    appName: string;
    appCategory: 'productive' | 'social' | 'entertainment' | 'educational' | 'other';
    durationMinutes: number;
    date: string;
  }) {
    return apiCall('/api/screen-time/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },

  async getAnalytics(period: 'day' | 'week' | 'month' = 'week') {
    return apiCall<{
      period: string;
      totalMinutes: number;
      totalHours: number;
      categoryBreakdown: Record<string, number>;
      topApps: Array<{ appName: string; minutes: number }>;
      focusScore: number;
      productiveMinutes: number;
      distractionMinutes: number;
    }>(`/api/screen-time/analytics?period=${period}`);
  },
};

// ============================================
// CHATBOT API
// ============================================

export const chatbotApi = {
  async sendMessage(
    message: string,
    conversationHistory?: Array<{ role: string; content: string }>,
    learningContext?: string
  ) {
    return apiCall<{
      response: string;
      timestamp: string;
    }>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversationHistory: conversationHistory || [],
        learningContext,
      }),
    });
  },

  async getHistory(limit = 50) {
    return apiCall<Array<{
      role: string;
      content: string;
      timestamp: string;
    }>>(`/api/chat/history?limit=${limit}`);
  },
};

// ============================================
// DASHBOARD API
// ============================================

export const dashboardApi = {
  async getOverview() {
    return apiCall<{
      user: User;
      stats: User['stats'];
      recentProgress: Progress[];
      activePaths: LearningPath[];
      todayActivity: {
        screenTimeMinutes: number;
        dailyGoalMinutes: number;
        dailyGoalProgress: number;
      };
      leaderboardRank: number;
    }>('/api/dashboard/overview');
  },

  async getSummary(period: 'day' | 'week' = 'day') {
    return apiCall<{
      period: string;
      completedConcepts: number;
      totalMinutesLearned: number;
      totalHoursLearned: number;
      productiveMinutes: number;
      distractionMinutes: number;
      focusScore: number;
      insights: string[];
    }>(`/api/dashboard/summary?period=${period}`);
  },
};

// ============================================
// COMMUNITY API
// ============================================

export const communityApi = {
  async matchStudyBuddy(request: StudyBuddyMatchRequest) {
    return apiCall<{
      matches: StudyBuddyMatch[];
      totalMatches: number;
    }>('/api/community/study-buddy/match', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async getChallenges(status?: 'active' | 'completed' | 'upcoming', topic?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (topic) params.append('topic', topic);
    const query = params.toString();
    return apiCall<GroupChallenge[]>(`/api/community/challenges${query ? `?${query}` : ''}`);
  },

  async createChallenge(request: CreateChallengeRequest) {
    return apiCall<GroupChallenge>('/api/community/challenges', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async joinChallenge(challengeId: string) {
    return apiCall<{
      challengeId: string;
      userId: string;
      joinedAt: string;
      progress: number;
      status: string;
    }>('/api/community/challenges/join', {
      method: 'POST',
      body: JSON.stringify({ challengeId }),
    });
  },

  async getDiscussions(topic?: string, limit = 20) {
    const params = new URLSearchParams();
    if (topic) params.append('topic', topic);
    params.append('limit', limit.toString());
    const query = params.toString();
    return apiCall<Discussion[]>(`/api/community/discussions${query ? `?${query}` : ''}`);
  },

  async createDiscussion(discussion: {
    title: string;
    content: string;
    topic: string;
    tags?: string[];
  }) {
    return apiCall<Discussion>('/api/community/discussions', {
      method: 'POST',
      body: JSON.stringify(discussion),
    });
  },

  async likeDiscussion(discussionId: string) {
    return apiCall<{
      liked: boolean;
      discussionId: string;
      userId: string;
    }>('/api/community/discussions/like', {
      method: 'POST',
      body: JSON.stringify({ discussionId }),
    });
  },

  async getReplies(discussionId: string) {
    return apiCall<Array<{
      id: string;
      discussionId: string;
      content: string;
      author: {
        userId: string;
        displayName: string;
        photoURL: string | null;
      };
      createdAt: string;
    }>>(`/api/community/discussions/replies?discussionId=${discussionId}`);
  },

  async postReply(discussionId: string, content: string) {
    return apiCall<{
      id: string;
      discussionId: string;
      content: string;
      author: {
        userId: string;
        displayName: string;
        photoURL: string | null;
      };
      createdAt: string;
    }>('/api/community/discussions/replies', {
      method: 'POST',
      body: JSON.stringify({ discussionId, content }),
    });
  },

  async getMyJoinedChallenges() {
    return apiCall<Array<{
      participationId: string;
      userId: string;
      joinedAt: string;
      progress: number;
      status: 'active' | 'completed' | 'abandoned';
      completedTasks: string[];
      lastActivityAt: string;
      challenge: {
        id: string;
        name: string;
        description: string;
        topic: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        durationDays: number;
        currentParticipants: number;
        maxParticipants: number;
        rewards?: {
          points: number;
          badges?: string[];
        };
        tasks: Array<{
          id: string;
          title: string;
          description: string;
          order: number;
        }>;
        startDate?: string;
        endDate?: string;
        status: 'draft' | 'active' | 'completed' | 'cancelled';
        createdAt: string;
      };
    }>>('/api/community/challenges/my-challenges');
  },

  // Study Buddy APIs
  async createStudyBuddyRequest(request: {
    topic: string;
    timezone: string;
    pace: 'slow' | 'medium' | 'fast';
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    description?: string;
    availability?: string[];
  }) {
    return apiCall<{
      id: string;
      userId: string;
      userName: string;
      topic: string;
      timezone: string;
      pace: string;
      skillLevel: string;
      description: string;
      availability: string[];
      status: 'active';
      createdAt: string;
    }>('/api/community/study-buddy/requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async getStudyBuddyRequests(filters?: {
    topic?: string;
    pace?: string;
    skillLevel?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.topic) params.append('topic', filters.topic);
    if (filters?.pace) params.append('pace', filters.pace);
    if (filters?.skillLevel) params.append('skillLevel', filters.skillLevel);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return apiCall<Array<{
      id: string;
      userId: string;
      userName: string;
      userEmail: string | null;
      userPhotoURL: string | null;
      topic: string;
      timezone: string;
      pace: string;
      skillLevel: string;
      description: string;
      availability: string[];
      status: 'active';
      createdAt: string;
      updatedAt: string;
    }>>(`/api/community/study-buddy/requests${queryString ? `?${queryString}` : ''}`);
  },

  async cancelStudyBuddyRequest(requestId: string) {
    return apiCall<{ message: string }>(
      `/api/community/study-buddy/requests?requestId=${requestId}`,
      { method: 'DELETE' }
    );
  },

  async sendConnectionRequest(recipientId: string, message?: string) {
    return apiCall<{
      id: string;
      senderId: string;
      recipientId: string;
      message: string;
      status: 'pending';
      createdAt: string;
    }>('/api/community/study-buddy/connections', {
      method: 'POST',
      body: JSON.stringify({ recipientId, message }),
    });
  },

  async getConnectionRequests(filters?: {
    type?: 'incoming' | 'outgoing' | 'all';
    status?: 'pending' | 'accepted' | 'rejected' | 'all';
  }) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    return apiCall<Array<{
      id: string;
      senderId: string;
      senderName: string;
      senderEmail: string | null;
      senderPhotoURL: string | null;
      recipientId: string;
      recipientName: string;
      recipientEmail: string | null;
      recipientPhotoURL: string | null;
      message: string;
      status: 'pending' | 'accepted' | 'rejected';
      type: 'incoming' | 'outgoing';
      createdAt: string;
      updatedAt: string;
    }>>(`/api/community/study-buddy/connections${queryString ? `?${queryString}` : ''}`);
  },

  async respondToConnectionRequest(connectionId: string, action: 'accept' | 'reject') {
    return apiCall<{
      id: string;
      status: 'accepted' | 'rejected';
    }>('/api/community/study-buddy/connections', {
      method: 'PATCH',
      body: JSON.stringify({ connectionId, action }),
    });
  },

  async getMyStudyBuddies() {
    return apiCall<Array<{
      connectionId: string;
      buddyId: string;
      buddyName: string;
      buddyEmail: string | null;
      buddyPhotoURL: string | null;
      connectedAt: string;
      message: string;
    }>>('/api/community/study-buddy/my-buddies');
  },
};

// ============================================
// MOTIVATION & HABITS API
// ============================================

export const motivationApi = {
  async sendBoost(context?: string) {
    return apiCall<MotivationBoost>('/api/motivation/boost', {
      method: 'POST',
      body: JSON.stringify({ context }),
    });
  },

  async getBoosts(limit = 10) {
    return apiCall<MotivationBoost[]>(`/api/motivation/boost?limit=${limit}`);
  },

  async getHabitChallenges(status?: 'active' | 'completed') {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const query = params.toString();
    return apiCall<HabitChallenge[]>(`/api/habits/challenge${query ? `?${query}` : ''}`);
  },

  async createHabitChallenge(request: CreateHabitRequest) {
    return apiCall<HabitChallenge>('/api/habits/challenge', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async updateHabitProgress(request: UpdateHabitProgressRequest) {
    return apiCall<{
      habitId: string;
      date: string;
      value: number;
      completed: boolean;
      updatedStreak: number;
      longestStreak: number;
      progressPercentage: number;
      rewardsEarned: Array<{ type: string; milestone: number; reward: string }>;
    }>('/api/habits/challenge', {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  },
};

// ============================================
// CAREER ROADMAP API
// ============================================

export const roadmapApi = {
  async generate(request: GenerateRoadmapRequest) {
    return apiCall<CareerRoadmap>('/api/roadmap/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async getRoadmaps(status?: 'active' | 'completed') {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const query = params.toString();
    return apiCall<CareerRoadmap[]>(`/api/roadmap/generate${query ? `?${query}` : ''}`);
  },

  async updateRoadmap(roadmapId: string, updates: { progress?: number; status?: 'active' | 'completed' }) {
    return apiCall<{ message: string }>('/api/roadmap/generate', {
      method: 'PATCH',
      body: JSON.stringify({ roadmapId, ...updates }),
    });
  },
};

// ============================================
// QUIZ API
// ============================================

export const quizApi = {
  async generate(request: GenerateQuizRequest) {
    return apiCall<Quiz>('/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async getQuizzes(topic?: string) {
    const params = new URLSearchParams();
    if (topic) params.append('topic', topic);
    const query = params.toString();
    return apiCall<Quiz[]>(`/api/quiz/generate${query ? `?${query}` : ''}`);
  },

  async submit(request: SubmitQuizRequest) {
    return apiCall<QuizSubmission>('/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};

// ============================================
// RESOURCES API
// ============================================

export const resourcesApi = {
  async getRecommendations(
    topic: string,
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading',
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ) {
    const params = new URLSearchParams({ topic, difficulty });
    if (learningStyle) params.append('learningStyle', learningStyle);
    return apiCall<ResourceRecommendationResponse>(`/api/resources/recommend?${params.toString()}`);
  },

  async saveFeedback(feedback: SaveResourceFeedbackRequest) {
    return apiCall<{
      id: string;
      resourceUrl: string;
      action: string;
      rating?: number;
      createdAt: string;
    }>('/api/resources/recommend', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  },
};

// ============================================
// LEARNING BRANCHES API
// ============================================

export const branchesApi = {
  async generate(request: GenerateBranchRequest) {
    return apiCall<{
      pathId: string;
      branches: LearningBranch[];
      recommendation: string;
      createdAt: string;
    }>('/api/learning/branch', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async activate(request: ActivateBranchRequest) {
    return apiCall<{
      pathId: string;
      activeBranch: string;
      branchStartedAt: string;
      previousBranch: string | null;
    }>('/api/learning/branch', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  async getBranches(pathId: string) {
    return apiCall<LearningBranch[]>(`/api/learning/branch?pathId=${pathId}`);
  },
};

// Export all APIs as a single object for convenience
export const api = {
  auth: authApi,
  user: userApi,
  learning: learningApi,
  leaderboard: leaderboardApi,
  screenTime: screenTimeApi,
  chatbot: chatbotApi,
  dashboard: dashboardApi,
  community: communityApi,
  motivation: motivationApi,
  roadmap: roadmapApi,
  quiz: quizApi,
  resources: resourcesApi,
  branches: branchesApi,
};

export default api;
