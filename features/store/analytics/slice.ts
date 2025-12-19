/**
 * Retailer Analytics Slice
 */

import { createAsyncReducer } from "@/utils/redux/createAsyncReducer";
import { createSlice, Draft } from "@reduxjs/toolkit";
import { getRetailerAnalytics } from "./thunks";
import type { RetailerAnalytics, RetailerAnalyticsParams } from "./types";

interface AnalyticsState {
  analytics: RetailerAnalytics | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  analytics: null,
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalytics: (state: Draft<AnalyticsState>) => {
      state.analytics = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    createAsyncReducer<AnalyticsState, RetailerAnalytics, RetailerAnalyticsParams>(
      builder,
      getRetailerAnalytics,
      {
        onFulfilled: (state: Draft<AnalyticsState>, action) => {
          state.analytics = action.payload;
        },
      }
    );
  },
});

export const { clearAnalytics } = analyticsSlice.actions;
export const analyticsReducer = analyticsSlice.reducer;
