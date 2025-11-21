import { createSlice } from "@reduxjs/toolkit";
import { cancelRetailerSubscription, createProduct, createPromotion, createStore, createSubscription, deleteProduct, deletePromotion, deleteSubscription, findActivePromotions, findNearbyStores, findProductById, findProducts, findPromotions, findStoreById, findStores, findSubscriptions, findUserStore, getActiveSubscription, getSubscriptionAnalytics, joinSubscription, updateProduct, updatePromotion, updateRetailerSubscription, updateStore, updateSubscription } from "./thunk";
import { Store, Subscription, SubscriptionAnalytics } from "./types";

const initialState: {
  stores: Store[];
  selectedStore: Store | null;
  userStore: Store | null;
  nearbyStores: Store[];
  products: any[];
  promotions: any[];
  activePromotions: any[];
  activeSubscription: Subscription | null;
  subscriptions: Subscription[];
  subscriptionAnalytics: SubscriptionAnalytics | null;
  loading: boolean;
  error: string | null;
} = {
  stores: [],
  selectedStore: null,
  userStore: null,
  nearbyStores: [],
  products: [],
  promotions: [],
  activePromotions: [],
  activeSubscription: null,
  subscriptions: [],
  subscriptionAnalytics: null,
  loading: false,
  error: null,
};

