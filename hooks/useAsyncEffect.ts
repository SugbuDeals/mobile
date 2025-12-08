/**
 * Safe async effect wrapper with cleanup
 * Prevents state updates on unmounted components and handles async operations safely
 */

import { useEffect, useRef } from "react";

/**
 * Options for useAsyncEffect
 */
export interface UseAsyncEffectOptions {
  /**
   * Whether to skip the effect on initial mount
   */
  skipOnMount?: boolean;
  /**
   * Custom cleanup function
   */
  cleanup?: () => void | (() => void);
}

/**
 * Safe async effect hook
 * Automatically handles cleanup and prevents state updates on unmounted components
 * 
 * @param effect - Async effect function
 * @param deps - Dependency array (same as useEffect)
 * @param options - Additional options
 * 
 * @example
 * useAsyncEffect(async () => {
 *   const data = await fetchData();
 *   setData(data);
 * }, [userId]);
 * 
 * @example with cleanup
 * useAsyncEffect(async () => {
 *   const subscription = subscribe();
 *   return () => subscription.unsubscribe();
 * }, [userId]);
 */
export function useAsyncEffect(
  effect: () => Promise<void | (() => void)>,
  deps?: React.DependencyList,
  options?: UseAsyncEffectOptions
): void {
  const isMountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    // Skip on mount if requested
    if (options?.skipOnMount && !hasRunRef.current) {
      hasRunRef.current = true;
      return;
    }

    // Run the async effect
    const runEffect = async () => {
      try {
        const cleanup = await effect();
        if (isMountedRef.current) {
          if (typeof cleanup === "function") {
            cleanupRef.current = cleanup;
          }
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error("Error in async effect:", error);
        }
      }
    };

    runEffect();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (options?.cleanup) {
        const customCleanup = options.cleanup();
        if (typeof customCleanup === "function") {
          customCleanup();
        }
      }
    };
  }, deps);
}

/**
 * Async effect with automatic cancellation
 * Cancels the previous effect when dependencies change
 * 
 * @param effect - Async effect function that returns an abort signal or cleanup
 * @param deps - Dependency array
 * 
 * @example
 * useAsyncEffectWithCancel(async (signal) => {
 *   const data = await fetchData({ signal });
 *   if (!signal.aborted) {
 *     setData(data);
 *   }
 * }, [userId]);
 */
export function useAsyncEffectWithCancel(
  effect: (signal: AbortSignal) => Promise<void>,
  deps?: React.DependencyList
): void {
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    effect(signal).catch((error) => {
      if (!signal.aborted) {
        console.error("Error in async effect:", error);
      }
    });

    return () => {
      abortController.abort();
    };
  }, deps);
}

