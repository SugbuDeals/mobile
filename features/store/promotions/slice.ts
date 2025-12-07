/**
 * Promotion domain slice
 */

import { createSlice, Draft } from "@reduxjs/toolkit";
import {
  findPromotions,
  findActivePromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "./thunks";
import { createAsyncReducer } from "@/utils/redux/createAsyncReducer";
import type { Promotion, UpdatePromotionDTO } from "./types";

interface PromotionsState {
  promotions: Promotion[];
  activePromotions: Promotion[];
  loading: boolean;
  error: string | null;
  componentLoading: {
    [key: string]: boolean;
  };
}

const initialState: PromotionsState = {
  promotions: [],
  activePromotions: [],
  loading: false,
  error: null,
  componentLoading: {},
};

const promotionsSlice = createSlice({
  name: "promotions",
  initialState,
  reducers: {
    clearPromotions: (state) => {
      state.promotions = [];
      state.activePromotions = [];
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
    // Find Promotions
    createAsyncReducer<PromotionsState, Promotion[], void>(builder, findPromotions, {
      onFulfilled: (state: Draft<PromotionsState>, action) => {
        state.promotions = action.payload;
      },
    });

    // Find Active Promotions
    createAsyncReducer<PromotionsState, Promotion[], { storeId?: number }>(builder, findActivePromotions, {
      onFulfilled: (state: Draft<PromotionsState>, action) => {
        state.activePromotions = action.payload;
      },
    });

    // Create Promotion
    createAsyncReducer<PromotionsState, Promotion, any>(builder, createPromotion, {
      onFulfilled: (state: Draft<PromotionsState>, action) => {
        state.promotions.push(action.payload);
        // Also add to active promotions if it's active
        if (action.payload.active) {
          state.activePromotions.push(action.payload);
        }
      },
    });

    // Update Promotion
    createAsyncReducer<PromotionsState, Promotion, { id: number } & UpdatePromotionDTO>(builder, updatePromotion, {
      onPending: (state: Draft<PromotionsState>, action) => {
        const promotionId = action.meta.arg?.id;
        if (promotionId) {
          state.componentLoading[`updating-${promotionId}`] = true;
        }
      },
      onFulfilled: (state: Draft<PromotionsState>, action) => {
        const index = state.promotions.findIndex(
          (promotion: Promotion) => promotion.id === action.payload.id
        );
        if (index !== -1) {
          state.promotions[index] = action.payload;
        }
        // Update in active promotions as well
        const activeIndex = state.activePromotions.findIndex(
          (promotion: Promotion) => promotion.id === action.payload.id
        );
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
        const promotionId = action.payload.id;
        delete state.componentLoading[`updating-${promotionId}`];
      },
      onRejected: (state: Draft<PromotionsState>, action) => {
        const promotionId = action.meta.arg?.id;
        if (promotionId) {
          delete state.componentLoading[`updating-${promotionId}`];
        }
      },
    });

    // Delete Promotion
    createAsyncReducer<PromotionsState, { id: number }, number>(builder, deletePromotion, {
      onFulfilled: (state: Draft<PromotionsState>, action) => {
        state.promotions = state.promotions.filter(
          (promotion: Promotion) => promotion.id !== action.payload.id
        );
        state.activePromotions = state.activePromotions.filter(
          (promotion: Promotion) => promotion.id !== action.payload.id
        );
      },
    });
  },
});

export const { clearPromotions, setComponentLoading, clearComponentLoading } =
  promotionsSlice.actions;
export const promotionsReducer = promotionsSlice.reducer;

// Selectors
export const selectIsUpdatingPromotion = (
  state: { store: { promotions: PromotionsState } },
  promotionId: number
) =>
  state.store.promotions.componentLoading[`updating-${promotionId}`] ?? false;

