<div align="center">

# 📚 LearnMate AI

### *Making Self-Learning Structured, Engaging, and Addictive*

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)](https://firebase.google.com/)
[![Google AI](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google)](https://ai.google.dev/)

</div>

---

## 🌟 Overview

**LearnMate AI** is a production-ready, AI-powered learning companion that transforms self-directed education into an engaging, personalized experience. Built with cutting-edge technologies, it combines intelligent content curation, real-time progress tracking, gamification mechanics, and community-driven learning to help users master any skill.

Unlike traditional learning platforms, LearnMate adapts to individual learning styles, tracks genuine engagement through behavioral analytics, and leverages advanced AI to generate personalized roadmaps, quizzes, and motivation strategies.

---

## ✨ Core Features

### 🎯 **AI-Powered Learning Paths**
- **Intelligent Path Generation**: Google Gemini AI creates customized, step-by-step learning journeys tailored to user goals
- **Multi-Format Content**: Curated resources including YouTube videos, articles, and interactive tutorials
- **Adaptive Branching**: Dynamic path adjustments based on user performance, preferences, and learning style
- **Sequential & Project-Based Modes**: Choose between structured theory-first or hands-on learning approaches

### 📊 **Advanced Progress Tracking**
- **Real-Time Session Monitoring**: Tracks watch time, focus duration, pause events, and tab switches
- **Engagement Analytics**: Calculates engagement scores using visibility detection and interaction patterns
- **Distraction Detection**: Monitors tab visibility to measure genuine focus vs. multitasking
- **Streak System**: Daily consistency tracking with current and best streak records
- **Completion Rewards**: Points awarded when users achieve 90%+ completion with strong engagement

### 🎮 **Gamification Engine**
- **Points & Leveling System**: Earn points for completing resources, maintaining streaks, and engaging deeply
- **Global Leaderboard**: Real-time rankings with all-time, weekly, and monthly views
- **Achievement System**: Unlock milestones and badges for consistent learning habits
- **Habit Challenges**: Join daily/weekly/monthly challenges to build lasting learning routines
- **Visual Progress Indicators**: Beautiful progress bars and completion statistics

### 🤝 **Community Learning Network**
- **Study Buddy Matching**: AI-powered matching based on learning topics, skill level, pace, and timezone
- **Connection Requests**: Send, accept, or reject study buddy invitations with real-time status updates
- **Group Challenges**: Collaborative learning missions with shared goals and progress tracking
- **Discussion Forums**: Topic-based threads for sharing insights, asking questions, and peer support
- **Social Learning**: Track community activity, reply to discussions, and learn together

### 🚀 **Career Planning Tools**
- **AI Career Roadmaps**: Generate comprehensive multi-phase career development plans
- **Skill Mapping**: Identify required skills, projects, and milestones for any career path
- **Timeline Visualization**: Phase-by-phase roadmap with estimated durations and checkpoints
- **Persistent Storage**: Save and revisit generated roadmaps with Firestore integration

### 📝 **Intelligent Quiz System**
- **Dynamic Quiz Generation**: AI creates contextual quizzes for any topic with adjustable difficulty
- **Instant Grading**: Automatic evaluation with detailed explanations for each answer
- **Performance Tracking**: Store quiz submissions with scores and timestamps
- **Learning Reinforcement**: Questions designed to test understanding, not just memorization

### 💪 **Motivation & Wellness**
- **Daily Motivation Boosts**: AI-generated personalized encouragement based on user context and goals
- **Screen Time Analytics**: Detailed logging and visualization of learning session durations
- **Focus Quality Metrics**: Distinguish between passive and active engagement
- **Smart Insights**: Data-driven suggestions for improving learning effectiveness

### 🎨 **Interactive YouTube Player**
- **Embedded Video Experience**: Full YouTube IFrame API integration with custom controls
- **Timestamp Notes**: Take clickable notes that jump to specific video moments
- **Playback Speed Control**: 0.5x to 2x speed options for personalized viewing
- **Progress Auto-Save**: Continuous progress persistence every 10 seconds
- **Focus Detection**: Page Visibility API integration to measure genuine attention

---

## 🛠️ Tech Stack

### **Core Framework**
- **[Next.js 15.5](https://nextjs.org/)** - React framework with App Router, Server Components, and API routes
- **[React 19](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript 5](https://www.typescriptlang.org/)** - Full type safety across frontend and backend

### **AI & Intelligence**
- **[Google Gemini AI](https://ai.google.dev/)** - Advanced generative AI for content creation, quiz generation, and personalization
- **Custom AI Service Layer** - Centralized prompt engineering and response parsing

### **Database & Authentication**
- **[Firebase Firestore](https://firebase.google.com/docs/firestore)** - Scalable NoSQL database with real-time capabilities
- **[Firebase Authentication](https://firebase.google.com/docs/auth)** - Secure user authentication with Google OAuth and email/password
- **[Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)** - Server-side token verification and database operations

### **State & UI**
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling with modern features
- **[Framer Motion](https://www.framer.com/motion/)** - Production-ready animation library

### **Development & Build**
- **[Turbopack](https://turbo.build/)** - Next-generation bundler (7x faster than Webpack)
- **[ESLint 9](https://eslint.org/)** - Code quality and consistency
- **TypeScript Strict Mode** - Maximum type safety with no implicit `any`

---

## 🏗️ Architecture Highlights

### **API Design**
- **28+ RESTful Endpoints** - Comprehensive API coverage for all features
- **Middleware Authentication** - Server-side JWT verification using Firebase Admin SDK
- **Error Handling** - Graceful degradation with meaningful fallback behaviors
- **Type-Safe Contracts** - Shared TypeScript interfaces between client and server

### **Database Structure**
- **19 Composite Indexes** - Optimized queries for leaderboards, progress tracking, and community features
- **Subcollection Pattern** - Organized data hierarchy (users → stats, progress → steps)
- **Real-Time Updates** - Firestore listeners for live leaderboard and activity feeds

### **Performance Optimizations**
- **Server-Side Rendering** - Fast initial page loads with Next.js SSR
- **Turbopack Dev Mode** - Instant hot module replacement during development
- **Optimistic UI Updates** - Immediate feedback before server confirmation
- **Data Caching** - Smart request deduplication and cache invalidation

---

## 🚀 Quick Start

### **Prerequisites**
```bash
Node.js 20+ and npm
Firebase project with Firestore and Authentication enabled
Google AI API key (Gemini)
```

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/varunaditya27/LearnMateAI.git
cd LearnMateAI
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Create .env.local file with:
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_GEMINI_API_KEY=your_gemini_api_key
```

4. **Set up Firebase Admin SDK**
```bash
# Place firebase_admin_sdk.json in project root
```

5. **Deploy Firestore indexes**
```bash
firebase deploy --only firestore:indexes
```

6. **Start development server**
```bash
npm run dev
```

7. **Open browser**
```
http://localhost:3000
```

### **Production Build**
```bash
npm run build
npm start
```

---

## ⚡ Why Next.js for LearnMate?

* **One Framework, Two Jobs**: Handles both frontend & backend via API routes.
* **Scalability**: Can easily integrate with external APIs (Gemini, Groq Cloud) and scale with demand.
* **Speed & SEO**: Server-side rendering ensures instant load times and discoverability.
* **Developer Productivity**: Built-in routing, hot reloading, and great TypeScript support.

---

## 🏆 Vision

LearnMate is not just a tool—it’s a **movement towards rethinking self-learning**. By combining AI-driven personalization, habit formation, gamification, and community support, we want to build the **Duolingo of All Learning**.

---

## 👨‍💻 Contributors

* **Varun Aditya**
* **Dia Arora**
* **Vishwaradhya S Aiholli**
* **Rohan Bharadwaj**
* Open to collaborators & contributors!

---

## 📜 License

MIT License – Free to use, modify, and share.

---

> ⚡ LearnMate: Turning self-learning into an addictive game powered by AI.
