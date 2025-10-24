import env from "@/config/env";
import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { BookmarkedProduct, BookmarkedStore, ListBookmarksPayload } from "./types";

export const listStoreBookmarks = createAsyncThunk<
  BookmarkedStore[],
  ListBookmarksPayload | undefined,
  { rejectValue: { message: string }; state: RootState }
>(
  "bookmarks/listStoreBookmarks",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { accessToken } = getState().auth;
      const response = await fetch(`${env.API_BASE_URL}/bookmarks/stores/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ take: 50, skip: 0, ...(payload || {}) }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return rejectWithValue({ message: error.message || "Failed to list store bookmarks" });
      }
      return response.json();
    } catch (error) {
      return rejectWithValue({ message: error instanceof Error ? error.message : "An unknown error occured" });
    }
  }
);

export const listProductBookmarks = createAsyncThunk<
  BookmarkedProduct[],
  ListBookmarksPayload | undefined,
  { rejectValue: { message: string }; state: RootState }
>(
  "bookmarks/listProductBookmarks",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { accessToken } = getState().auth;
      const response = await fetch(`${env.API_BASE_URL}/bookmarks/products/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ take: 50, skip: 0, ...(payload || {}) }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return rejectWithValue({ message: error.message || "Failed to list product bookmarks" });
      }
      return response.json();
    } catch (error) {
      return rejectWithValue({ message: error instanceof Error ? error.message : "An unknown error occured" });
    }
  }
);

export const bookmarkStore = createAsyncThunk<
  { storeId: number },
  { storeId: number },
  { rejectValue: { message: string }; state: RootState }
>("bookmarks/bookmarkStore", async ({ storeId }, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    const response = await fetch(`${env.API_BASE_URL}/bookmarks/stores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ storeId }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({ message: error.message || "Failed to bookmark store" });
    }
    return { storeId };
  } catch (error) {
    return rejectWithValue({ message: error instanceof Error ? error.message : "An unknown error occured" });
  }
});

export const unbookmarkStore = createAsyncThunk<
  { storeId: number },
  { storeId: number },
  { rejectValue: { message: string }; state: RootState }
>("bookmarks/unbookmarkStore", async ({ storeId }, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    const response = await fetch(`${env.API_BASE_URL}/bookmarks/stores`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ storeId }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({ message: error.message || "Failed to remove store bookmark" });
    }
    return { storeId };
  } catch (error) {
    return rejectWithValue({ message: error instanceof Error ? error.message : "An unknown error occured" });
  }
});

export const bookmarkProduct = createAsyncThunk<
  { productId: number },
  { productId: number },
  { rejectValue: { message: string }; state: RootState }
>("bookmarks/bookmarkProduct", async ({ productId }, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    const response = await fetch(`${env.API_BASE_URL}/bookmarks/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ productId }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({ message: error.message || "Failed to bookmark product" });
    }
    return { productId };
  } catch (error) {
    return rejectWithValue({ message: error instanceof Error ? error.message : "An unknown error occured" });
  }
});

export const unbookmarkProduct = createAsyncThunk<
  { productId: number },
  { productId: number },
  { rejectValue: { message: string }; state: RootState }
>("bookmarks/unbookmarkProduct", async ({ productId }, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    const response = await fetch(`${env.API_BASE_URL}/bookmarks/products`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ productId }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({ message: error.message || "Failed to remove product bookmark" });
    }
    return { productId };
  } catch (error) {
    return rejectWithValue({ message: error instanceof Error ? error.message : "An unknown error occured" });
  }
});


