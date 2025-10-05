# LearnMate AI - Backend API Documentation

Complete API reference for all backend routes. These routes are ready for frontend integration.

## Table of Contents

- [Authentication](#authentication)
- [User Management](#user-management)
- [Learning Paths](#learning-paths)
- [Progress Tracking](#progress-tracking)
- [Leaderboard](#leaderboard)
- [Screen Time](#screen-time)
- [Chatbot](#chatbot)
- [Dashboard](#dashboard)
- [Community Features](#community-features)
- [Motivation & Habits](#motivation--habits)
- [Career Roadmap](#career-roadmap)
- [Quiz Generation](#quiz-generation)
- [Resource Recommendations](#resource-recommendations)
- [Learning Branches](#learning-branches)

---

## Authentication

### Login
**POST** `/api/auth/login`

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "displayName": "John Doe",
      "photoURL": null,
      "role": "student"
    },
    "token": "firebase_id_token"
  }
}
```

---

### Register
**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "displayName": "John Doe",
      "role": "student"
    },
    "token": "firebase_id_token"
  }
}
```

---

### Logout
**POST** `/api/auth/logout`

Log out the current user.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Session
**GET** `/api/auth/session`

Get current authenticated user's session data.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "displayName": "John Doe",
      "photoURL": null,
      "role": "student",
      "stats": { ... },
      "preferences": { ... }
    }
  }
}
```

---

## User Management

### Get Profile
**GET** `/api/user/profile`

Get user profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "photoURL": null,
    "preferences": { ... },
    "stats": { ... }
  }
}
```

---

### Update Profile
**PUT** `/api/user/profile`

Update user profile.

**Request Body:**
```json
{
  "displayName": "Jane Doe",
  "photoURL": "https://example.com/photo.jpg",
  "preferences": {
    "dailyGoalMinutes": 90,
    "reminderEnabled": true
  }
}
```

---

### Get Stats
**GET** `/api/user/stats`

Get user statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPoints": 850,
    "currentStreak": 5,
    "longestStreak": 12,
    "totalMinutesLearned": 1200,
    "completedConcepts": 12,
    "level": 4
  }
}
```

---

### Update Stats
**PATCH** `/api/user/stats`

Update user statistics (atomic operations).

**Request Body:**
```json
{
  "pointsToAdd": 50,
  "minutesToAdd": 30,
  "conceptsToAdd": 1,
  "currentStreak": 6
}
```

---

### Get Preferences
**GET** `/api/user/preferences`

Get user preferences.

---

### Update Preferences
**PUT** `/api/user/preferences`

Update user preferences.

**Request Body:**
```json
{
  "timezone": "America/New_York",
  "dailyGoalMinutes": 90,
  "reminderEnabled": true,
  "learningStyle": "visual"
}
```

---

## Learning Paths

### Get Learning Paths
**GET** `/api/learning/paths`

Get all user's learning paths.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "path_id",
      "name": "React.js Learning Path",
      "description": "Master React",
      "status": "active",
      "progress": 45,
      "domainId": "web-dev",
      "subdomainId": "frontend",
      "topicId": "react"
    }
  ]
}
```

---

### Create Learning Path
**POST** `/api/learning/paths`

Create a new learning path.

**Request Body:**
```json
{
  "name": "React.js Learning Path",
  "description": "Master React",
  "domainId": "web-dev",
  "subdomainId": "frontend",
  "topicId": "react",
  "steps": []
}
```

---

### Get Learning Path by ID
**GET** `/api/learning/paths/[id]`

Get a specific learning path.

---

### Update Learning Path
**PUT** `/api/learning/paths/[id]`

Update a learning path.

**Request Body:**
```json
{
  "progress": 50,
  "status": "active",
  "steps": [...]
}
```

---

### Delete Learning Path
**DELETE** `/api/learning/paths/[id]`

Delete a learning path.

---

### Generate Learning Path
**POST** `/api/learning/generate`

Generate AI-powered learning path.

**Request Body:**
```json
{
  "domain": "web-dev",
  "subdomain": "frontend",
  "topic": "react"
}
```

---

## Progress Tracking

### Get Progress
**GET** `/api/learning/progress`

Get user's learning progress.

**Query Parameters:**
- `conceptId` (optional): Filter by concept
- `resourceId` (optional): Filter by resource

---

### Update Progress
**POST** `/api/learning/progress`

Create or update progress entry.

**Request Body:**
```json
{
  "conceptId": "react-basics",
  "resourceId": "res-123",
  "status": "completed",
  "timeSpentMinutes": 30,
  "notes": "Great tutorial!"
}
```

---

## Leaderboard

### Get Leaderboard
**GET** `/api/leaderboard`

Get leaderboard rankings.

**Query Parameters:**
- `timeframe`: 'weekly' | 'monthly' | 'all-time' (default: 'all-time')
- `limit`: Number of entries (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user_id",
      "displayName": "John Doe",
      "points": 2850,
      "streak": 15,
      "rank": 1,
      "level": 8
    }
  ],
  "meta": {
    "timeframe": "weekly",
    "total": 10
  }
}
```

---

### Get User Rank
**GET** `/api/leaderboard/rank/[userId]`

Get specific user's rank.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "rank": 4,
    "points": 850,
    "totalUsers": 100,
    "percentile": 96
  }
}
```

---

## Screen Time

### Get Screen Time Logs
**GET** `/api/screen-time/logs`

Get screen time logs.

**Query Parameters:**
- `date`: YYYY-MM-DD format (optional)
- `startDate`: Start date (optional)
- `endDate`: End date (optional)

---

### Log Screen Time
**POST** `/api/screen-time/logs`

Create a screen time log entry.

**Request Body:**
```json
{
  "appName": "Instagram",
  "appCategory": "social",
  "durationMinutes": 45,
  "date": "2025-10-04"
}
```

**Valid Categories:**
- `productive`
- `social`
- `entertainment`
- `educational`
- `other`

---

### Get Screen Time Analytics
**GET** `/api/screen-time/analytics`

Get aggregated analytics.

**Query Parameters:**
- `period`: 'day' | 'week' | 'month' (default: 'week')

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "totalMinutes": 2100,
    "totalHours": 35,
    "categoryBreakdown": {
      "productive": 800,
      "social": 600,
      "entertainment": 500,
      "educational": 200
    },
    "topApps": [
      { "appName": "YouTube", "minutes": 400 },
      { "appName": "Instagram", "minutes": 300 }
    ],
    "focusScore": 48,
    "productiveMinutes": 1000,
    "distractionMinutes": 1100
  }
}
```

---

## Chatbot

### Send Message
**POST** `/api/chat/message`

Send a message to the AI chatbot.

**Request Body:**
```json
{
  "message": "What is React?",
  "conversationHistory": [],
  "learningContext": "Learning React basics"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "React is a JavaScript library...",
    "timestamp": "2025-10-04T12:00:00Z"
  }
}
```

---

### Get Chat History
**GET** `/api/chat/history`

Get conversation history.

**Query Parameters:**
- `limit`: Number of messages (default: 50)

---

## Dashboard

### Get Dashboard Overview
**GET** `/api/dashboard/overview`

Get comprehensive dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "stats": { ... },
    "recentProgress": [...],
    "activePaths": [...],
    "todayActivity": {
      "screenTimeMinutes": 120,
      "dailyGoalMinutes": 60,
      "dailyGoalProgress": 100
    },
    "leaderboardRank": 4
  }
}
```

---

### Get Summary
**GET** `/api/dashboard/summary`

Get daily/weekly summary with insights.

**Query Parameters:**
- `period`: 'day' | 'week' (default: 'day')

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "completedConcepts": 5,
    "totalMinutesLearned": 300,
    "totalHoursLearned": 5,
    "productiveMinutes": 250,
    "distractionMinutes": 100,
    "focusScore": 71,
    "insights": [
      "🎯 Great job! You completed 5 concepts this week.",
      "🔥 Excellent focus! Your productivity score is 71%."
    ]
  }
}
```

---

## Community Features

### Match Study Buddy
**POST** `/api/community/study-buddy/match`

Find and match with study buddies based on learning preferences.

**Request Body:**
```json
{
  "topic": "python",
  "timezone": "Asia/Kolkata",
  "pace": "fast",
  "skillLevel": "beginner"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "userId": "user_123",
        "displayName": "Alice Johnson",
        "topic": "python",
        "skillLevel": "beginner",
        "photoURL": null,
        "matchScore": 95,
        "matchReason": "Perfect match for your learning goals and schedule",
        "studyPreferences": {
          "timezone": "Asia/Kolkata",
          "pace": "fast"
        }
      }
    ],
    "totalMatches": 1
  }
}
```

---

### Get Group Challenges
**GET** `/api/community/challenges`

Get list of available group learning challenges.

**Query Parameters:**
- `status`: 'active' | 'completed' | 'upcoming' (default: 'active')
- `topic`: Filter by topic (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "challenge_1",
      "name": "Python Basics in 5 Days",
      "description": "Master Python fundamentals together",
      "topic": "python",
      "durationDays": 5,
      "startDate": "2025-10-05",
      "endDate": "2025-10-10",
      "maxParticipants": 10,
      "currentParticipants": 7,
      "difficulty": "beginner",
      "status": "active",
      "rewards": {
        "points": 500,
        "badge": "Python Pioneer"
      },
      "createdBy": "user_456",
      "participants": [
        "user_123",
        "user_456"
      ],
      "createdAt": "2025-10-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "status": "active"
  }
}
```

