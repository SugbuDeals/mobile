/**
 * Product domain selectors
 */

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/types";
import type { Product } from "./types";

// Base selectors
const selectProductsState = (state: RootState) => state.store.products;

// Memoized selectors
export const selectAllProducts = createSelector(
  [selectProductsState],
  (productsState) => productsState.products
);

export const selectProductsLoading = createSelector(
  [selectProductsState],
  (productsState) => productsState.loading
);

export const selectProductsError = createSelector(
  [selectProductsState],
  (productsState) => productsState.error
);

export const selectProductById = (productId: number) =>
  createSelector([selectAllProducts], (products) =>
    products.find((product) => product.id === productId)
  );

export const selectProductsByStore = (storeId: number) =>
  createSelector([selectAllProducts], (products) =>
    products.filter((product) => product.storeId === storeId)
  );

export const selectActiveProducts = createSelector(
  [selectAllProducts],
  (products) => products.filter((product) => product.isActive !== false)
);

export const selectActiveProductsByStore = (storeId: number) =>
  createSelector([selectAllProducts], (products) =>
    products.filter(
      (product) => product.storeId === storeId && product.isActive !== false
    )
  );

