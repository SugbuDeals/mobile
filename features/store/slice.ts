import { createSlice } from "@reduxjs/toolkit";
import { createStore, findActivePromotions, findProducts, findPromotions, findStoreById, findStores, findUserStore, updateStore } from "./thunk";
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
        state.loading = true;
        state.error = null;
      })
      .addCase(findActivePromotions.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.activePromotions = action.payload;
      })
      .addCase(findActivePromotions.rejected, (state, action) => {
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
      });
  },
});

export const { clearStore, setUserStore } = storeSlice.actions;
export const storeReducer = storeSlice.reducer;
