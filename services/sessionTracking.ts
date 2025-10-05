/**
 * Session Tracking Service
 * 
 * Tracks all learning sessions with detailed metrics:
 * - Time spent per resource
 * - Focus time (tab visibility)
 * - Engagement patterns
 * - Completion rates
 * - Learning velocity
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface SessionData {
  userId: string;
  resourceId: string;
  conceptId?: string;
  pathId?: string;
  startTime: Date;
  endTime?: Date;
  totalDuration: number; // seconds
  activeDuration: number; // seconds actively engaged
  focusTime: number; // seconds with tab visible
  pauseCount: number;
  playbackSpeed: number;
  progress: number; // 0-100
  completed: boolean;
  notes: Array<{
    timestamp: number;
    text: string;
  }>;
  engagementScore: number; // 0-100
  distractions: number; // tab switches
}

export interface SessionSummary {
  totalSessions: number;
  totalLearningTime: number;
  averageFocusTime: number;
  averageEngagement: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
}

class SessionTrackingService {
  private activeSession: string | null = null;
  private sessionStartTime: Date | null = null;
  private focusStartTime: Date | null = null;
  private totalFocusTime = 0;
  private pauseCount = 0;
  private distractions = 0;
  private isTabVisible = true;

  /**
   * Start a new learning session
   */
  async startSession(params: {
    userId: string;
    resourceId: string;
    conceptId?: string;
    pathId?: string;
  }): Promise<string> {
    try {
      const sessionRef = await addDoc(collection(db, 'learningSessions'), {
        userId: params.userId,
        resourceId: params.resourceId,
        conceptId: params.conceptId,
        pathId: params.pathId,
        startTime: serverTimestamp(),
        totalDuration: 0,
        activeDuration: 0,
        focusTime: 0,
        pauseCount: 0,
        playbackSpeed: 1,
        progress: 0,
        completed: false,
        notes: [],
        engagementScore: 0,
        distractions: 0,
        status: 'active',
      });

      this.activeSession = sessionRef.id;
      this.sessionStartTime = new Date();
      this.focusStartTime = new Date();
      this.totalFocusTime = 0;
      this.pauseCount = 0;
      this.distractions = 0;

      // Set up tab visibility tracking
      this.setupVisibilityTracking();

      return sessionRef.id;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  /**
   * Update session progress
   */
  async updateSessionProgress(params: {
    progress: number;
    playbackSpeed?: number;
    notes?: Array<{ timestamp: number; text: string }>;
  }): Promise<void> {
    if (!this.activeSession) return;

    try {
      const sessionRef = doc(db, 'learningSessions', this.activeSession);
      const updateData: Record<string, unknown> = {
        progress: params.progress,
        updatedAt: serverTimestamp(),
      };

      if (params.playbackSpeed !== undefined) {
        updateData.playbackSpeed = params.playbackSpeed;
      }

      if (params.notes) {
        updateData.notes = params.notes;
      }

      // Calculate duration
      if (this.sessionStartTime) {
        const duration = Math.floor((new Date().getTime() - this.sessionStartTime.getTime()) / 1000);
        updateData.totalDuration = duration;
        updateData.focusTime = this.totalFocusTime;
        updateData.distractions = this.distractions;
        
        // Calculate engagement score
        const engagementScore = Math.round((this.totalFocusTime / duration) * 100);
        updateData.engagementScore = Math.min(100, engagementScore);
      }

      await updateDoc(sessionRef, updateData);
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  /**
   * End the current session
   */
  async endSession(params: {
    completed: boolean;
    finalProgress: number;
  }): Promise<void> {
    if (!this.activeSession) return;

    try {
      const sessionRef = doc(db, 'learningSessions', this.activeSession);
      
      const duration = this.sessionStartTime 
        ? Math.floor((new Date().getTime() - this.sessionStartTime.getTime()) / 1000)
        : 0;

      const engagementScore = duration > 0 
        ? Math.round((this.totalFocusTime / duration) * 100)
        : 0;

      await updateDoc(sessionRef, {
        endTime: serverTimestamp(),
        totalDuration: duration,
        focusTime: this.totalFocusTime,
        pauseCount: this.pauseCount,
        progress: params.finalProgress,
        completed: params.completed,
        engagementScore: Math.min(100, engagementScore),
        distractions: this.distractions,
        status: 'completed',
        updatedAt: serverTimestamp(),
      });

      // Clean up
      this.activeSession = null;
      this.sessionStartTime = null;
      this.focusStartTime = null;
      this.totalFocusTime = 0;
      this.pauseCount = 0;
      this.distractions = 0;

      this.cleanupVisibilityTracking();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Record a pause event
   */
  recordPause(): void {
    this.pauseCount++;
    if (this.activeSession) {
      const sessionRef = doc(db, 'learningSessions', this.activeSession);
      updateDoc(sessionRef, {
        pauseCount: this.pauseCount,
      }).catch(console.error);
    }
  }

  /**
   * Setup tab visibility tracking
   */
  private setupVisibilityTracking(): void {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Cleanup visibility tracking
   */
  private cleanupVisibilityTracking(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Handle tab visibility changes
   */
  private handleVisibilityChange(): void {
    const isVisible = !document.hidden;

    if (isVisible && !this.isTabVisible) {
      // Tab became visible
      this.focusStartTime = new Date();
      this.distractions++;
    } else if (!isVisible && this.isTabVisible && this.focusStartTime) {
      // Tab became hidden
      const focusDuration = Math.floor((new Date().getTime() - this.focusStartTime.getTime()) / 1000);
      this.totalFocusTime += focusDuration;
    }

    this.isTabVisible = isVisible;
  }

  /**
   * Get user session summary
   */
  async getSessionSummary(userId: string, days: number = 7): Promise<SessionSummary> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sessionsQuery = query(
        collection(db, 'learningSessions'),
        where('userId', '==', userId),
        where('startTime', '>=', startDate),
        orderBy('startTime', 'desc')
      );

      const snapshot = await getDocs(sessionsQuery);
      const sessions = snapshot.docs.map(doc => doc.data());

      const totalSessions = sessions.length;
      const totalLearningTime = sessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0);
      const totalFocusTime = sessions.reduce((sum, s) => sum + (s.focusTime || 0), 0);
      const totalEngagement = sessions.reduce((sum, s) => sum + (s.engagementScore || 0), 0);
      const completedSessions = sessions.filter(s => s.completed).length;

      const averageFocusTime = totalSessions > 0 ? totalFocusTime / totalSessions : 0;
      const averageEngagement = totalSessions > 0 ? totalEngagement / totalSessions : 0;
      const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      // Calculate streaks
      const { currentStreak, bestStreak } = await this.calculateStreaks(userId);

      return {
        totalSessions,
        totalLearningTime,
        averageFocusTime: Math.round(averageFocusTime),
        averageEngagement: Math.round(averageEngagement),
        completionRate: Math.round(completionRate),
        currentStreak,
        bestStreak,
      };
    } catch (error) {
      console.error('Failed to get session summary:', error);
      return {
        totalSessions: 0,
        totalLearningTime: 0,
        averageFocusTime: 0,
        averageEngagement: 0,
        completionRate: 0,
        currentStreak: 0,
        bestStreak: 0,
      };
    }
  }

  /**
   * Calculate learning streaks
   */
  private async calculateStreaks(userId: string): Promise<{ currentStreak: number; bestStreak: number }> {
    try {
      const sessionsQuery = query(
        collection(db, 'learningSessions'),
        where('userId', '==', userId),
        where('completed', '==', true),
        orderBy('startTime', 'desc'),
        limit(365) // Last year
      );

      const snapshot = await getDocs(sessionsQuery);
      const sessions = snapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.startTime;
        const date = timestamp && typeof timestamp.toDate === 'function' 
          ? new Date(timestamp.toDate()).toDateString()
          : new Date().toDateString();
        return { date };
      });

      // Get unique dates
      const uniqueDates = [...new Set(sessions.map(s => s.date))];
      uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      const checkDate = new Date();

      // Calculate current streak
      for (const date of uniqueDates) {
        const expectedDate = checkDate.toDateString();
        
        if (date === expectedDate) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate best streak
      for (let i = 0; i < uniqueDates.length; i++) {
        tempStreak = 1;
        let prevDate = new Date(uniqueDates[i]);

        for (let j = i + 1; j < uniqueDates.length; j++) {
          const currDate = new Date(uniqueDates[j]);
          const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

          if (dayDiff === 1) {
            tempStreak++;
            prevDate = currDate;
          } else {
            break;
          }
        }

        bestStreak = Math.max(bestStreak, tempStreak);
      }

      return { currentStreak, bestStreak };
    } catch (error) {
      console.error('Failed to calculate streaks:', error);
      return { currentStreak: 0, bestStreak: 0 };
    }
  }
}

// Export singleton instance
export const sessionTracker = new SessionTrackingService();