---

### Create Group Challenge
**POST** `/api/community/challenges`

Create a new group learning challenge.

**Request Body:**
```json
{
  "name": "React Mastery Challenge",
  "description": "Build 3 projects in React",
  "topic": "react",
  "durationDays": 14,
  "maxParticipants": 15,
  "difficulty": "intermediate",
  "startDate": "2025-11-01"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "challenge_2",
    "name": "React Mastery Challenge",
    "status": "active",
    "createdAt": "2025-10-04T12:00:00Z"
  },
  "message": "Challenge created successfully"
}
```

---

### Join Challenge
**POST** `/api/community/challenges/join`

Join an existing group challenge.

**Request Body:**
```json
{
  "challengeId": "challenge_1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "challengeId": "challenge_1",
    "userId": "current_user_id",
    "joinedAt": "2025-10-04T12:00:00Z",
    "progress": 0,
    "status": "active"
  },
  "message": "Successfully joined challenge"
}
```

---

### Get Discussions
**GET** `/api/community/discussions`

Get community discussions and knowledge sharing threads.

**Query Parameters:**
- `topic`: Filter by topic (optional)
- `limit`: Number of discussions (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "disc_1",
      "title": "Best resources for learning React Hooks?",
      "content": "Looking for comprehensive tutorials...",
      "topic": "react",
      "author": {
        "userId": "user_123",
        "displayName": "Alice Johnson",
        "photoURL": null
      },
      "replies": 12,
      "likes": 23,
      "createdAt": "2025-10-03T10:00:00Z",
      "tags": ["react", "hooks", "resources"]
    }
  ],
  "meta": {
    "total": 1,
    "limit": 20
  }
}
```

---

### Create Discussion
**POST** `/api/community/discussions`

Create a new discussion thread.

**Request Body:**
```json
{
  "title": "Best way to learn async/await in JavaScript?",
  "content": "I'm struggling with understanding async/await...",
  "topic": "javascript",
  "tags": ["javascript", "async", "help"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "disc_2",
    "title": "Best way to learn async/await in JavaScript?",
    "createdAt": "2025-10-04T12:00:00Z",
    "replies": 0,
    "likes": 0
  },
  "message": "Discussion created successfully"
}
```

---

## Motivation & Habits

### Send Motivation Boost
**POST** `/api/motivation/boost`

Generate and send an AI-powered personalized motivation message.

**Request Body:**
```json
{
  "context": "struggling with React hooks"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "boost_123",
    "userId": "user_123",
    "message": "🔥 Amazing 5-day streak! You're building real momentum with React. Hooks can be tricky, but you're making great progress. Keep this energy going!",
    "type": "motivation",
    "createdAt": "2025-10-04T12:00:00Z"
  },
  "message": "Motivation boost sent successfully"
}
```

**Valid Types:** `motivation`, `reminder`, `achievement`

---

### Get Motivation Boosts
**GET** `/api/motivation/boost`

Get recent motivation boosts.

**Query Parameters:**
- `limit`: Number of boosts (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "boost_123",
      "userId": "user_123",
      "message": "🔥 Amazing 5-day streak! You're building real momentum with React. Hooks can be tricky, but you're making great progress. Keep this going!",
      "type": "achievement",
      "createdAt": "2025-10-04T12:00:00Z"
    },
    {
      "id": "boost_122",
      "userId": "user_123",
      "message": "⚡ Great consistency yesterday—another focused 30 minutes logged!",
      "type": "motivation",
      "createdAt": "2025-10-03T12:00:00Z"
    }
  ],
  "meta": {
    "limit": 10,
    "total": 2
  }
}
```

