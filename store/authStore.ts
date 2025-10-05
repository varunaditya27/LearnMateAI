/**
 * Authentication Store
 * 
 * Global state management for user authentication using Zustand.
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
  
  setUser: (user) => {
    console.log('[AuthStore] setUser called with:', user ? `User: ${user.displayName} (${user.id})` : 'null');
    set({ 
      user, 
      isAuthenticated: !!user,
      isLoading: false 
    });
  },
  
  initialize: () => {
    console.log('[AuthStore] Initializing auth subscription...');
    
    // Set a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      set((state) => {
        if (state.isLoading) {
          console.warn('[AuthStore] Safety timeout triggered - setting loading to false');
          return { isLoading: false };
        }
        return state;
      });
    }, 3000);

    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges((user) => {
      console.log('[AuthStore] Auth state changed:', user ? `User: ${user.displayName} (${user.id})` : 'No user');
      clearTimeout(safetyTimeout);
      set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      });
    });
    
    // Return cleanup function
    return () => {
      console.log('[AuthStore] Cleaning up auth subscription');
      clearTimeout(safetyTimeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  },
}));