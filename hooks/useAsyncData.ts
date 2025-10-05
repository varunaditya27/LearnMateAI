'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SetStateAction } from 'react';

const asyncDataCache = new Map<string, unknown>();

export interface UseAsyncDataOptions<T> {
  enabled?: boolean;
  immediate?: boolean;
  initialData?: T | null;
  cacheKey?: string | false;
  watch?: ReadonlyArray<unknown>;
}

export interface UseAsyncDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  hasData: boolean;
  refetch: () => Promise<T | null>;
  setData: (value: SetStateAction<T | null>) => void;
  invalidate: () => void;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataResult<T> {
  const {
    enabled = true,
    immediate = true,
    initialData = null,
    cacheKey,
    watch = [],
  } = options;

  const cachedValue = useMemo(() => {
    if (!cacheKey) return undefined;
    return asyncDataCache.get(cacheKey) as T | undefined;
  }, [cacheKey]);

  const [data, setDataState] = useState<T | null>(cachedValue ?? initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate && enabled && !cachedValue);

  const isMounted = useRef(true);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (cachedValue !== undefined) {
      setDataState(cachedValue);
    }
  }, [cachedValue]);

  const run = useCallback(async () => {
    if (!enabled) return data;

    setLoading(true);
    setError(null);

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
      });

      const result = await Promise.race([
        fetcherRef.current(),
        timeoutPromise
      ]);

      if (!isMounted.current) {
        return null;
      }

      if (cacheKey) {
        asyncDataCache.set(cacheKey, result);
      }

      setDataState(result);
      setLoading(false);
      return result;
    } catch (err) {
      if (!isMounted.current) {
        return null;
      }

      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      console.error('[useAsyncData] Error:', message, err);
      setError(message);
      setLoading(false);
      return null;
    }
  }, [cacheKey, data, enabled]);

  const serializedWatch = useMemo(() => JSON.stringify(watch), [watch]);

  useEffect(() => {
    if (!enabled || !immediate) {
      return;
    }

    run();
  }, [enabled, immediate, run, serializedWatch]);

  const refetch = useCallback(async () => run(), [run]);

  const setData = useCallback(
    (value: SetStateAction<T | null>) => {
      setDataState((prev) => {
        const next = typeof value === 'function'
          ? (value as (arg: T | null) => T | null)(prev)
          : value;

        if (cacheKey) {
          if (next === null || next === undefined) {
            asyncDataCache.delete(cacheKey);
          } else {
            asyncDataCache.set(cacheKey, next);
          }
        }

        return next ?? null;
      });
    },
    [cacheKey]
  );

  const invalidate = useCallback(() => {
    if (cacheKey) {
      asyncDataCache.delete(cacheKey);
    }
  }, [cacheKey]);

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
