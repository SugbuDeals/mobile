/**
 * Subscription domain selectors
 */

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/types";
import type { Subscription } from "./types";

// Base selectors
const selectSubscriptionsState = (state: RootState) => state.store.subscriptions;

// Memoized selectors
export const selectActiveSubscription = createSelector(
  [selectSubscriptionsState],
  (subscriptionsState) => subscriptionsState.activeSubscription
);

export const selectAllSubscriptions = createSelector(
  [selectSubscriptionsState],
  (subscriptionsState) => subscriptionsState.subscriptions
);

export const selectSubscriptionAnalytics = createSelector(
  [selectSubscriptionsState],
  (subscriptionsState) => subscriptionsState.subscriptionAnalytics
);

export const selectSubscriptionsLoading = createSelector(
  [selectSubscriptionsState],
  (subscriptionsState) => subscriptionsState.loading
);

export const selectSubscriptionsError = createSelector(
  [selectSubscriptionsState],
  (subscriptionsState) => subscriptionsState.error
);

export const selectSubscriptionById = (subscriptionId: number) =>
  createSelector([selectAllSubscriptions], (subscriptions) =>
    subscriptions.find((s) => s.id === subscriptionId)
  );

export const selectSubscriptionsByPlan = (plan: "FREE" | "BASIC" | "PREMIUM") =>
  createSelector([selectAllSubscriptions], (subscriptions) =>
    subscriptions.filter((s) => s.plan === plan)
  );

export const selectActiveSubscriptions = createSelector(
  [selectAllSubscriptions],
  (subscriptions) => subscriptions.filter((s) => s.isActive !== false)
);

