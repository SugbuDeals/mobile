/**
 * Combined store slice - combines all domain slices
 */

import { combineReducers } from "@reduxjs/toolkit";
import { analyticsReducer } from "./analytics/slice";
import { productsReducer } from "./products/slice";
import { promotionsReducer } from "./promotions/slice";
import { storesReducer } from "./stores/slice";
import { subscriptionsReducer } from "./subscriptions/slice";

// Combine all domain reducers
export const storeReducer = combineReducers({
  stores: storesReducer,
  products: productsReducer,
  promotions: promotionsReducer,
  subscriptions: subscriptionsReducer,
  analytics: analyticsReducer,
});

// Re-export actions from all domains
export * from "./analytics/slice";
export {
    clearComponentLoading as clearProductComponentLoading, clearProducts, productsReducer,
    selectIsDeletingProduct, setComponentLoading as setProductComponentLoading
} from "./products/slice";
export {
    clearComponentLoading as clearPromotionComponentLoading, clearPromotions, promotionsReducer,
    selectIsUpdatingPromotion, setComponentLoading as setPromotionComponentLoading
} from "./promotions/slice";
export * from "./stores/slice";
export * from "./subscriptions/slice";

