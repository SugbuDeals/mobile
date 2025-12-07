/**
 * Subscription domain slice
 */

import { createSlice, Draft } from "@reduxjs/toolkit";
import {
  getActiveSubscription,
  joinSubscription,
  findSubscriptions,
  cancelRetailerSubscription,
  updateRetailerSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionAnalytics,
} from "./thunks";
import { createAsyncReducer } from "@/utils/redux/createAsyncReducer";
import type { Subscription, SubscriptionAnalytics, JoinSubscriptionDTO, CreateSubscriptionDTO, UpdateSubscriptionDTO } from "./types";

interface SubscriptionsState {
  activeSubscription: Subscription | null;
  subscriptions: Subscription[];
  subscriptionAnalytics: SubscriptionAnalytics | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionsState = {
  activeSubscription: null,
  subscriptions: [],
  subscriptionAnalytics: null,
  loading: false,
  error: null,
};

const subscriptionsSlice = createSlice({
  name: "subscriptions",
  initialState,
  reducers: {
    clearSubscriptions: (state) => {
      state.activeSubscription = null;
      state.subscriptions = [];
      state.subscriptionAnalytics = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get Active Subscription
    createAsyncReducer<SubscriptionsState, Subscription | null, number>(builder, getActiveSubscription, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        state.activeSubscription = action.payload;
      },
    });

    // Join Subscription
    createAsyncReducer<SubscriptionsState, Subscription, JoinSubscriptionDTO>(builder, joinSubscription, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        state.activeSubscription = action.payload;
      },
    });

    // Find Subscriptions
    createAsyncReducer<SubscriptionsState, Subscription[], any>(builder, findSubscriptions, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        state.subscriptions = action.payload;
      },
    });

    // Cancel Retailer Subscription
    createAsyncReducer<SubscriptionsState, Subscription, void>(builder, cancelRetailerSubscription, {
      onFulfilled: (state: Draft<SubscriptionsState>) => {
        state.activeSubscription = null;
      },
    });

    // Update Retailer Subscription
    createAsyncReducer<SubscriptionsState, Subscription, JoinSubscriptionDTO>(builder, updateRetailerSubscription, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        state.activeSubscription = action.payload;
      },
    });

    // Create Subscription (Admin)
    createAsyncReducer<SubscriptionsState, Subscription, CreateSubscriptionDTO>(builder, createSubscription, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        state.subscriptions.push(action.payload);
      },
    });

    // Update Subscription (Admin)
    createAsyncReducer<SubscriptionsState, Subscription, { id: number } & UpdateSubscriptionDTO>(builder, updateSubscription, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        const index = state.subscriptions.findIndex(
          (s: Subscription) => s.id === action.payload.id
        );
        if (index !== -1) {
          state.subscriptions[index] = action.payload;
        }
      },
    });

    // Delete Subscription (Admin)
    createAsyncReducer<SubscriptionsState, { id: number }, number>(builder, deleteSubscription, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        state.subscriptions = state.subscriptions.filter(
          (s: Subscription) => s.id !== action.payload.id
        );
      },
    });

    // Get Subscription Analytics
    createAsyncReducer<SubscriptionsState, SubscriptionAnalytics, void>(builder, getSubscriptionAnalytics, {
      onFulfilled: (state: Draft<SubscriptionsState>, action) => {
        state.subscriptionAnalytics = action.payload;
      },
    });
  },
});

export const { clearSubscriptions } = subscriptionsSlice.actions;
export const subscriptionsReducer = subscriptionsSlice.reducer;