---

### Get Habit Challenges
**GET** `/api/habits/challenge`

Get user's habit-building challenges.

**Query Parameters:**
- `status`: 'active' | 'completed' | 'paused' (default: 'active')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "habit_1",
      "name": "Learn 30 minutes daily",
      "description": "Commit to learning for at least 30 minutes every day",
      "type": "daily_learning",
      "targetValue": 30,
      "currentStreak": 5,
      "longestStreak": 8,
      "status": "active",
      "startDate": "2025-09-30",
      "progress": [
        { "date": "2025-10-04", "completed": true, "value": 40 }
      ],
      "rewards": {
        "milestone5": "Early Bird Badge",
        "milestone10": "100 bonus points"
      },
      "createdAt": "2025-09-30T10:00:00Z"
    }
  ]
}
```

---

### Create Habit Challenge
**POST** `/api/habits/challenge`

Start a new personal habit challenge.

**Request Body:**
```json
{
  "name": "Complete 1 concept daily",
  "description": "Finish at least one learning concept every day",
  "type": "concept_completion",
  "targetValue": 1,
  "duration": 30
}
```

**Valid Types:**

- `daily_learning`: Daily learning time goal
- `concept_completion`: Daily concept completion
- `streak_maintenance`: Maintain learning streak
- `focus_time`: Focused learning without distractions

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "habit_2",
    "name": "Complete 1 concept daily",
    "status": "active",
    "currentStreak": 0,
    "createdAt": "2025-10-04T12:00:00Z"
  },
  "message": "Habit challenge created successfully"
}
```

