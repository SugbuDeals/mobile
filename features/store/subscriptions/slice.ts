/**
 * Subscription domain slice
 * Updated for tier-based subscription system (BASIC/PRO)
 */

import { createSlice, Draft } from "@reduxjs/toolkit";
import {
  getCurrentTier,
  upgradeToPro,
  downgradeToBasic,
  getSubscriptionAnalytics,
} from "./thunks";
import { createAsyncReducer } from "@/utils/redux/createAsyncReducer";
import { logout } from "@/features/auth/slice";
import type { SubscriptionTier, SubscriptionAnalytics } from "./types";
import type { SubscriptionAnalyticsDto } from "@/services/api/types/swagger";

interface SubscriptionsState {
  currentTier: SubscriptionTier | null;
  subscriptionAnalytics: SubscriptionAnalytics | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionsState = {
  currentTier: null,
  subscriptionAnalytics: null,
  loading: false,
  error: null,
};

const subscriptionsSlice = createSlice({
  name: "subscriptions",
  initialState,
  reducers: {
    clearSubscriptions: (state) => {
      state.currentTier = null;
      state.subscriptionAnalytics = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get Current Tier
    createAsyncReducer<SubscriptionsState, SubscriptionTier, void>(builder, getCurrentTier, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        state.currentTier = action.payload;
      },
    });

    // Upgrade to PRO
    createAsyncReducer<SubscriptionsState, SubscriptionTier, void>(builder, upgradeToPro, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        state.currentTier = action.payload;
      },
    });

    // Downgrade to BASIC
    createAsyncReducer<SubscriptionsState, SubscriptionTier, void>(builder, downgradeToBasic, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        state.currentTier = action.payload;
      },
    });

    // Get Subscription Analytics
    createAsyncReducer<SubscriptionsState, SubscriptionAnalyticsDto, void>(builder, getSubscriptionAnalytics, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        state.subscriptionAnalytics = action.payload as SubscriptionAnalytics;
      },
    });

    // Clear subscriptions on logout
    builder.addCase(logout, (state) => {
      state.currentTier = null;
      state.subscriptionAnalytics = null;
      state.loading = false;
      state.error = null;
    });
  },
});

export const { clearSubscriptions } = subscriptionsSlice.actions;
export const subscriptionsReducer = subscriptionsSlice.reducer;

