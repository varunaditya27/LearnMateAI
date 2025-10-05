/**
 * TypeScript Types for New API Endpoints
 * 
 * Add these types to your types/index.ts file
 */

// ============================================
// COMMUNITY FEATURES
// ============================================

export interface StudyBuddyMatch {
  userId: string;
  displayName: string;
  topic: string;
  timezone: string;
  pace: 'slow' | 'medium' | 'fast';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  photoURL?: string | null;
  matchScore: number;
  matchReason: string;
}

export interface StudyBuddyMatchRequest {
  topic: string;
  timezone: string;
  pace: 'slow' | 'medium' | 'fast';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  userId?: string;
}

export interface GroupChallenge {
  id: string;
  name: string;
  description: string;
  topic: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  currentParticipants: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'completed' | 'upcoming';
  rewards: {
    points: number;
    badge: string;
  };
  createdBy: string;
  participants?: string[];
  createdAt?: string;
}

export interface CreateChallengeRequest {
  name: string;
  description: string;
  topic: string;
  durationDays: number;
  maxParticipants?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  startDate?: string;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  topic: string;
  author: {
    userId: string;
    displayName: string;
    photoURL?: string | null;
  };
  replies: number;
  likes: number;
  createdAt: string;
  tags: string[];
}

// ============================================
// MOTIVATION & HABITS
// ============================================

export interface MotivationBoost {
  id: string;
  userId: string;
  message: string;
  type: 'motivation' | 'reminder' | 'achievement';
  createdAt: string;
}

export interface HabitChallenge {
  id: string;
  name: string;
  description: string;
  type: 'daily_learning' | 'concept_completion' | 'streak_maintenance' | 'focus_time';
  targetValue: number;
  currentStreak: number;
  longestStreak: number;
  status: 'active' | 'completed' | 'paused';
  startDate: string;
  progress: HabitProgress[];
  rewards: {
    [key: string]: string;
  };
  createdAt?: string;
}

export interface HabitProgress {
  date: string;
  completed: boolean;
  value: number;
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  type: 'daily_learning' | 'concept_completion' | 'streak_maintenance' | 'focus_time';
  targetValue: number;
  duration?: number;
}

export interface UpdateHabitProgressRequest {
  habitId: string;
  date: string;
  value: number;
  completed?: boolean;
}

// ============================================
// CAREER ROADMAP
// ============================================

export interface CareerRoadmap {
  id: string;
  userId: string;
  careerGoal: string;
  overview: string;
  phases: RoadmapPhase[];
  requiredSkills: {
    technical: string[];
    soft: string[];
  };
  projectIdeas: string[];
  certifications: string[];
  nextSteps: string[];
  estimatedTimeToJob?: string;
  salaryRange?: string;
  jobOutlook?: string;
  createdAt: string;
  status: 'active' | 'completed';
  progress: number;
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  duration: string;
  description: string;
  skills: string[];
  milestones: string[];
  resources: string[];
  completed?: boolean;
}

export interface GenerateRoadmapRequest {
  careerGoal: string;
  currentSkills?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  timeframe?: string;
}

// ============================================
// QUIZ SYSTEM
// ============================================

export interface Quiz {
  quizId: string;
  userId: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: QuizQuestion[];
  totalPoints: number;
  passingScore: number;
  estimatedMinutes: number;
  attempts: number;
  bestScore: number | null;
  createdAt: string;
  status: 'active' | 'completed';
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | boolean;
  explanation: string;
  points: number;
}

export interface GenerateQuizRequest {
  topic: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  questionCount?: number;
  questionTypes?: ('multiple-choice' | 'true-false' | 'short-answer')[];
}

export interface QuizSubmission {
  submissionId: string;
  quizId: string;
  userId: string;
  results: QuizResult[];
  score: number;
  totalPoints: number;
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  submittedAt: string;
}

export interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string | boolean;
  correctAnswer: string | boolean;
  pointsEarned: number;
}

export interface SubmitQuizRequest {
  quizId: string;
  answers: {
    [questionId: string]: string | boolean;
  };
}

// ============================================
// RESOURCE RECOMMENDATIONS
// ============================================

export interface ResourceRecommendation {
  title: string;
  type: 'video' | 'article' | 'interactive' | 'course' | 'documentation';
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  platform: string;
  url: string;
  tags: string[];
  matchScore: number;
  matchReason: string;
}

export interface ResourceRecommendationResponse {
  topic: string;
  recommendations: ResourceRecommendation[];
  learningPath: string[];
  additionalTips: string[];
  userContext: {
    learningStyle: string;
    preferredFormats: string[];
  };
  generatedAt: string;
}

export interface ResourceFeedback {
  id: string;
  userId: string;
  resourceUrl: string;
  resourceTitle: string;
  action: 'liked' | 'completed' | 'saved' | 'dismissed';
  rating?: number;
  createdAt: string;
}

export interface SaveResourceFeedbackRequest {
  resourceUrl: string;
  resourceTitle: string;
  action: 'liked' | 'completed' | 'saved' | 'dismissed';
  rating?: number;
}

// ============================================
// LEARNING BRANCHES
// ============================================

export interface LearningBranch {
  id: string;
  pathId: string;
  name: string;
  type: 'project-based' | 'theory-heavy' | 'fast-track' | 'comprehensive';
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  steps: BranchStep[];
  projects?: string[];
  outcomes: string[];
  isActive: boolean;
  progress: number;
}

export interface BranchStep {
  stepNumber: number;
  title: string;
  description: string;
  type: 'project' | 'video' | 'reading' | 'exercise' | 'quiz';
  estimatedMinutes: number;
  resources?: string[];
}

export interface GenerateBranchRequest {
  pathId: string;
  currentStep: number;
  branchOption?: 'project-based' | 'theory-heavy' | 'fast-track' | 'comprehensive';
  userPreference?: string;
}

export interface ActivateBranchRequest {
  pathId: string;
  branchId: string;
}

export interface BranchesResponse {
  pathId: string;
  branches: LearningBranch[];
  recommendation: string;
  userId: string;
  createdAt: string;
  status: string;
}

// ============================================
// COMMON API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}
