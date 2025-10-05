/**
 * Firebase Authentication Utilities (With Debug Logging)
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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@/types';

const googleProvider = new GoogleAuthProvider();

export const registerUser = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  try {
    console.log('[Auth] Starting registration for:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log('[Auth] Firebase user created:', firebaseUser.uid);

    await updateProfile(firebaseUser, { displayName: name });
    console.log('[Auth] Display name updated');

    const userData: any = {
      email: firebaseUser.email!,
      displayName: name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      role: 'student',
      preferences: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dailyGoalMinutes: 60,
        reminderEnabled: true,
        learningStyle: 'visual',
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

    if (firebaseUser.photoURL) {
      userData.photoURL = firebaseUser.photoURL;
    }

    console.log('[Auth] Creating Firestore document...');
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    console.log('[Auth] Firestore document created successfully');

    const returnUser = {
      id: firebaseUser.uid,
      ...userData,
    } as User;

    console.log('[Auth] Registration complete, returning user:', returnUser.id);
    return returnUser;
  } catch (error: any) {
    console.error('[Auth] Registration error:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already in use');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    }
    throw new Error(error.message || 'Failed to register');
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    console.log('[Auth] Starting login for:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log('[Auth] Firebase login successful:', firebaseUser.uid);

    console.log('[Auth] Fetching Firestore user document...');
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.error('[Auth] Firestore document not found for user:', firebaseUser.uid);
      throw new Error('User data not found');
    }

    console.log('[Auth] Firestore document found');
    const returnUser = {
      id: firebaseUser.uid,
      ...userDoc.data(),
    } as User;

    console.log('[Auth] Login complete, returning user:', returnUser.id);
    return returnUser;
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    }
    throw new Error(error.message || 'Failed to sign in');
  }
};

export const loginWithGoogle = async (): Promise<User> => {
  try {
    console.log('[Auth] Starting Google sign in...');
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    console.log('[Auth] Google sign in successful:', firebaseUser.uid);

    console.log('[Auth] Checking for existing Firestore document...');
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (userDoc.exists()) {
      console.log('[Auth] Existing user found');
      return {
        id: firebaseUser.uid,
        ...userDoc.data(),
      } as User;
    } else {
      console.log('[Auth] New user, creating Firestore document...');
      const userData: any = {
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'User',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: 'student',
        preferences: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dailyGoalMinutes: 60,
          reminderEnabled: true,
          learningStyle: 'visual',
          notificationSettings: {
            email: true,
            push: false,
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

      if (firebaseUser.photoURL) {
        userData.photoURL = firebaseUser.photoURL;
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('[Auth] Firestore document created successfully');

      return {
        id: firebaseUser.uid,
        ...userData,
      } as User;
    }
  } catch (error: any) {
    console.error('[Auth] Google sign in error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign in cancelled');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup blocked. Please allow popups for this site');
    }
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    console.log('[Auth] Logging out...');
    await firebaseSignOut(auth);
    console.log('[Auth] Logout successful');
  } catch (error: any) {
    console.error('[Auth] Logout error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const getCurrentUser = () => {
  const user = auth.currentUser;
  console.log('[Auth] getCurrentUser:', user ? user.uid : 'null');
  return user;
};

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
): (() => void) => {
  console.log('[Auth] Setting up auth state listener...');
  
  return onAuthStateChanged(auth, async (firebaseUser) => {
    console.log('[Auth] Auth state changed:', firebaseUser ? `User ${firebaseUser.uid}` : 'No user');
    
    if (firebaseUser) {
      try {
        console.log('[Auth] Fetching Firestore data for:', firebaseUser.uid);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          console.log('[Auth] Firestore data found, calling callback with user data');
          const userData = {
            id: firebaseUser.uid,
            ...userDoc.data(),
          } as User;
          callback(userData);
        } else {
          console.warn('[Auth] Firestore document not found for authenticated user:', firebaseUser.uid);
          callback(null);
        }
      } catch (error) {
        console.error('[Auth] Error fetching user data from Firestore:', error);
        callback(null);
      }
    } else {
      console.log('[Auth] No Firebase user, calling callback with null');
      callback(null);
    }
  });
};