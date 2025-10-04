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
