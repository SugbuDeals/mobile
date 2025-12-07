/**
 * Subscription domain thunks
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/store/types";
import { subscriptionsApi } from "@/services/api/endpoints/subscriptions";
import type {
  Subscription,
  SubscriptionAnalytics,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  JoinSubscriptionDTO,
} from "./types";

export const getActiveSubscription = createAsyncThunk<
  Subscription | null,
  number,
  { rejectValue: { message: string }; state: RootState }
>(
  "subscriptions/getActiveSubscription",
  async (userId, { rejectWithValue }) => {
    try {
      return await subscriptionsApi.getActiveSubscription(userId);
    } catch (error) {
      return rejectWithValue({
        message:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Get active subscription failed",
      });
    }
  }
);

export const joinSubscription = createAsyncThunk<
  Subscription,
  JoinSubscriptionDTO,
  { rejectValue: { message: string }; state: RootState }
>("subscriptions/joinSubscription", async (data, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.joinSubscription(data);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Join subscription failed",
    });
  }
});

export const findSubscriptions = createAsyncThunk<
  Subscription[],
  {
    plan?: "FREE" | "BASIC" | "PREMIUM";
    isActive?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  },
  { rejectValue: { message: string }; state: RootState }
>("subscriptions/findSubscriptions", async (filters, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.findSubscriptions(filters);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Find subscriptions failed",
    });
  }
});

export const cancelRetailerSubscription = createAsyncThunk<
  Subscription,
  void,
  { rejectValue: { message: string }; state: RootState }
>(
  "subscriptions/cancelRetailerSubscription",
  async (_, { rejectWithValue }) => {
    try {
      return await subscriptionsApi.cancelRetailerSubscription();
    } catch (error) {
      return rejectWithValue({
        message:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Cancel subscription failed",
      });
    }
  }
);

export const updateRetailerSubscription = createAsyncThunk<
  Subscription,
  JoinSubscriptionDTO,
  { rejectValue: { message: string }; state: RootState }
>(
  "subscriptions/updateRetailerSubscription",
  async (data, { rejectWithValue }) => {
    try {
      return await subscriptionsApi.updateRetailerSubscription(data);
    } catch (error) {
      return rejectWithValue({
        message:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Update subscription failed",
      });
    }
  }
);

export const createSubscription = createAsyncThunk<
  Subscription,
  CreateSubscriptionDTO,
  { rejectValue: { message: string }; state: RootState }
>("subscriptions/createSubscription", async (data, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.createSubscription(data);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Create subscription failed",
    });
  }
});

export const updateSubscription = createAsyncThunk<
  Subscription,
  { id: number } & UpdateSubscriptionDTO,
  { rejectValue: { message: string }; state: RootState }
>("subscriptions/updateSubscription", async ({ id, ...data }, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.updateSubscription(id, data);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Update subscription failed",
    });
  }
});

export const deleteSubscription = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("subscriptions/deleteSubscription", async (id, { rejectWithValue }) => {
  try {
    return await subscriptionsApi.deleteSubscription(id);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Delete subscription failed",
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
      return await subscriptionsApi.getSubscriptionAnalytics();
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

