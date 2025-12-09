/**
 * Subscription domain thunks
 * Updated for tier-based subscription system (BASIC/PRO)
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/store/types";
import { subscriptionsApi } from "@/services/api/endpoints/subscriptions";
import type {
  SubscriptionTier,
  SubscriptionAnalytics,
} from "./types";

export const getCurrentTier = createAsyncThunk<
  SubscriptionTier,
  void,
  { rejectValue: { message: string }; state: RootState }
>(
  "subscriptions/getCurrentTier",
  async (_, { rejectWithValue }) => {
    try {
      return await subscriptionsApi.getCurrentTier();
    } catch (error) {
      return rejectWithValue({
        message:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Get current tier failed",
      });
    }
  }
);

export const upgradeToPro = createAsyncThunk<
  SubscriptionTier,
  void,
  { rejectValue: { message: string }; state: RootState }
>("subscriptions/upgradeToPro", async (_, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.upgradeToPro();
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Upgrade to PRO failed",
    });
  }
});

export const downgradeToBasic = createAsyncThunk<
  SubscriptionTier,
  void,
  { rejectValue: { message: string }; state: RootState }
>("subscriptions/downgradeToBasic", async (_, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.downgradeToBasic();
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Downgrade to BASIC failed",
    });
  }
});

export const getSubscriptionAnalytics = createAsyncThunk<
  SubscriptionAnalytics,
  void,
  { rejectValue: { message: string }; state: RootState }
>(
  "subscriptions/getSubscriptionAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      return await subscriptionsApi.getAnalytics();
    } catch (error) {
      return rejectWithValue({
        message:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Get subscription analytics failed",
      });
    }
  }
);

