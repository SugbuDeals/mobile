/**
 * Store domain slice
 */

import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import {
  findStores,
  findNearbyStores,
  findStoreById,
  findUserStore,
  createStore,
  updateStore,
  updateStoreAdminStatus,
  deleteStore,
} from "./thunks";
import { createAsyncReducer } from "@/utils/redux/createAsyncReducer";
import { logout } from "@/features/auth/slice";
import type { Store, CreateStoreDTO, UpdateStoreDTO } from "../types";
import type { StoreResponseDto } from "@/services/api/types/swagger";

interface StoresState {
  stores: Store[];
  selectedStore: Store | null;
  userStore: Store | null;
  nearbyStores: Store[];
  loading: boolean;
  error: string | null;
}

const initialState: StoresState = {
  stores: [],
  selectedStore: null,
  userStore: null,
  nearbyStores: [],
  loading: false,
  error: null,
};

const storesSlice = createSlice({
  name: "stores",
  initialState,
  reducers: {
    clearStores: (state) => {
      state.stores = [];
      state.selectedStore = null;
      state.userStore = null;
      state.nearbyStores = [];
      state.loading = false;
      state.error = null;
    },
    setUserStore: (state, action: PayloadAction<Store | null>) => {
      state.userStore = action.payload;
      if (action.payload) {
        state.selectedStore = action.payload;
      }
    },
    setSelectedStore: (state, action: PayloadAction<Store | null>) => {
      state.selectedStore = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Find Stores
    createAsyncReducer<StoresState, Store[], void>(builder, findStores, {
      onFulfilled: (state: Draft<StoresState>, action) => {
        state.stores = action.payload;
      },
    });

    // Find Nearby Stores
    createAsyncReducer<StoresState, Store[], { latitude: number; longitude: number; radiusKm?: number }>(builder, findNearbyStores, {
      onFulfilled: (state: Draft<StoresState>, action) => {
        // Only expose VERIFIED & active stores to consumers
        state.nearbyStores = (action.payload || []).filter(
          (store: Store) =>
            store.verificationStatus === "VERIFIED" && store.isActive !== false
        );
      },
    });

    // Find Store By ID
    createAsyncReducer<StoresState, Store | null, number>(builder, findStoreById, {
      onFulfilled: (state: Draft<StoresState>, action) => {
        if (action.payload === null) {
          state.selectedStore = null;
          state.userStore = null;
          return;
        }
        const store = action.payload; // Store is guaranteed non-null here
        state.selectedStore = store;
        state.userStore = store;
        // Add to stores list if not already present
        const existingIndex = state.stores.findIndex(
          (s: Store) => s.id === store.id
        );
        if (existingIndex === -1) {
          state.stores.push(store);
        } else {
          state.stores[existingIndex] = store;
        }
      },
    });

    // Find User Store
    createAsyncReducer<StoresState, Store | null, number>(builder, findUserStore, {
      onFulfilled: (state: Draft<StoresState>, action) => {
        state.userStore = action.payload;
        if (action.payload) {
          state.selectedStore = action.payload;
          // Add to stores list if not already present
          const existingIndex = state.stores.findIndex(
            (s: Store) => s.id === action.payload!.id
          );
          if (existingIndex === -1) {
            state.stores.push(action.payload);
          } else {
            state.stores[existingIndex] = action.payload;
          }
        }
      },
    });

    // Create Store
    // Note: createStore returns StoreResponseDto which is compatible with Store
    createAsyncReducer<StoresState, StoreResponseDto, CreateStoreDTO>(builder, createStore as any, {
      onFulfilled: (state: Draft<StoresState>, action) => {
        state.userStore = action.payload as Store;
        state.selectedStore = action.payload;
        // Add to stores list if not already present
        const existingIndex = state.stores.findIndex(
          (s: Store) => s.id === action.payload.id
        );
        if (existingIndex === -1) {
          state.stores.push(action.payload);
        } else {
          state.stores[existingIndex] = action.payload;
        }
      },
    });

    // Update Store
    createAsyncReducer<StoresState, Store, { id: number } & UpdateStoreDTO>(builder, updateStore, {
      onFulfilled: (state: Draft<StoresState>, action) => {
        state.userStore = action.payload;
        state.selectedStore = action.payload;
        // Update in stores list
        const storeIndex = state.stores.findIndex(
          (s: Store) => s.id === action.payload.id
        );
        if (storeIndex !== -1) {
          state.stores[storeIndex] = action.payload;
        }
      },
    });

    // Update Store Admin Status
    createAsyncReducer<StoresState, Store, { id: number } & any>(builder, updateStoreAdminStatus, {
      onFulfilled: (state: Draft<StoresState>, action) => {
        const storeIndex = state.stores.findIndex(
          (s: Store) => s.id === action.payload.id
        );
        if (storeIndex !== -1) {
          state.stores[storeIndex] = action.payload;
        }
        if (state.userStore && state.userStore.id === action.payload.id) {
          state.userStore = action.payload;
        }
        if (state.selectedStore && state.selectedStore.id === action.payload.id) {
          state.selectedStore = action.payload;
        }
      },
    });

    // Delete Store
    createAsyncReducer<StoresState, { id: number }, number>(builder, deleteStore, {
      onFulfilled: (state: Draft<StoresState>, action) => {
        const deletedId = action.payload.id;
        state.stores = state.stores.filter((store: Store) => store.id !== deletedId);
        if (state.userStore && state.userStore.id === deletedId) {
          state.userStore = null;
        }
        if (state.selectedStore && state.selectedStore.id === deletedId) {
          state.selectedStore = null;
        }
      },
    });

    // Clear stores on logout
    builder.addCase(logout, (state) => {
      state.stores = [];
      state.selectedStore = null;
      state.userStore = null;
      state.nearbyStores = [];
      state.loading = false;
      state.error = null;
    });
  },
});

export const { clearStores, setUserStore, setSelectedStore } =
  storesSlice.actions;
export const storesReducer = storesSlice.reducer;

