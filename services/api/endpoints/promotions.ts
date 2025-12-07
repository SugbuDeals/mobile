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

/**
 * CreatePromotionDto matching server.json CreatePromotionDto
 */
export interface CreatePromotionDTO {
  title: string;
  type: string; // Promotion type (e.g., "percentage", "fixed")
  description: string;
  discount: number;
  productId: number;
  startsAt?: string; // ISO 8601 format date-time, defaults to current time if not provided
  endsAt?: string; // ISO 8601 format date-time, nullable (if not provided, promotion has no end date)
  active?: boolean; // Defaults to true if not provided
}

/**
 * UpdatePromotionDto matching server.json UpdatePromotionDto
 */
export interface UpdatePromotionDTO {
  title?: string;
  type?: string; // Promotion type (e.g., "percentage", "fixed")
  description?: string;
  discount?: number;
  productId?: number;
  startsAt?: string; // ISO 8601 format date-time
  endsAt?: string; // ISO 8601 format date-time, nullable
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
   * Find active promotions
   */
  findActivePromotions: (): Promise<Promotion[]> => {
    return getApiClient().get<Promotion[]>("/promotions/active");
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
   * Returns PromotionResponseDto per server.json (not partial)
   */
  deletePromotion: (promotionId: number): Promise<Promotion> => {
    return getApiClient().delete<Promotion>(`/promotions/${promotionId}`);
  },
};

