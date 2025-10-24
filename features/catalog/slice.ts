import { createSlice } from "@reduxjs/toolkit";
import { findCategories, findProducts } from "./thunk";
import { Category, Product } from "./types";

type CatalogState = {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
};

const initialState: CatalogState = {
  categories: [],
  products: [],
  loading: false,
  error: null,
};

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(findCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(findCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Find categories failed";
      })
      .addCase(findProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(findProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Find products failed";
      });
  },
});

export const catalogReducer = catalogSlice.reducer;

