/**
 * Promotion domain thunks
 */

import { productsApi } from "@/services/api/endpoints/products";
import { promotionsApi } from "@/services/api/endpoints/promotions";
import { RootState } from "@/store/types";
import { convertLegacyPromotion } from "@/utils/dealTypes";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { CreatePromotionDTO, Promotion, UpdatePromotionDTO } from "./types";

export const findPromotions = createAsyncThunk<
  Promotion[],
  void,
  { rejectValue: { message: string }; state: RootState }
>("promotions/findPromotions", async (_, { rejectWithValue }) => {
  try {
    const apiPromotions: any[] = await promotionsApi.findPromotions();
    // Map API promotions to extract productId from promotionProducts if needed
    // Also convert legacy format to new format
    return apiPromotions.map((p: any) => {
      // Extract productId from promotionProducts if productId is not present
      let productId = p.productId ?? null;
      if (!productId && p.promotionProducts && p.promotionProducts.length > 0) {
        productId = p.promotionProducts[0].productId ?? null;
      }
      
      // Convert legacy promotion format if needed
      const converted = convertLegacyPromotion(p);
      
      return {
        ...converted,
        productId: productId,
      };
    });
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
      const allPromotions: any[] = await promotionsApi.findPromotions();
      
      // Map and extract productId from promotionProducts if needed
      // Also convert legacy format to new format
      let mappedPromotions = allPromotions.map((p: any) => {
        // Extract productId from promotionProducts if productId is not present (for backward compatibility)
        let productId = p.productId ?? null;
        if (!productId && p.promotionProducts && p.promotionProducts.length > 0) {
          productId = p.promotionProducts[0].productId ?? null;
        }
        
        // Convert legacy promotion format if needed
        const converted = convertLegacyPromotion(p);
        
        return {
          ...converted,
          productId: productId,
          promotionProducts: p.promotionProducts || undefined, // Preserve all products in the promotion
        };
      });
      
      // Filter for active promotions
      let activePromotions = mappedPromotions.filter(
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
    const result: any = await promotionsApi.createPromotion(promotionData);
    
    // Extract productId from promotionProducts if productId is not present (for backward compatibility)
    let productId = result.productId ?? null;
    if (!productId && result.promotionProducts && result.promotionProducts.length > 0) {
      productId = result.promotionProducts[0].productId ?? null;
    }
    
    // Convert legacy promotion format if needed
    const converted = convertLegacyPromotion(result);
    
    return {
      ...converted,
      productId: productId,
      promotionProducts: result.promotionProducts || undefined, // Preserve all products in the promotion
    };
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
    const result: any = await promotionsApi.updatePromotion(id, updateData);
    
    // Extract productId from promotionProducts if productId is not present
    let productId = result.productId ?? null;
    if (!productId && result.promotionProducts && result.promotionProducts.length > 0) {
      productId = result.promotionProducts[0].productId ?? null;
    }
    
    // Convert legacy promotion format if needed
    const converted = convertLegacyPromotion(result);
    
    return {
      ...converted,
      productId: productId,
    };
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

