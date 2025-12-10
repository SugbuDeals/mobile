/**
 * Store feature hooks - domain-specific and combined
 */

import { useAppDispatch, useAppSelector } from "@/store/hooks";

// Store domain hooks
import * as storesSelectors from "./stores/selectors";
import * as storesThunks from "./stores/thunks";

// Product domain hooks
import * as productsSelectors from "./products/selectors";
import * as productsThunks from "./products/thunks";

// Promotion domain hooks
import * as promotionsSelectors from "./promotions/selectors";
import * as promotionsThunks from "./promotions/thunks";

// Subscription domain hooks
import * as subscriptionsSelectors from "./subscriptions/selectors";
import * as subscriptionsThunks from "./subscriptions/thunks";

/**
 * Hook for store operations
 */
export function useStores() {
  const dispatch = useAppDispatch();
  const storesState = useAppSelector((state) => state.store.stores);

  return {
    state: {
      stores: useAppSelector(storesSelectors.selectAllStores),
      selectedStore: useAppSelector(storesSelectors.selectSelectedStore),
      userStore: useAppSelector(storesSelectors.selectUserStore),
      nearbyStores: useAppSelector(storesSelectors.selectNearbyStores),
      loading: storesState.loading,
      error: storesState.error,
    },
    actions: {
      findStores: () => dispatch(storesThunks.findStores()),
      findNearbyStores: (params: {
        latitude: number;
        longitude: number;
        radiusKm?: number;
      }) => dispatch(storesThunks.findNearbyStores(params)),
      findStoreById: (storeId: number) =>
        dispatch(storesThunks.findStoreById(storeId)),
      findUserStore: (userId: number) =>
        dispatch(storesThunks.findUserStore(userId)),
      createStore: (data: Parameters<typeof storesThunks.createStore>[0]) =>
        dispatch(storesThunks.createStore(data)),
      updateStore: (data: Parameters<typeof storesThunks.updateStore>[0]) =>
        dispatch(storesThunks.updateStore(data)),
      updateStoreAdminStatus: (
        data: Parameters<typeof storesThunks.updateStoreAdminStatus>[0]
      ) => dispatch(storesThunks.updateStoreAdminStatus(data)),
      deleteStore: (storeId: number) =>
        dispatch(storesThunks.deleteStore(storeId)),
    },
  };
}

/**
 * Hook for product operations
 */
export function useProducts() {
  const dispatch = useAppDispatch();
  const productsState = useAppSelector((state) => state.store.products);

  return {
    state: {
      products: useAppSelector(productsSelectors.selectAllProducts),
      loading: productsState.loading,
      error: productsState.error,
    },
    actions: {
      findProducts: (filters?: { storeId?: number; isActive?: boolean }) =>
        dispatch(productsThunks.findProducts(filters || {})),
      findProductById: (productId: number) =>
        dispatch(productsThunks.findProductById(productId)),
      createProduct: (data: Parameters<typeof productsThunks.createProduct>[0]) =>
        dispatch(productsThunks.createProduct(data)),
      updateProduct: (data: Parameters<typeof productsThunks.updateProduct>[0]) =>
        dispatch(productsThunks.updateProduct(data)),
      updateProductAdminStatus: (
        data: Parameters<typeof productsThunks.updateProductAdminStatus>[0]
      ) => dispatch(productsThunks.updateProductAdminStatus(data)),
      deleteProduct: (productId: number) =>
        dispatch(productsThunks.deleteProduct(productId)),
    },
  };
}

/**
 * Hook for promotion operations
 */