---

### Update Habit Progress
**PATCH** `/api/habits/challenge`

Update progress for a habit challenge.

**Request Body:**
```json
{
  "habitId": "habit_1",
  "date": "2025-10-04",
  "value": 35,
  "completed": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "habitId": "habit_1",
    "date": "2025-10-04",
    "value": 35,
    "completed": true,
    "updatedStreak": 6,
    "longestStreak": 8,
    "progressPercentage": 80,
    "rewardsEarned": [
      {
        "type": "streak_milestone",
        "milestone": 5,
        "reward": "Early Bird Badge"
      }
    ]
  },
  "message": "Habit progress updated successfully"
}
```

---

## Career Roadmap

### Generate Career Roadmap
**POST** `/api/roadmap/generate`

Generate an AI-powered personalized career roadmap.

**Request Body:**
```json
{
  "careerGoal": "Full Stack Developer",
  "currentSkills": ["HTML", "CSS", "JavaScript"],
  "experienceLevel": "beginner",
  "timeframe": "6 months"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "roadmap_1",
    "userId": "user_123",
    "careerGoal": "Full Stack Developer",
    "overview": "Comprehensive path to becoming a full-stack developer",
    "phases": [
      {
        "phase": 1,
        "title": "Frontend Fundamentals",
        "duration": "2 months",
        "description": "Master frontend technologies",
        "skills": ["React", "TypeScript", "Tailwind CSS"],
        "milestones": ["Build 3 frontend projects", "Deploy to production"],
        "resources": ["Online courses", "Documentation", "Practice projects"],
        "completed": false
      },
      {
        "phase": 2,
        "title": "Backend Development",
        "duration": "2 months",
        "description": "Learn server-side development",
        "skills": ["Node.js", "Express", "PostgreSQL"],
        "milestones": ["Build REST API", "Database design"],
        "resources": ["Backend courses", "API documentation"],
        "completed": false
      }
    ],
    "requiredSkills": {
      "technical": ["React", "Node.js", "SQL", "Git"],
      "soft": ["Problem-solving", "Communication", "Teamwork"]
    },
    "projectIdeas": [
      "Full-stack e-commerce app",
      "Social media clone",
      "Task management system"
    ],
    "certifications": ["AWS Cloud Practitioner", "MongoDB Associate"],
    "nextSteps": [
      "Start with React tutorial",
      "Join developer communities",
      "Build portfolio website"
    ],
    "estimatedTimeToJob": "6-12 months",
    "salaryRange": "$60,000 - $100,000",
    "jobOutlook": "Excellent demand with 22% growth expected",
    "progress": 0,
    "status": "active",
    "createdAt": "2025-10-04T12:00:00Z"
  },
  "message": "Career roadmap generated successfully"
}
```

