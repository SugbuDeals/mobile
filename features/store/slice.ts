/**
 * Combined store slice - combines all domain slices
 */

import { combineReducers } from "@reduxjs/toolkit";
import { storesReducer } from "./stores/slice";
import { productsReducer } from "./products/slice";
import { promotionsReducer } from "./promotions/slice";
import { subscriptionsReducer } from "./subscriptions/slice";

// Combine all domain reducers
export const storeReducer = combineReducers({
  stores: storesReducer,
  products: productsReducer,
  promotions: promotionsReducer,
  subscriptions: subscriptionsReducer,
});

// Re-export actions from all domains
export * from "./stores/slice";
export {
  clearProducts,
  setComponentLoading as setProductComponentLoading,
  clearComponentLoading as clearProductComponentLoading,
  productsReducer,
  selectIsDeletingProduct,
} from "./products/slice";
export {
  clearPromotions,
  setComponentLoading as setPromotionComponentLoading,
  clearComponentLoading as clearPromotionComponentLoading,
  promotionsReducer,
  selectIsUpdatingPromotion,
} from "./promotions/slice";
export * from "./subscriptions/slice";
