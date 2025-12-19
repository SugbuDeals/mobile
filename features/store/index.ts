/**
 * Store feature public exports
 */

// Combined reducer
export { storeReducer } from "./slice";

// Domain exports
export * from "./products";
export * from "./stores";
// Explicitly export promotions to avoid conflicts with products (setComponentLoading, clearComponentLoading)
export * from "./promotions/selectors";
export * from "./promotions/thunks";
export type { CreatePromotionDTO, Promotion, UpdatePromotionDTO } from "./promotions/types";
// Export promotions slice actions (excluding setComponentLoading and clearComponentLoading to avoid conflict with products)
export { clearPromotions, promotionsReducer, selectIsUpdatingPromotion } from "./promotions/slice";
// Note: setComponentLoading and clearComponentLoading for promotions should be imported directly from "./promotions/slice"
export * from "./analytics";
export * from "./subscriptions";

// Hooks
export * from "./hooks";
export { useStoreManagement } from "./storeManagement";

// Types (re-export from domains for convenience)
export type { CreateProductDTO, Product, UpdateProductDTO } from "./products/types";
export type { CreateStoreDTO, Store, UpdateStoreDTO } from "./stores/types";
// Promotion types already exported above, no need to re-export
export type { RetailerAnalytics } from "./analytics/types";
export type { SubscriptionAnalytics } from "./subscriptions/types";

