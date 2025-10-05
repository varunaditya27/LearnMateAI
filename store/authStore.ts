/**
 * Authentication Store
 * 
 * Global state management for user authentication using Zustand.
 * Provides auth state and helper functions across the app.
 */

import { create } from 'zustand';
import { User } from '@/types';
import { subscribeToAuthChanges } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  initialize: () => (() => void) | undefined;
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
    // Set a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      set((state) => {
        // Only update if still loading
        if (state.isLoading) {
          console.warn('[AuthStore] Auth initialization timeout - setting loading to false');
          return { isLoading: false };
        }
        return state;
      });
    }, 3000); // 3 second timeout

    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges((user) => {
      clearTimeout(safetyTimeout);
      set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      });
    });
    
    // Return cleanup function
    return () => {
      clearTimeout(safetyTimeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  },
}));
