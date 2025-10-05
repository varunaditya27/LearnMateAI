'use client';

import { useEffect, useRef, useState } from 'react';

const asyncDataCache = new Map<string, unknown>();

export interface UseAsyncDataOptions {
  enabled?: boolean;
  immediate?: boolean;
  cacheKey?: string;
  watch?: unknown[];
}

export interface UseAsyncDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  hasData: boolean;
  refetch: () => Promise<void>;
  setData: (value: T | null) => void;
  invalidate: () => void;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions = {}
): UseAsyncDataResult<T> {
  const {
    enabled = true,
    immediate = true,
    cacheKey,
    watch = [],
  } = options;

  // Initialize with cached data if available
  const [data, setData] = useState<T | null>(() => {
    if (cacheKey && asyncDataCache.has(cacheKey)) {
      return asyncDataCache.get(cacheKey) as T;
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const fetchCountRef = useRef(0);

  // Track mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Main fetch effect - triggers when dependencies change
  useEffect(() => {
    if (!enabled || !immediate) {
      return;
    }

    const currentFetchId = ++fetchCountRef.current;

    const runFetch = async () => {
      console.log('[useAsyncData] Starting fetch, ID:', currentFetchId);
      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        
        console.log('[useAsyncData] Fetch completed, ID:', currentFetchId, 'Result:', result);

        // Only update if this is still the latest fetch and component is mounted
        if (currentFetchId === fetchCountRef.current && isMountedRef.current) {
          if (cacheKey) {
            asyncDataCache.set(cacheKey, result);
          }

          console.log('[useAsyncData] Updating state with result');
          setData(result);
          setLoading(false);
        } else {
          console.log('[useAsyncData] Ignoring stale fetch, current ID:', fetchCountRef.current);
        }
      } catch (err) {
        console.error('[useAsyncData] Fetch error:', err);
        
        if (currentFetchId === fetchCountRef.current && isMountedRef.current) {
          const message = err instanceof Error ? err.message : 'Failed to fetch data';
          setError(message);
          setLoading(false);
        }
      }
    };

    runFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, immediate, cacheKey, ...watch]);

  const refetch = async () => {
    if (!enabled) return;

    const currentFetchId = ++fetchCountRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      
      if (currentFetchId === fetchCountRef.current && isMountedRef.current) {
        if (cacheKey) {
          asyncDataCache.set(cacheKey, result);
        }
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (currentFetchId === fetchCountRef.current && isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(message);
        setLoading(false);
      }
    }
  };

  const invalidate = () => {
    if (cacheKey) {
      asyncDataCache.delete(cacheKey);
    }
  };

  return {
    data,
    loading,
    error,
    hasData: data !== null,
    refetch,
    setData,
    invalidate,
  };
}
