import { createSlice } from "@reduxjs/toolkit";
import { createProduct, createPromotion, createStore, deleteProduct, deletePromotion, findActivePromotions, findProductById, findProducts, findPromotions, findStoreById, findStores, findUserStore, updateProduct, updatePromotion, updateStore } from "./thunk";
import { Store } from "./types";

const initialState: {
  stores: Store[];
  selectedStore: Store | null;
  userStore: Store | null;
  products: any[];
  promotions: any[];
  activePromotions: any[];
  loading: boolean;
  error: string | null;
} = {
  stores: [],
  selectedStore: null,
  userStore: null,
  products: [],
  promotions: [],
  activePromotions: [],
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
      });
  },
});

export const { clearStore, setUserStore } = storeSlice.actions;
export const storeReducer = storeSlice.reducer;
