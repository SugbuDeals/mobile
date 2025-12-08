/**
 * Utility to create async reducer handlers with common patterns
 */

import { ActionReducerMapBuilder, AsyncThunk, Draft } from "@reduxjs/toolkit";

export interface AsyncReducerConfig<TState, TPayload, TArg = unknown> {
  onPending?: (state: Draft<TState>, action: { meta: { arg: TArg; requestId: string; requestStatus: "pending" } }) => void;
  onFulfilled?: (state: Draft<TState>, action: { payload: TPayload; meta: { arg: TArg; requestId: string; requestStatus: "fulfilled" } }) => void;
  onRejected?: (state: Draft<TState>, action: { payload?: { message: string }; meta: { arg: TArg; requestId: string; requestStatus: "rejected"; aborted: boolean; condition: boolean } }) => void;
  loadingKey?: keyof TState;
  errorKey?: keyof TState;
  dataKey?: keyof TState;
}

/**
 * Create async reducer handlers for a thunk
 */
export function createAsyncReducer<TState, TPayload, TArg = unknown>(
  builder: ActionReducerMapBuilder<TState>,
  thunk: AsyncThunk<TPayload, TArg, { rejectValue: { message: string }; [key: string]: unknown }>,
  config: AsyncReducerConfig<TState, TPayload, TArg> = {}
) {
  const {
    onPending,
    onFulfilled,
    onRejected,
    loadingKey = "loading" as keyof TState,
    errorKey = "error" as keyof TState,
    dataKey,
  } = config;

  builder
    .addCase(thunk.pending, (state, action) => {
      if (loadingKey) {
        const key = loadingKey as string;
        const loadingValue = (state as Record<string, unknown>)[key];
        if (typeof loadingValue === "boolean") {
          (state as Record<string, unknown>)[key] = true;
        }
      }
      if (errorKey) {
        const key = errorKey as string;
        const errorValue = (state as Record<string, unknown>)[key];
        if (errorValue === null || typeof errorValue === "string") {
          (state as Record<string, unknown>)[key] = null;
        }
      }
      onPending?.(state, action);
    })
    .addCase(thunk.fulfilled, (state, action) => {
      if (loadingKey) {
        const key = loadingKey as string;
        const loadingValue = (state as Record<string, unknown>)[key];
        if (typeof loadingValue === "boolean") {
          (state as Record<string, unknown>)[key] = false;
        }
      }
      if (errorKey) {
        const key = errorKey as string;
        const errorValue = (state as Record<string, unknown>)[key];
        if (errorValue === null || typeof errorValue === "string") {
          (state as Record<string, unknown>)[key] = null;
        }
      }
      if (dataKey) {
        const key = dataKey as string;
        if ((state as Record<string, unknown>)[key]) {
          (state as Record<string, unknown>)[key] = action.payload;
        }
      }
      onFulfilled?.(state, action);
    })
    .addCase(thunk.rejected, (state, action) => {
      if (loadingKey) {
        const key = loadingKey as string;
        const loadingValue = (state as Record<string, unknown>)[key];
        if (typeof loadingValue === "boolean") {
          (state as Record<string, unknown>)[key] = false;
        }
      }
      if (errorKey) {
        const key = errorKey as string;
        const errorValue = (state as Record<string, unknown>)[key];
        if (errorValue === null || typeof errorValue === "string") {
          (state as Record<string, unknown>)[key] = action.payload?.message || "An error occurred";
        }
      }
      onRejected?.(state, action);
    });
}

