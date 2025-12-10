/**
 * Store domain selectors
 */

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/types";
import type { Store } from "./types";

// Base selectors
const selectStoresState = (state: RootState) => state.store.stores;

// Memoized selectors
export const selectAllStores = createSelector(
  [selectStoresState],
  (storesState) => storesState.stores
);

export const selectSelectedStore = createSelector(
  [selectStoresState],
  (storesState) => storesState.selectedStore
);

export const selectUserStore = createSelector(
  [selectStoresState],
  (storesState) => storesState.userStore
);

export const selectNearbyStores = createSelector(
  [selectStoresState],
  (storesState) => storesState.nearbyStores
);

export const selectStoresLoading = createSelector(
  [selectStoresState],
  (storesState) => storesState.loading
);

export const selectStoresError = createSelector(
  [selectStoresState],
  (storesState) => storesState.error
);

export const selectStoreById = (storeId: number) =>
  createSelector([selectAllStores], (stores) =>
    stores.find((store) => store.id === storeId)
  );

export const selectVerifiedStores = createSelector(
  [selectAllStores],
  (stores) => stores.filter((store) => store.verificationStatus === "VERIFIED")
);

export const selectActiveStores = createSelector(
  [selectAllStores],
  (stores) => stores.filter((store) => store.isActive !== false)
);

export const selectActiveSubscription = createSelector(
  [selectStoresState],
  (storesState) => storesState.activeSubscription
);

export const selectSubscriptions = createSelector(
  [selectStoresState],
  (storesState) => storesState.subscriptions
);