export function usePromotions() {
  const dispatch = useAppDispatch();
  const promotionsState = useAppSelector((state) => state.store.promotions);

  return {
    state: {
      promotions: useAppSelector(promotionsSelectors.selectAllPromotions),
      activePromotions: useAppSelector(promotionsSelectors.selectActivePromotions),
      loading: promotionsState.loading,
      error: promotionsState.error,
    },
    actions: {
      findPromotions: () => dispatch(promotionsThunks.findPromotions()),
      findActivePromotions: (storeId?: number) =>
        dispatch(promotionsThunks.findActivePromotions({ storeId })),
      createPromotion: (
        data: Parameters<typeof promotionsThunks.createPromotion>[0]
      ) => dispatch(promotionsThunks.createPromotion(data)),
      updatePromotion: (
        data: Parameters<typeof promotionsThunks.updatePromotion>[0]
      ) => dispatch(promotionsThunks.updatePromotion(data)),
      deletePromotion: (promotionId: number) =>
        dispatch(promotionsThunks.deletePromotion(promotionId)),
    },
  };
}

/**
 * Hook for subscription operations
 * Updated for tier-based subscription system (BASIC/PRO)
 */
export function useSubscriptions() {
  const dispatch = useAppDispatch();
  const subscriptionsState = useAppSelector(
    (state) => state.store.subscriptions
  );

  return {
    state: {
      currentTier: subscriptionsState.currentTier,
      subscriptionAnalytics: subscriptionsState.subscriptionAnalytics,
      loading: subscriptionsState.loading,
      error: subscriptionsState.error,
    },
    actions: {
      getCurrentTier: () =>
        dispatch(subscriptionsThunks.getCurrentTier()),
      upgradeToPro: () =>
        dispatch(subscriptionsThunks.upgradeToPro()),
      downgradeToBasic: () =>
        dispatch(subscriptionsThunks.downgradeToBasic()),
      getSubscriptionAnalytics: () =>
        dispatch(subscriptionsThunks.getSubscriptionAnalytics()),
    },
  };
}

/**
 * Combined hook for all store operations (backward compatibility)
 */
export function useStore() {
  const stores = useStores();
  const products = useProducts();
  const promotions = usePromotions();
  const subscriptions = useSubscriptions();

  return {
    state: {
      stores: stores.state.stores,
      selectedStore: stores.state.selectedStore,
      userStore: stores.state.userStore,
      nearbyStores: stores.state.nearbyStores,
      products: products.state.products,
      promotions: promotions.state.promotions,
      activePromotions: promotions.state.activePromotions,
      currentTier: subscriptions.state.currentTier,
      subscriptionAnalytics: subscriptions.state.subscriptionAnalytics,
      loading:
        stores.state.loading ||
        products.state.loading ||
        promotions.state.loading ||
        subscriptions.state.loading,
      error:
        stores.state.error ||
        products.state.error ||
        promotions.state.error ||
        subscriptions.state.error,
    },
    action: {
      // Store actions
      findStores: stores.actions.findStores,
      findUserStore: stores.actions.findUserStore,
      findNearbyStores: stores.actions.findNearbyStores,
      findStoreById: stores.actions.findStoreById,
      createStore: stores.actions.createStore,
      updateStore: stores.actions.updateStore,
      updateStoreAdminStatus: stores.actions.updateStoreAdminStatus,
      deleteStore: stores.actions.deleteStore,
      // Product actions
      findProducts: products.actions.findProducts,
      findProductById: products.actions.findProductById,
      createProduct: products.actions.createProduct,
      updateProduct: products.actions.updateProduct,
      updateProductAdminStatus: products.actions.updateProductAdminStatus,
      deleteProduct: products.actions.deleteProduct,
      // Promotion actions
      findPromotions: promotions.actions.findPromotions,
      findActivePromotions: promotions.actions.findActivePromotions,
      createPromotion: promotions.actions.createPromotion,
      updatePromotion: promotions.actions.updatePromotion,
      deletePromotion: promotions.actions.deletePromotion,
      // Subscription actions (tier-based)
      getCurrentTier: subscriptions.actions.getCurrentTier,
      upgradeToPro: subscriptions.actions.upgradeToPro,
      downgradeToBasic: subscriptions.actions.downgradeToBasic,
      getSubscriptionAnalytics: subscriptions.actions.getSubscriptionAnalytics,
    },
  };
}

