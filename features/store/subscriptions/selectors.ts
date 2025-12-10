/**
 * Subscription domain selectors
 * Updated for tier-based subscription system (BASIC/PRO)
 */

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/types";

// Base selectors
const selectSubscriptionsState = (state: RootState) => state.store.subscriptions;

// Memoized selectors
export const selectCurrentTier = createSelector(
  [selectSubscriptionsState],
  (subscriptionsState) => subscriptionsState.currentTier
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

