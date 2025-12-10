/**
 * Store domain thunks
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/store/types";
import { storesApi } from "@/services/api/endpoints/stores";
import type {
  Store,
  CreateStoreDTO,
  UpdateStoreDTO,
  ManageStoreStatusDTO,
} from "./types";

export const findStores = createAsyncThunk<
  Store[],
  void,
  { rejectValue: { message: string }; state: RootState }
>("stores/findStores", async (_, { rejectWithValue }) => {
  try {
    return await storesApi.findStores();
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Find stores failed",
    });
  }
});

export const findNearbyStores = createAsyncThunk<
  Store[],
  { latitude: number; longitude: number; radiusKm?: number },
  { rejectValue: { message: string }; state: RootState }
>("stores/findNearbyStores", async (params, { rejectWithValue }) => {
  try {
    return await storesApi.findNearbyStores(params);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Find nearby stores failed",
    });
  }
});

export const findStoreById = createAsyncThunk<
  Store | null,
  number,
  { rejectValue: { message: string }; state: RootState }
>("stores/findStoreById", async (storeId, { rejectWithValue }) => {
  try {
    const store = await storesApi.findStoreById(storeId);
    // If 404 or null, return null (not an error)
    if (store === null) {
      return null;
    }
    return store;
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Find store by ID failed",
    });
  }
});

export const findUserStore = createAsyncThunk<
  Store | null,
  number,
  { rejectValue: { message: string }; state: RootState }
>("stores/findUserStore", async (userId, { rejectWithValue, getState }) => {
  try {
    // Get all stores and filter by ownerId
    const stores = await storesApi.findStores();
    const userStore =
      stores.find(
        (store) =>
          store.ownerId === userId ||
          (store as any).owner_id === userId
      ) || null;
    return userStore;
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Find user store failed",
    });
  }
});

export const createStore = createAsyncThunk<
  Store,
  CreateStoreDTO,
  { rejectValue: { message: string }; state: RootState }
>("stores/createStore", async (storeData, { rejectWithValue }) => {
  try {
    const result = await storesApi.createStore(storeData);
    // Store type matches StoreResponseDto, so this is safe
    return result;
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Create store failed",
    });
  }
});

export const updateStore = createAsyncThunk<
  Store,
  { id: number } & UpdateStoreDTO,
  { rejectValue: { message: string }; state: RootState }
>("stores/updateStore", async ({ id, ...updateData }, { rejectWithValue }) => {
  try {
    return await storesApi.updateStore(id, updateData);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Update store failed",
    });
  }
});

export const updateStoreAdminStatus = createAsyncThunk<
  Store,
  { id: number } & ManageStoreStatusDTO,
  { rejectValue: { message: string }; state: RootState }
>(
  "stores/updateStoreAdminStatus",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      return await storesApi.updateStoreAdminStatus(id, payload);
    } catch (error) {
      return rejectWithValue({
        message:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Update store status failed",
      });
    }
  }
);

export const deleteStore = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("stores/deleteStore", async (storeId, { rejectWithValue }) => {
  try {
    return await storesApi.deleteStore(storeId);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Delete store failed",
    });
  }
});