---

### Get Career Roadmaps
**GET** `/api/roadmap/generate`

Get user's career roadmaps.

**Query Parameters:**

- `status`: 'active' | 'completed' (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "roadmap_1",
      "careerGoal": "Full Stack Developer",
      "overview": "Comprehensive path to becoming a full-stack developer",
      "progress": 35,
      "status": "active",
      "createdAt": "2025-09-15T00:00:00Z"
    }
  ]
}
```

---

## Quiz Generation

### Generate Quiz
**POST** `/api/quiz/generate`

Generate an AI-powered quiz for a topic.

**Request Body:**
```json
{
  "topic": "React Hooks",
  "difficulty": "medium",
  "questionCount": 5,
  "questionTypes": ["multiple-choice", "true-false"]
}
```

**Valid Difficulties:** `beginner`, `intermediate`, `advanced`

**Valid Question Types:** `multiple-choice`, `true-false`, `short-answer`

**Response:**
```json
{
  "success": true,
  "data": {
    "quizId": "quiz_123",
    "userId": "user_123",
    "topic": "React Hooks",
    "difficulty": "medium",
    "questions": [
      {
        "id": "q1",
        "type": "multiple-choice",
        "question": "What is the purpose of useState hook in React?",
        "options": [
          "To manage side effects",
          "To manage component state",
          "To optimize performance",
          "To handle routing"
        ],
        "correctAnswer": "To manage component state",
        "explanation": "useState is used to add state management to functional components",
        "points": 10
      },
      {
        "id": "q2",
        "type": "true-false",
        "question": "useEffect runs after every render by default",
        "correctAnswer": true,
        "explanation": "Without dependencies, useEffect runs after every render",
        "points": 5
      }
    ],
    "totalPoints": 50,
    "passingScore": 70,
    "estimatedMinutes": 10,
    "attempts": 0,
    "bestScore": null,
    "createdAt": "2025-10-04T12:00:00Z",
    "status": "active"
  },
  "message": "Quiz generated successfully"
}
```

---

### Get Quizzes
**GET** `/api/quiz/generate`

Get user's quizzes.

**Query Parameters:**

- `topic`: Filter by topic (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "quizId": "quiz_1",
      "userId": "user_123",
      "topic": "React Hooks",
      "difficulty": "medium",
      "totalPoints": 50,
      "attempts": 2,
      "bestScore": 85,
      "createdAt": "2025-10-03T10:00:00Z",
      "status": "completed"
    }
  ]
}
```

