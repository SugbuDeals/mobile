import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { bookmarksApi } from "@/services/api";
import { BookmarkedProduct, BookmarkedStore, ListBookmarksPayload } from "./types";

export const listStoreBookmarks = createAsyncThunk<
  BookmarkedStore[],
  ListBookmarksPayload | undefined,
  { rejectValue: { message: string }; state: RootState }
>(
  "bookmarks/listStoreBookmarks",
  async (payload, { rejectWithValue }) => {
    try {
      const result = await bookmarksApi.listStoreBookmarks({
        take: 50,
        skip: 0,
        ...(payload || {}),
      });
      // Map API response to BookmarkedStore format
      return result.map((item) => ({
        storeId: item.storeId,
        name: item.store?.name,
      }));
    } catch (error: unknown) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Failed to list store bookmarks",
      });
    }
  }
);

export const listProductBookmarks = createAsyncThunk<
  BookmarkedProduct[],
  ListBookmarksPayload | undefined,
  { rejectValue: { message: string }; state: RootState }
>(
  "bookmarks/listProductBookmarks",
  async (payload, { rejectWithValue }) => {
    try {
      const result = await bookmarksApi.listProductBookmarks({
        take: 50,
        skip: 0,
        ...(payload || {}),
      });
      // Map API response to BookmarkedProduct format
      return result.map((item) => ({
        productId: item.productId,
        name: item.product?.name,
      }));
    } catch (error: unknown) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Failed to list product bookmarks",
      });
    }
  }
);

export const bookmarkStore = createAsyncThunk<
  { storeId: number },
  { storeId: number },
  { rejectValue: { message: string }; state: RootState }
>("bookmarks/bookmarkStore", async ({ storeId }, { rejectWithValue }) => {
  try {
    await bookmarksApi.bookmarkStore({ storeId });
    return { storeId };
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Failed to bookmark store",
    });
  }
});

export const unbookmarkStore = createAsyncThunk<
  { storeId: number },
  { storeId: number },
  { rejectValue: { message: string }; state: RootState }
>("bookmarks/unbookmarkStore", async ({ storeId }, { rejectWithValue }) => {
  try {
    await bookmarksApi.unbookmarkStore({ storeId });
    return { storeId };
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Failed to remove store bookmark",
    });
  }
});

export const bookmarkProduct = createAsyncThunk<
  { productId: number },
  { productId: number },
  { rejectValue: { message: string }; state: RootState }
>("bookmarks/bookmarkProduct", async ({ productId }, { rejectWithValue }) => {
  try {
    await bookmarksApi.bookmarkProduct({ productId });
    return { productId };
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Failed to bookmark product",
    });
  }
});

export const unbookmarkProduct = createAsyncThunk<
  { productId: number },
  { productId: number },
  { rejectValue: { message: string }; state: RootState }
>("bookmarks/unbookmarkProduct", async ({ productId }, { rejectWithValue }) => {
  try {
    await bookmarksApi.unbookmarkProduct({ productId });
    return { productId };
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Failed to remove product bookmark",
    });
  }
});


