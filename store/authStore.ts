/**
 * Authentication Store
 * 
 * Global state management for user authentication using Zustand.
 * Provides auth state and helper functions across the app.
 * 
 * TODO: Add loading states for better UX
 * TODO: Add error handling and retry logic
 */

import { create } from 'zustand';
import { User } from '@/types';
import { subscribeToAuthChanges } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false 
  }),
  
  initialize: () => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges((user) => {
      set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      });
    });
    
    // Return cleanup function
    return unsubscribe;
  },
}));
