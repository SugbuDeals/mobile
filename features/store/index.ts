/**
 * Store feature public exports
 */

// Combined reducer
export { storeReducer } from "./slice";

// Domain exports
export * from "./stores";
export * from "./products";
// Explicitly export promotions to avoid conflicts with products (setComponentLoading, clearComponentLoading)
export type { Promotion, CreatePromotionDTO, UpdatePromotionDTO } from "./promotions/types";
export * from "./promotions/thunks";
export * from "./promotions/selectors";
// Export promotions slice actions (excluding setComponentLoading and clearComponentLoading to avoid conflict with products)
export { clearPromotions, promotionsReducer, selectIsUpdatingPromotion } from "./promotions/slice";
// Note: setComponentLoading and clearComponentLoading for promotions should be imported directly from "./promotions/slice"
export * from "./subscriptions";

// Hooks
export * from "./hooks";
export { useStoreManagement } from "./storeManagement";

// Types (re-export from domains for convenience)
export type { Store, CreateStoreDTO, UpdateStoreDTO } from "./stores/types";
export type { Product, CreateProductDTO, UpdateProductDTO } from "./products/types";
// Promotion types already exported above, no need to re-export
export type { Subscription, SubscriptionAnalytics } from "./subscriptions/types";
