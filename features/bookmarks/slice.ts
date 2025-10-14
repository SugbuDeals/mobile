import { createSlice } from "@reduxjs/toolkit";
import {
    bookmarkProduct,
    bookmarkStore,
    listProductBookmarks,
    listStoreBookmarks,
    unbookmarkProduct,
    unbookmarkStore,
} from "./thunk";
import { BookmarksState } from "./types";

const initialState: BookmarksState = {
  stores: [],
  products: [],
  loading: false,
  error: null,
};

const bookmarksSlice = createSlice({
  name: "bookmarks",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listStoreBookmarks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listStoreBookmarks.fulfilled, (state, action) => {
        state.loading = false;
        state.stores = action.payload || [];
      })
      .addCase(listStoreBookmarks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to list store bookmarks";
      })
      .addCase(listProductBookmarks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listProductBookmarks.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload || [];
      })
      .addCase(listProductBookmarks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to list product bookmarks";
      })
      .addCase(bookmarkStore.fulfilled, (state, action) => {
        const { storeId } = action.payload;
        if (!state.stores.some((s) => s.storeId === storeId)) {
          state.stores.push({ storeId });
        }
      })
      .addCase(unbookmarkStore.fulfilled, (state, action) => {
        const { storeId } = action.payload;
        state.stores = state.stores.filter((s) => s.storeId !== storeId);
      })
      .addCase(bookmarkProduct.fulfilled, (state, action) => {
        const { productId } = action.payload;
        if (!state.products.some((p) => p.productId === productId)) {
          state.products.push({ productId });
        }
      })
      .addCase(unbookmarkProduct.fulfilled, (state, action) => {
        const { productId } = action.payload;
        state.products = state.products.filter((p) => p.productId !== productId);
      });
  },
});

export const bookmarksReducer = bookmarksSlice.reducer;


