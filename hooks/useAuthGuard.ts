'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface UseAuthGuardOptions {
  redirectTo?: string;
  enabled?: boolean;
}

export const useAuthGuard = (
  options: UseAuthGuardOptions = {}
) => {
  const { redirectTo = '/login', enabled = true } = options;
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initialize = useAuthStore((state) => state.initialize);

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    // Initialize and store the cleanup function
    const unsubscribe = initialize();
    
    // Return cleanup to unsubscribe when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initialize]);

  useEffect(() => {
    if (!enabled) return;
    if (isLoading) return;

    if (!isAuthenticated) {
      const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`${redirectTo}${redirectParam}`);
    }
  }, [enabled, isAuthenticated, isLoading, pathname, redirectTo, router]);

  return { user, isAuthenticated, isLoading };
};
