/**
 * Product domain slice
 */

import { createSlice, Draft } from "@reduxjs/toolkit";
import {
  findProducts,
  findProductById,
  createProduct,
  updateProduct,
  updateProductAdminStatus,
  deleteProduct,
} from "./thunks";
import { createAsyncReducer } from "@/utils/redux/createAsyncReducer";
import { logout } from "@/features/auth/slice";
import type { Product } from "./types";

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  componentLoading: {
    [key: string]: boolean;
  };
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
  componentLoading: {},
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearProducts: (state) => {
      state.products = [];
      state.loading = false;
      state.error = null;
    },
    setComponentLoading: (
      state,
      action: { payload: { key: string; loading: boolean } }
    ) => {
      state.componentLoading[action.payload.key] = action.payload.loading;
    },
    clearComponentLoading: (state, action: { payload: string }) => {
      delete state.componentLoading[action.payload];
    },
  },
  extraReducers: (builder) => {
    // Find Products
    createAsyncReducer<ProductsState, Product[], { storeId?: number; isActive?: boolean }>(builder, findProducts, {
      onFulfilled: (state: Draft<ProductsState>, action) => {
        state.products = action.payload;
      },
    });

    // Find Product By ID
    createAsyncReducer<ProductsState, Product, number>(builder, findProductById, {
      onFulfilled: (state: Draft<ProductsState>, action) => {
        // Add to products list if not already present
        const existingProduct = state.products.find(
          (product: Product) => product.id === action.payload.id
        );
        if (!existingProduct) {
          state.products.push(action.payload);
        } else {
          const index = state.products.indexOf(existingProduct);
          state.products[index] = action.payload;
        }
      },
    });

    // Create Product
    createAsyncReducer<ProductsState, Product, any>(builder, createProduct, {
      onFulfilled: (state: Draft<ProductsState>, action) => {
        state.products.push(action.payload);
      },
    });

    // Update Product
    createAsyncReducer<ProductsState, Product, any>(builder, updateProduct, {
      onFulfilled: (state: Draft<ProductsState>, action) => {
        const index = state.products.findIndex(
          (product: Product) => product.id === action.payload.id
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      },
    });

    // Update Product Admin Status
    createAsyncReducer<ProductsState, Product, any>(builder, updateProductAdminStatus, {
      onFulfilled: (state: Draft<ProductsState>, action) => {
        const index = state.products.findIndex(
          (product: Product) => product.id === action.payload.id
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      },
    });

    // Delete Product
    createAsyncReducer<ProductsState, { id: number }, number>(builder, deleteProduct, {
      onPending: (state: Draft<ProductsState>, action) => {
        const productId = action.meta.arg;
        if (productId) {
          state.componentLoading[`deleting-${productId}`] = true;
        }
      },
      onFulfilled: (state: Draft<ProductsState>, action) => {
        state.products = state.products.filter(
          (product: Product) => product.id !== action.payload.id
        );
        const productId = action.payload.id;
        delete state.componentLoading[`deleting-${productId}`];
      },
      onRejected: (state: Draft<ProductsState>, action) => {
        const productId = action.meta.arg;
        if (productId) {
          delete state.componentLoading[`deleting-${productId}`];
        }
      },
    });

    // Clear products on logout
    builder.addCase(logout, (state) => {
      state.products = [];
      state.loading = false;
      state.error = null;
      state.componentLoading = {};
    });
  },
});

export const { clearProducts, setComponentLoading, clearComponentLoading } =
  productsSlice.actions;
export const productsReducer = productsSlice.reducer;

// Selectors
export const selectIsDeletingProduct = (
  state: { store: { products: ProductsState } },
  productId: number
) => state.store.products.componentLoading[`deleting-${productId}`] ?? false;

