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
    AddProductsToPromotionDto,
    ConfirmVoucherRedemptionDto,
    ConfirmVoucherRedemptionResponseDto,
    CreatePromotionDto,
    GenerateVoucherTokenDto,
    PromotionResponseDto,
    UpdatePromotionDto,
    VerifyVoucherDto,
    VoucherTokenResponseDto,
    VoucherVerificationResponseDto,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
    AddProductsToPromotionDto, ConfirmVoucherRedemptionDto,
    ConfirmVoucherRedemptionResponseDto, CreatePromotionDto, GenerateVoucherTokenDto, PromotionResponseDto, UpdatePromotionDto, VerifyVoucherDto, VoucherTokenResponseDto, VoucherVerificationResponseDto
};

// Alias for consistency with existing code
export type CreatePromotionDTO = CreatePromotionDto;
export type UpdatePromotionDTO = UpdatePromotionDto;

export interface GetPromotionsWithDetailsParams {
  onlyActive?: boolean; // Filter to only active promotions (default: false)
  skip?: number; // Number of records to skip for pagination (default: 0)
  take?: number; // Number of records to return (default: 10, max: 100)
  [key: string]: string | number | boolean | undefined;
}

export interface GetPromotionsByStoreParams {
  onlyActive?: boolean; // Filter to only active promotions (default: true)
  [key: string]: string | number | boolean | undefined;
}

// Response types for promotions with details
export interface PromotionWithDetailsDto extends PromotionResponseDto {
  products?: Array<{
    id: number;
    name: string;
    price: string;
    store: {
      id: number;
      name: string;
      verificationStatus: "UNVERIFIED" | "VERIFIED";
    };
  }>;
}

export interface PromotionsWithDetailsResponseDto {
  data: PromotionWithDetailsDto[];
  pagination: {
    skip: number;
    take: number;
    total: number;
  };
}

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

  /**
   * Consumer generates a one-time use voucher token for a specific promotion at a store
   * This token can be encoded into a QR code for the retailer to scan
   * Operation: PromotionController_generateVoucherToken
   * Endpoint: POST /promotions/voucher/generate
   * Role: CONSUMER only
   */
  generateVoucherToken: (data: GenerateVoucherTokenDto): Promise<VoucherTokenResponseDto> => {
    return getApiClient().post<VoucherTokenResponseDto>("/promotions/voucher/generate", data);
  },

  /**
   * Retailer scans and verifies the consumer's voucher QR code
   * Returns consumer information and marks voucher as verified
   * Operation: PromotionController_verifyVoucherToken
   * Endpoint: POST /promotions/voucher/verify
   * Role: RETAILER, ADMIN
   */
  verifyVoucherToken: (data: VerifyVoucherDto): Promise<VoucherVerificationResponseDto> => {
    return getApiClient().post<VoucherVerificationResponseDto>("/promotions/voucher/verify", data);
  },

  /**
   * Retailer confirms the voucher redemption after verification
   * Marks the voucher as redeemed and it becomes unusable
   * Operation: PromotionController_confirmVoucherRedemption
   * Endpoint: POST /promotions/voucher/confirm
   * Role: RETAILER, ADMIN
   */
  confirmVoucherRedemption: (data: ConfirmVoucherRedemptionDto): Promise<ConfirmVoucherRedemptionResponseDto> => {
    return getApiClient().post<ConfirmVoucherRedemptionResponseDto>("/promotions/voucher/confirm", data);
  },

  /**
   * Retrieves promotions with product and store details
   * Supports pagination and filtering by active status
   * Perfect for promotion discovery and deal browsing
   * Operation: PromotionController_getPromotionsWithDetails
   * Endpoint: GET /promotions/with-details
   * 
   * @param params - Optional query parameters for filtering and pagination
   */
  getPromotionsWithDetails: (
    params?: GetPromotionsWithDetailsParams
  ): Promise<PromotionsWithDetailsResponseDto> => {
    return getApiClient().get<PromotionsWithDetailsResponseDto>("/promotions/with-details", params);
  },

  /**
   * Retrieves all promotions that include products from the specified store with full product and store details
   * Useful for store detail pages showing available deals
   * Operation: PromotionController_getPromotionsByStore
   * Endpoint: GET /promotions/by-store/{storeId}
   * 
   * @param storeId - Store ID
   * @param params - Optional query parameters (onlyActive)
   */
  getPromotionsByStore: (
    storeId: number,
    params?: GetPromotionsByStoreParams
  ): Promise<PromotionWithDetailsDto[]> => {
    return getApiClient().get<PromotionWithDetailsDto[]>(
      `/promotions/by-store/${storeId}`,
      params
    );
  },
};

