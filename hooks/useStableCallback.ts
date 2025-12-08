/**
 * Hook to create stable callback references for Redux actions
 * Prevents unnecessary re-renders by memoizing action dispatchers
 */

import { useCallback, useRef } from "react";
import type { Dispatch } from "@reduxjs/toolkit";

/**
 * Creates a stable callback that dispatches a Redux action
 * The callback reference remains stable across renders
 * 
 * @param dispatch - Redux dispatch function
 * @param actionCreator - Action creator function or thunk
 * @returns Stable callback function
 * 
 * @example
 * const dispatch = useAppDispatch();
 * const handleFetch = useStableCallback(dispatch, fetchProducts);
 * // Use handleFetch in useEffect dependencies without causing re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  dispatch: Dispatch,
  actionCreator: T
): T {
  const actionRef = useRef(actionCreator);
  actionRef.current = actionCreator;

  return useCallback(
    ((...args: Parameters<T>) => {
      return dispatch(actionRef.current(...args) as any);
    }) as T,
    [dispatch]
  );
}

/**
 * Creates a stable callback for async thunks
 * Useful for Redux Toolkit async thunks that need stable references
 * 
 * @param thunk - Async thunk function
 * @returns Stable callback function
 * 
 * @example
 * const handleFetch = useStableThunk(fetchProducts);
 * useEffect(() => {
 *   handleFetch({ storeId: 1 });
 * }, [handleFetch]); // handleFetch is stable, won't cause re-renders
 */
export function useStableThunk<T extends (...args: any[]) => any>(
  thunk: T
): T {
  const thunkRef = useRef(thunk);
  thunkRef.current = thunk;

  return useCallback(
    ((...args: Parameters<T>) => {
      return thunkRef.current(...args);
    }) as T,
    []
  );
}