---

### Submit Quiz
**POST** `/api/quiz/submit`

Submit quiz answers and get results.

**Request Body:**
```json
{
  "quizId": "quiz_123",
  "answers": {
    "q1": "To manage component state",
    "q2": true,
    "q3": "Option C"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "sub_456",
    "quizId": "quiz_123",
    "userId": "user_123",
    "results": [
      {
        "questionId": "q1",
        "isCorrect": true,
        "userAnswer": "To manage component state",
        "correctAnswer": "To manage component state",
        "pointsEarned": 10
      },
      {
        "questionId": "q2",
        "isCorrect": true,
        "userAnswer": true,
        "correctAnswer": true,
        "pointsEarned": 5
      }
    ],
    "score": 45,
    "totalPoints": 50,
    "scorePercentage": 90,
    "correctCount": 9,
    "totalQuestions": 10,
    "passed": true,
    "submittedAt": "2025-10-04T12:00:00Z"
  },
  "message": "Congratulations! You passed!"
}
```

---

## Resource Recommendations

### Get Recommendations
**GET** `/api/resources/recommend`

Get AI-powered personalized learning resource recommendations.

**Query Parameters:**
- `topic`: Topic to get recommendations for (required)
- `learningStyle`: 'visual' | 'auditory' | 'kinesthetic' | 'reading' (optional)
- `difficulty`: 'beginner' | 'intermediate' | 'advanced' (default: 'beginner')

**Valid Types:** `video`, `article`, `interactive`, `course`, `documentation`

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": "React",
    "recommendations": [
      {
        "title": "React Official Tutorial",
        "type": "interactive",
        "description": "Official interactive tutorial covering React fundamentals",
        "difficulty": "beginner",
        "estimatedMinutes": 120,
        "platform": "React.dev",
        "url": "https://react.dev/learn",
        "tags": ["react", "tutorial", "interactive"],
        "matchScore": 95,
        "matchReason": "Perfect for hands-on learners starting with React"
      },
      {
        "title": "React Crash Course",
        "type": "video",
        "description": "Comprehensive video covering React basics in 90 minutes",
        "difficulty": "beginner",
        "estimatedMinutes": 90,
        "platform": "YouTube",
        "url": "https://youtube.com/...",
        "tags": ["react", "video", "beginner"],
        "matchScore": 90,
        "matchReason": "Great for visual learners"
      }
    ],
    "learningPath": [
      "Start with official tutorial",
      "Watch video crash course",
      "Build a simple project",
      "Read documentation for deeper understanding"
    ],
    "additionalTips": [
      "Practice by building small projects",
      "Join React communities for support",
      "Review concepts regularly"
    ],
    "userContext": {
      "learningStyle": "visual",
      "preferredFormats": ["video", "interactive"]
    },
    "generatedAt": "2025-10-04T12:00:00Z"
  },
  "message": "Recommendations generated successfully"
}
```

---

### Save Resource Feedback
**POST** `/api/resources/recommend`

Save feedback on a recommended resource.

**Request Body:**
```json
{
  "resourceUrl": "https://react.dev/learn",
  "resourceTitle": "React Official Tutorial",
  "action": "completed",
  "rating": 5
}
```

**Valid Actions:** `liked`, `completed`, `saved`, `dismissed`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "feedback_123",
    "userId": "user_123",
    "resourceUrl": "https://react.dev/learn",
    "resourceTitle": "React Official Tutorial",
    "action": "completed",
    "rating": 5,
    "createdAt": "2025-10-04T12:00:00Z"
  },
  "message": "Feedback recorded successfully"
}
```

---

## Learning Branches

### Generate Learning Branches
**POST** `/api/learning/branch`

Generate alternate learning paths based on preferences.

**Request Body:**
```json
{
  "pathId": "path_123",
  "currentStep": 5,
  "branchOption": "project-based",
  "userPreference": "hands-on"
}
```

