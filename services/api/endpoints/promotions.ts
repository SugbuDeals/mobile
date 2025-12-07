/**
 * Promotion API endpoints
 */

import { getApiClient } from "../client";
import type { Promotion } from "@/features/store/promotions/types";

export interface FindPromotionsParams {
  storeId?: number;
  isActive?: boolean;
  skip?: number;
  take?: number;
  [key: string]: unknown;
}

export interface CreatePromotionDTO {
  title: string;
  description?: string;
  productId: number;
  discount: number;
  type: "percentage" | "fixed";
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

export interface UpdatePromotionDTO {
  title?: string;
  description?: string;
  discount?: number;
  type?: "percentage" | "fixed";
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

export const promotionsApi = {
  /**
   * Find all promotions
   */
  findPromotions: (params?: FindPromotionsParams): Promise<Promotion[]> => {
    return getApiClient().get<Promotion[]>("/promotions", params);
  },

  /**
   * Find promotion by ID
   */
  findPromotionById: (promotionId: number): Promise<Promotion> => {
    return getApiClient().get<Promotion>(`/promotions/${promotionId}`);
  },

  /**
   * Create a new promotion
   */
  createPromotion: (data: CreatePromotionDTO): Promise<Promotion> => {
    return getApiClient().post<Promotion>("/promotions", data);
  },

  /**
   * Update a promotion
   */
  updatePromotion: (
    promotionId: number,
    data: UpdatePromotionDTO
  ): Promise<Promotion> => {
    return getApiClient().patch<Promotion>(
      `/promotions/${promotionId}`,
      data
    );
  },

  /**
   * Delete a promotion
   */
  deletePromotion: (promotionId: number): Promise<{ id: number }> => {
    return getApiClient().delete<{ id: number }>(`/promotions/${promotionId}`);
  },
};

