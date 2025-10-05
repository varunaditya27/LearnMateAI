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
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const unsubscribe = initialize();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initialize]);

  useEffect(() => {
    if (!enabled) return;
    if (isLoading) return;
    if (hasRedirectedRef.current) return;

    // Only redirect if we're certain the user is not authenticated
    // and auth has finished loading
    if (!isAuthenticated && !isLoading) {
      hasRedirectedRef.current = true;
      const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`${redirectTo}${redirectParam}`);
    }
  }, [enabled, isAuthenticated, isLoading, pathname, redirectTo, router]);

  return { user, isAuthenticated, isLoading };
};