**Valid Branch Options:**
- `project-based`: More hands-on projects
- `theory-heavy`: Deeper conceptual understanding
- `fast-track`: Condensed, essential concepts only
- `comprehensive`: Detailed coverage with examples

**Valid Step Types:** `project`, `video`, `reading`, `exercise`, `quiz`

**Response:**
```json
{
  "success": true,
  "data": {
    "pathId": "path_123",
    "branches": [
      {
        "id": "branch_1",
        "pathId": "path_123",
        "name": "Project-Based Path",
        "type": "project-based",
        "description": "Learn by building real projects",
        "difficulty": "intermediate",
        "estimatedHours": 20,
        "steps": [
          {
            "stepNumber": 1,
            "title": "Build a To-Do App",
            "description": "Create your first React application with hooks",
            "type": "project",
            "estimatedMinutes": 120,
            "resources": ["Tutorial video", "Starter code"]
          }
        ],
        "projects": ["To-Do App", "Weather Dashboard", "Blog Platform"],
        "outcomes": ["Practical experience", "Portfolio projects", "Real-world skills"],
        "isActive": true,
        "progress": 0
      },
      {
        "id": "branch_2",
        "pathId": "path_123",
        "name": "Theory-First Path",
        "type": "theory-heavy",
        "description": "Deep dive into concepts before coding",
        "difficulty": "intermediate",
        "estimatedHours": 25,
        "steps": [
          {
            "stepNumber": 1,
            "title": "React Core Concepts",
            "description": "Understand the fundamentals deeply",
            "type": "reading",
            "estimatedMinutes": 60,
            "resources": ["Documentation", "Articles", "Video lectures"]
          }
        ],
        "projects": [],
        "outcomes": ["Strong foundation", "Conceptual clarity", "Interview readiness"],
        "isActive": false,
        "progress": 0
      }
    ],
    "recommendation": "Project-Based Path is recommended for hands-on learners",
    "userId": "user_123",
    "createdAt": "2025-10-04T12:00:00Z",
    "status": "success"
  },
  "message": "Learning branches generated successfully"
}
```

---

### Activate Learning Branch
**PUT** `/api/learning/branch`

Select and activate a specific learning branch.

**Request Body:**
```json
{
  "pathId": "path_123",
  "branchId": "branch_1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pathId": "path_123",
    "activeBranch": "branch_1",
    "branchStartedAt": "2025-10-04T12:00:00Z",
    "previousBranch": null
  },
  "message": "Learning branch activated successfully"
}
```

---

### Get Learning Branches
**GET** `/api/learning/branch`

Get available branches for a learning path.

**Query Parameters:**
- `pathId`: Learning path ID (required)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "branch_1",
      "pathId": "path_123",
      "name": "Project-Based Path",
      "type": "project-based",
      "description": "Learn by building",
      "difficulty": "intermediate",
      "estimatedHours": 20,
      "steps": [],
      "projects": ["Project 1"],
      "outcomes": ["Skill 1"],
      "isActive": true,
      "progress": 45
    },
    {
      "id": "branch_2",
      "pathId": "path_123",
      "name": "Theory-First Path",
      "type": "theory-heavy",
      "description": "Deep conceptual understanding",
      "difficulty": "intermediate",
      "estimatedHours": 25,
      "steps": [],
      "projects": [],
      "outcomes": ["Skill 2"],
      "isActive": false,
      "progress": 0
    }
  ],
  "meta": {
    "pathId": "path_123",
    "total": 2
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Status Codes:**
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (not authorized)
- `404`: Not Found
- `409`: Conflict (e.g., email already exists)
- `500`: Internal Server Error

---

## Authentication

Most endpoints require authentication. Include the Firebase ID token in your requests:

```javascript
const token = await user.getIdToken();

fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Rate Limiting

Currently, no rate limiting is implemented. This should be added in production.

---

## Notes

- All timestamps are in ISO 8601 format
- All dates are in YYYY-MM-DD format
- Points calculation: 100 points = 1 level
- Firebase Auth handles user authentication
- Firestore is used for all data storage