const storeSlice = createSlice({
  name: "store",
  initialState,
  reducers: {
    clearStore: (state) => {
      state.stores = [];
      state.selectedStore = null;
      state.userStore = null;
      state.products = [];
      state.promotions = [];
      state.activePromotions = [];
      state.loading = false;
      state.error = null;
    },
    setUserStore: (state, action) => {
      state.userStore = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      /**
       * [GET] store/findStore
       */
      .addCase(findStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findStores.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.stores = action.payload;
      })
      .addCase(findStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Find stores failed";
      })
      // Find Nearby Stores
      .addCase(findNearbyStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findNearbyStores.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.nearbyStores = action.payload;
      })
      .addCase(findNearbyStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Find nearby stores failed";
      })
      // Find User Store
      .addCase(findUserStore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findUserStore.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.userStore = action.payload;
        // Also update selectedStore if it's the user's store
        if (action.payload) {
          state.selectedStore = action.payload;
        }
      })
      .addCase(findUserStore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Find user store failed";
      })
      // Find Products
      .addCase(findProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.products = action.payload;
      })
      .addCase(findProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Find products failed";
      })
      // Find Product By ID
      .addCase(findProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findProductById.fulfilled, (state, action) => {
        console.log("Store slice - findProductById.fulfilled with payload:", action.payload);
        state.loading = false;
        state.error = null;
        // Add to products list if not already present
        const existingProduct = state.products.find(product => product.id === action.payload.id);
        if (!existingProduct) {
          state.products.push(action.payload);
        }
      })
      .addCase(findProductById.rejected, (state, action) => {
        console.log("Store slice - findProductById.rejected with error:", action.payload);
        state.loading = false;
        state.error = action.payload?.message || "Find product by ID failed";
      })
      // Find Promotions
      .addCase(findPromotions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findPromotions.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.promotions = action.payload;
      })
      .addCase(findPromotions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Find promotions failed";
      })
      // Find Active Promotions
      .addCase(findActivePromotions.pending, (state) => {
        console.log("Store slice - findActivePromotions.pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(findActivePromotions.fulfilled, (state, action) => {
        console.log("Store slice - findActivePromotions.fulfilled with payload:", action.payload);
        state.loading = false;
        state.error = null;
        state.activePromotions = action.payload;
        console.log("Store slice - activePromotions updated to:", state.activePromotions);
      })
      .addCase(findActivePromotions.rejected, (state, action) => {
        console.log("Store slice - findActivePromotions.rejected with error:", action.payload);
        state.loading = false;
        state.error = action.payload?.message || "Find active promotions failed";
      })
      // Create Store
      .addCase(createStore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStore.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.userStore = action.payload;
        state.selectedStore = action.payload;
        // Add to stores list if not already present
        const existingStore = state.stores.find(store => store.id === action.payload.id);
        if (!existingStore) {
          state.stores.push(action.payload);
        }
      })
      .addCase(createStore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Create store failed";
      })
      // Update Store
      .addCase(updateStore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStore.fulfilled, (state, action) => {
        console.log("Store slice - updateStore.fulfilled:", action.payload);
        state.loading = false;
        state.error = null;
        state.userStore = action.payload;
        state.selectedStore = action.payload;
        // Update in stores list
        const storeIndex = state.stores.findIndex(store => store.id === action.payload.id);
        if (storeIndex !== -1) {
          state.stores[storeIndex] = action.payload;
        }
        console.log("Store slice - userStore updated to:", state.userStore);
      })
      .addCase(updateStore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Update store failed";
      })
      // Find Store By ID
      .addCase(findStoreById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findStoreById.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.userStore = action.payload;
        state.selectedStore = action.payload;
      })
      .addCase(findStoreById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Find store by ID failed";
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Create product failed";
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const index = state.products.findIndex(product => product.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Update product failed";
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.products = state.products.filter(product => product.id !== action.payload.id);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Delete product failed";
      })
      // Create Promotion
      .addCase(createPromotion.pending, (state) => {
        console.log("Store slice - createPromotion.pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(createPromotion.fulfilled, (state, action) => {
        console.log("Store slice - createPromotion.fulfilled with payload:", action.payload);
        state.loading = false;
        state.error = null;
        state.promotions.push(action.payload);
        // Also add to active promotions if it's active
        if (action.payload.active) {
          console.log("Store slice - Adding to activePromotions:", action.payload);
          state.activePromotions.push(action.payload);
          console.log("Store slice - activePromotions after adding:", state.activePromotions);
        }
      })
      .addCase(createPromotion.rejected, (state, action) => {
        console.log("Store slice - createPromotion.rejected with error:", action.payload);
        state.loading = false;
        state.error = action.payload?.message || "Create promotion failed";
      })
      // Update Promotion
      .addCase(updatePromotion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePromotion.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const index = state.promotions.findIndex(promotion => promotion.id === action.payload.id);
        if (index !== -1) {
          state.promotions[index] = action.payload;
        }
        // Update in active promotions as well
        const activeIndex = state.activePromotions.findIndex(promotion => promotion.id === action.payload.id);
        if (action.payload.active) {
          if (activeIndex === -1) {
            state.activePromotions.push(action.payload);
          } else {
            state.activePromotions[activeIndex] = action.payload;
          }
        } else {
          if (activeIndex !== -1) {
            state.activePromotions.splice(activeIndex, 1);
          }
        }
      })
      .addCase(updatePromotion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Update promotion failed";
      })
      // Delete Promotion
      .addCase(deletePromotion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePromotion.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.promotions = state.promotions.filter(promotion => promotion.id !== action.payload.id);
        state.activePromotions = state.activePromotions.filter(promotion => promotion.id !== action.payload.id);
      })
      .addCase(deletePromotion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Delete promotion failed";
      })
      // Get Active Subscription
      .addCase(getActiveSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.activeSubscription = action.payload;
      })
      .addCase(getActiveSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Get active subscription failed";
      })
      // Join Subscription
      .addCase(joinSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.activeSubscription = action.payload;
      })
      .addCase(joinSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Join subscription failed";
      })
      // Find Subscriptions
      .addCase(findSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.subscriptions = action.payload;
      })
      .addCase(findSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Find subscriptions failed";
      })
      // Cancel Retailer Subscription
      .addCase(cancelRetailerSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelRetailerSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.activeSubscription = action.payload;
      })
      .addCase(cancelRetailerSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Cancel subscription failed";
      })
      // Update Retailer Subscription
      .addCase(updateRetailerSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRetailerSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.activeSubscription = action.payload;
      })
      .addCase(updateRetailerSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Update subscription failed";
      })
      // Create Subscription (Admin)
      .addCase(createSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.subscriptions.push(action.payload);
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Create subscription failed";
      })
      // Update Subscription (Admin)
      .addCase(updateSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const index = state.subscriptions.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.subscriptions[index] = action.payload;
        }
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Update subscription failed";
      })
      // Delete Subscription (Admin)
      .addCase(deleteSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.subscriptions = state.subscriptions.filter(s => s.id !== action.payload.id);
      })
      .addCase(deleteSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Delete subscription failed";
      })
      // Get Subscription Analytics (Admin)
      .addCase(getSubscriptionAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSubscriptionAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.subscriptionAnalytics = action.payload;
      })
      .addCase(getSubscriptionAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Get subscription analytics failed";
      });
  },
});

export const { clearStore, setUserStore } = storeSlice.actions;
export const storeReducer = storeSlice.reducer;
