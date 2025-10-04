/**
 * Core Type Definitions for LearnMate
 * 
 * This file contains all the TypeScript interfaces and types used throughout the application.
 * Organized by feature domain for better maintainability.
 */

import { Timestamp } from 'firebase/firestore';

// ==================== USER TYPES ====================

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // TODO: Add role-based access (student, admin, mentor)
  role?: 'student' | 'admin' | 'mentor';
  preferences?: UserPreferences;
  stats?: UserStats;
}

export interface UserPreferences {
  timezone: string;
  dailyGoalMinutes: number;
  reminderEnabled: boolean;
  reminderTime?: string; // Format: "HH:MM"
  learningStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  notificationSettings?: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  streakReminders: boolean;
}

export interface UserStats {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  totalMinutesLearned: number;
  completedConcepts: number;
  level: number;
  rank?: number;
}

// ==================== LEARNING DOMAIN TYPES ====================

export interface Domain {
  id: string;
  name: string;
  description: string;
  icon?: string;
  subdomains: Subdomain[];
}

export interface Subdomain {
  id: string;
  domainId: string;
  name: string;
  description: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  subdomainId: string;
  name: string;
  description: string;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  concepts: Concept[];
}

export interface Concept {
  id: string;
  topicId: string;
  name: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  prerequisites?: string[]; // Array of concept IDs
}

// ==================== LEARNING PATH TYPES ====================

export interface LearningPath {
  id: string;
  userId: string;
  name: string;
  description?: string;
  domainId: string;
  subdomainId: string;
  topicId: string;
  steps: LearningStep[];
  status: 'active' | 'completed' | 'paused';
  progress: number; // 0-100
  startedAt: Timestamp;
  completedAt?: Timestamp;
  estimatedCompletionDate?: Timestamp;
  // TODO: Add adaptive learning features - difficulty adjustment based on performance
}

export interface LearningStep {
  id: string;
  conceptId: string;
  order: number;
  resources: Resource[];
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  completedAt?: Timestamp;
  score?: number; // 0-100 for quiz/assessment
}

// ==================== RESOURCE TYPES ====================

export type ResourceType = 'video' | 'article' | 'interactive' | 'quiz' | 'exercise';

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // in minutes
  provider?: string; // e.g., "YouTube", "Medium", "Custom"
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number; // in minutes
}

// ==================== PROGRESS TRACKING TYPES ====================

export interface Progress {
  id: string;
  userId: string;
  conceptId: string;
  resourceId?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  timeSpentMinutes: number;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  lastAccessedAt: Timestamp;
  notes?: string;
  // TODO: Add performance metrics - quiz scores, retention rate
}

export interface SessionLog {
  id: string;
  userId: string;
  resourceId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  durationMinutes: number;
  completed: boolean;
  focusScore?: number; // 0-100, based on engagement
  // TODO: Add eye-tracking or focus detection integration
}

// ==================== SCREEN TIME TRACKING TYPES ====================

export interface ScreenTimeLog {
  id: string;
  userId: string;
  appName: string;
  appCategory: 'productive' | 'social' | 'entertainment' | 'educational' | 'other';
  startTime: Timestamp;
  endTime?: Timestamp;
  durationMinutes: number;
  date: string; // Format: "YYYY-MM-DD"
  // TODO: Extend with browser extension data for more accurate tracking
}

export interface DistractionLog {
  id: string;
  userId: string;
  sessionId: string; // Reference to SessionLog
  appName: string;
  timestamp: Timestamp;
  durationSeconds: number;
  context?: string; // What they were learning when distracted
}

// ==================== GAMIFICATION TYPES ====================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'completion' | 'speed' | 'consistency' | 'social' | 'special';
  requirement: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Timestamp;
  progress?: number; // For progressive achievements
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  points: number;
  streak: number;
  rank: number;
  level: number;
  badge?: string;
}

export interface DailyChallenge {
  id: string;
  date: string; // Format: "YYYY-MM-DD"
  title: string;
  description: string;
  goal: number; // e.g., minutes to learn, concepts to complete
  points: number;
  expiresAt: Timestamp;
}

// ==================== SOCIAL/COMMUNITY TYPES ====================

// TODO: Implement in future iterations
export interface StudyBuddy {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'active' | 'completed';
  sharedTopics: string[];
  matchScore: number; // 0-100
  connectedAt: Timestamp;
}

export interface GroupChallenge {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  goal: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'upcoming' | 'active' | 'completed';
}

// ==================== REMINDER & NOTIFICATION TYPES ====================

export interface Reminder {
  id: string;
  userId: string;
  type: 'daily' | 'streak' | 'goal' | 'custom';
  message: string;
  scheduledFor: Timestamp;
  sent: boolean;
  sentAt?: Timestamp;
  // TODO: Integrate with n8n for advanced reminder workflows
}

// ==================== AI/DOUBT CLARIFICATION TYPES ====================

export interface DoubtQuery {
  id: string;
  userId: string;
  conceptId: string;
  question: string;
  response?: string;
  timestamp: Timestamp;
  resolved: boolean;
  helpful?: boolean; // User feedback
  // TODO: Add context from current learning session
}

// ==================== DASHBOARD & ANALYTICS TYPES ====================

export interface DailySummary {
  userId: string;
  date: string; // Format: "YYYY-MM-DD"
  completedConcepts: number;
  totalMinutesLearned: number;
  distractionMinutes: number;
  focusScore: number; // 0-100
  pointsEarned: number;
  streakMaintained: boolean;
  achievements: string[]; // Achievement IDs
  topDistractions: { appName: string; minutes: number }[];
  // TODO: Add AI-generated personalized insights
}

export interface WeeklyReport {
  userId: string;
  weekStart: string; // Format: "YYYY-MM-DD"
  weekEnd: string;
  totalMinutesLearned: number;
  conceptsCompleted: number;
  averageFocusScore: number;
  productiveHours: number;
  distractionHours: number;
  goalsAchieved: number;
  suggestions: string[];
  // TODO: Add adaptive learning path adjustments
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ==================== UTILITY TYPES ====================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
