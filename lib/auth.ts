/**
 * Firebase Authentication Utilities
 * 
 * Helper functions for user authentication operations including:
 * - Email/Password authentication
 * - Google OAuth
 * - User session management
 * 
 * TODO: Add role-based access control functions
 * TODO: Add password reset functionality
 * TODO: Add email verification flow
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, FieldValue } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@/types';

const googleProvider = new GoogleAuthProvider();

/**
 * Register a new user with email and password
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update display name
    await updateProfile(firebaseUser, { displayName });

    // Create user document in Firestore
    const userData = {
      email: firebaseUser.email!,
      displayName,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      role: 'student',
      preferences: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dailyGoalMinutes: 60,
        reminderEnabled: true,
        notificationSettings: {
          email: true,
          push: true,
          dailySummary: true,
          weeklyReport: true,
          streakReminders: true,
        },
      },
      stats: {
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalMinutesLearned: 0,
        completedConcepts: 0,
        level: 1,
      },
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    return {
      id: firebaseUser.uid,
      ...userData,
    } as User;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to register';
    throw new Error(message);
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    return {
      id: firebaseUser.uid,
      ...userDoc.data(),
    } as User;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign in';
    throw new Error(message);
  }
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    // Check if user already exists
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (userDoc.exists()) {
      // User exists, return existing data
      return {
        id: firebaseUser.uid,
        ...userDoc.data(),
      } as User;
    } else {
      // New user, create document
      const userData = {
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: 'student',
        preferences: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dailyGoalMinutes: 60,
          reminderEnabled: true,
          notificationSettings: {
            email: true,
            push: true,
            dailySummary: true,
            weeklyReport: true,
            streakReminders: true,
          },
        },
        stats: {
          totalPoints: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalMinutesLearned: 0,
          completedConcepts: 0,
          level: 1,
        },
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      return {
        id: firebaseUser.uid,
        ...userData,
      } as User;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign in with Google';
    throw new Error(message);
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign out';
    throw new Error(message);
  }
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        unsubscribe();
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              resolve({
                id: firebaseUser.uid,
                ...userDoc.data(),
              } as User);
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          }
        } else {
          resolve(null);
        }
      },
      reject
    );
  });
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          callback({
            id: firebaseUser.uid,
            ...userDoc.data(),
          } as User);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};
