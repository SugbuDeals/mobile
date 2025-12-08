/**
 * Promotion domain thunks
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/store/types";
import { promotionsApi } from "@/services/api/endpoints/promotions";
import { productsApi } from "@/services/api/endpoints/products";
import type { Promotion, CreatePromotionDTO, UpdatePromotionDTO } from "./types";

export const findPromotions = createAsyncThunk<
  Promotion[],
  void,
  { rejectValue: { message: string }; state: RootState }
>("promotions/findPromotions", async (_, { rejectWithValue }) => {
  try {
    return await promotionsApi.findPromotions();
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Find promotions failed",
    });
  }
});

export const findActivePromotions = createAsyncThunk<
  Promotion[],
  { storeId?: number },
  { rejectValue: { message: string }; state: RootState }
>(
  "promotions/findActivePromotions",
  async ({ storeId }, { rejectWithValue, getState }) => {
    try {
      const allPromotions = await promotionsApi.findPromotions();
      
      // Filter for active promotions
      let activePromotions = allPromotions.filter(
        (promotion: Promotion) => promotion.active === true
      );
      
      // If storeId is provided, filter promotions by store ownership
      if (storeId) {
        const products = await productsApi.findProducts({ storeId });
        const storeProductIds = products.map((product) => product.id);
        
        // Filter promotions to only include those for products owned by the store
        activePromotions = activePromotions.filter((promotion: Promotion) =>
          storeProductIds.includes(promotion.productId ?? -1)
        );
      }
      
      return activePromotions;
    } catch (error) {
      return rejectWithValue({
        message:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Find active promotions failed",
      });
    }
  }
);

export const createPromotion = createAsyncThunk<
  Promotion,
  CreatePromotionDTO,
  { rejectValue: { message: string }; state: RootState }
>("promotions/createPromotion", async (promotionData, { rejectWithValue }) => {
  try {
    return await promotionsApi.createPromotion(promotionData);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Create promotion failed",
    });
  }
});

export const updatePromotion = createAsyncThunk<
  Promotion,
  { id: number } & UpdatePromotionDTO,
  { rejectValue: { message: string }; state: RootState }
>("promotions/updatePromotion", async ({ id, ...updateData }, { rejectWithValue }) => {
  try {
    return await promotionsApi.updatePromotion(id, updateData);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Update promotion failed",
    });
  }
});

export const deletePromotion = createAsyncThunk<
  { id: number },
  number,
  { rejectValue: { message: string }; state: RootState }
>("promotions/deletePromotion", async (promotionId, { rejectWithValue }) => {
  try {
    return await promotionsApi.deletePromotion(promotionId);
  } catch (error) {
    return rejectWithValue({
      message:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Delete promotion failed",
    });
  }
});

