/**
 * Promotion API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - GET /promotions (operationId: PromotionController_findAll)
 * - GET /promotions/active (operationId: PromotionController_findActive)
 * - GET /promotions/{id} (operationId: PromotionController_findOne)
 * - POST /promotions (operationId: PromotionController_create)
 * - POST /promotions/{id}/products (operationId: PromotionController_addProducts)
 * - PATCH /promotions/{id} (operationId: PromotionController_update)
 * - DELETE /promotions/{id} (operationId: PromotionController_remove)
 */

import { getApiClient } from "../client";
import type {
  PromotionResponseDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  AddProductsToPromotionDto,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
  PromotionResponseDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  AddProductsToPromotionDto,
};

// Alias for consistency with existing code
export type CreatePromotionDTO = CreatePromotionDto;
export type UpdatePromotionDTO = UpdatePromotionDto;

export const promotionsApi = {
  /**
   * Find all promotions (including inactive and expired)
   * Operation: PromotionController_findAll
   * Endpoint: GET /promotions
   */
  findPromotions: (): Promise<PromotionResponseDto[]> => {
    return getApiClient().get<PromotionResponseDto[]>("/promotions");
  },

  /**
   * Find active promotions only (based on start/end dates and active status)
   * Operation: PromotionController_findActive
   * Endpoint: GET /promotions/active
   */
  findActivePromotions: (): Promise<PromotionResponseDto[]> => {
    return getApiClient().get<PromotionResponseDto[]>("/promotions/active");
  },

  /**
   * Find promotion by ID
   * Operation: PromotionController_findOne
   * Endpoint: GET /promotions/{id}
   */
  findPromotionById: (promotionId: number): Promise<PromotionResponseDto> => {
    return getApiClient().get<PromotionResponseDto>(`/promotions/${promotionId}`);
  },

  /**
   * Create a new promotion
   * Operation: PromotionController_create
   * Endpoint: POST /promotions
   */
  createPromotion: (data: CreatePromotionDto): Promise<PromotionResponseDto> => {
    return getApiClient().post<PromotionResponseDto>("/promotions", data);
  },

  /**
   * Add products to an existing promotion
   * Restricted to retailers and admins. BASIC tier allows max 10 products total per promotion, PRO tier allows unlimited.
   * Operation: PromotionController_addProducts
   * Endpoint: POST /promotions/{id}/products
   */
  addProductsToPromotion: (
    promotionId: number,
    data: AddProductsToPromotionDto
  ): Promise<PromotionResponseDto> => {
    return getApiClient().post<PromotionResponseDto>(
      `/promotions/${promotionId}/products`,
      data
    );
  },

  /**
   * Update a promotion
   * Operation: PromotionController_update
   * Endpoint: PATCH /promotions/{id}
   */
  updatePromotion: (
    promotionId: number,
    data: UpdatePromotionDto
  ): Promise<PromotionResponseDto> => {
    return getApiClient().patch<PromotionResponseDto>(
      `/promotions/${promotionId}`,
      data
    );
  },

  /**
   * Delete a promotion
   * Operation: PromotionController_remove
   * Endpoint: DELETE /promotions/{id}
   */
  deletePromotion: (promotionId: number): Promise<PromotionResponseDto> => {
    return getApiClient().delete<PromotionResponseDto>(`/promotions/${promotionId}`);
  },
};

