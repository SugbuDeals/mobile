import { createSlice } from "@reduxjs/toolkit";
import { createCategory, deleteCategory, findCategories, findProducts, updateCategory } from "./thunk";
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
        state.error = (action.payload as { message?: string })?.message || "Find products failed";
      })
      // Create category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Create category failed";
      })
      // Update category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex(cat => cat.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Update category failed";
      })
      // Delete category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter(cat => cat.id !== action.payload.id);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Delete category failed";
      });
  },
});

export const catalogReducer = catalogSlice.reducer;

