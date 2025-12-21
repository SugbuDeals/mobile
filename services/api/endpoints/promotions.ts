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
    VoucherClaimStatusDto,
    VoucherTokenResponseDto,
    VoucherVerificationResponseDto,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
    AddProductsToPromotionDto, ConfirmVoucherRedemptionDto, VoucherClaimStatusDto,
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
   * Check if the consumer has already redeemed (claimed) a voucher from a specific store
   * Only vouchers with REDEEMED status count as "claimed"
   * Vouchers with PENDING or VERIFIED status do NOT count as claimed
   * Used to show UI indicators before attempting to generate a new voucher
   * Operation: PromotionController_checkVoucherClaimStatus
   * Endpoint: GET /promotions/voucher/check/{storeId}
   * Role: CONSUMER only
   * 
   * @note If the endpoint returns 404 (not implemented yet), returns default response with hasClaimed: false
   * This allows graceful degradation until the backend implements the endpoint
   */
  checkVoucherClaimStatus: (storeId: number): Promise<VoucherClaimStatusDto> => {
    return getApiClient()
      .get<VoucherClaimStatusDto>(`/promotions/voucher/check/${storeId}`)
      .catch((error) => {
        // If endpoint doesn't exist (404), return default response
        // This is expected until backend implements the endpoint
        if (error.status === 404 || error?.response?.status === 404) {
          return {
            hasClaimed: false,
            redemptionId: null,
            status: null,
            storeId: storeId,
          } as VoucherClaimStatusDto;
        }
        // Re-throw other errors
        throw error;
      });
  },

  /**
   * Consumer generates a one-time use voucher token for a specific promotion at a store.
   * This token can be encoded into a QR code for the retailer to scan.
   * Restricted to consumers.
   * 
   * Operation: PromotionController_generateVoucherToken
   * Endpoint: POST /promotions/voucher/generate
   * Role: CONSUMER only
   * 
   * @important Each consumer can only REDEEM one voucher per store. Consumers can generate multiple
   * vouchers (PENDING/VERIFIED status), but once a voucher is REDEEMED (retailer confirmed),
   * they cannot generate another voucher for that store. Attempting to generate a voucher when
   * a REDEEMED voucher exists will result in a 400 error.
   */
  generateVoucherToken: (data: GenerateVoucherTokenDto): Promise<VoucherTokenResponseDto> => {
    return getApiClient().post<VoucherTokenResponseDto>("/promotions/voucher/generate", data);
  },

  /**
   * Retailer scans and verifies the consumer's voucher QR code.
   * Returns consumer information and marks voucher as verified.
   * Restricted to retailers and admins.
   * 
   * Operation: PromotionController_verifyVoucherToken
   * Endpoint: POST /promotions/voucher/verify
   * Role: RETAILER, ADMIN
   */
  verifyVoucherToken: (data: VerifyVoucherDto): Promise<VoucherVerificationResponseDto> => {
    return getApiClient().post<VoucherVerificationResponseDto>("/promotions/voucher/verify", data);
  },

  /**
   * Retailer confirms the voucher redemption after verification.
   * Marks the voucher as redeemed and it becomes unusable.
   * Each voucher can only be used for one product (selected by consumer when generating the token).
   * Voucher must be verified first.
   * Restricted to retailers and admins.
   * 
   * Operation: PromotionController_confirmVoucherRedemption
   * Endpoint: POST /promotions/voucher/confirm
   * Role: RETAILER, ADMIN
   */
  confirmVoucherRedemption: (data: ConfirmVoucherRedemptionDto): Promise<ConfirmVoucherRedemptionResponseDto> => {
    return getApiClient().post<ConfirmVoucherRedemptionResponseDto>("/promotions/voucher/confirm", data);
  },

  /**
   * Enhanced voucher redemption confirmation that ensures voucher quantity is decremented
   * This method confirms the redemption and returns the updated promotion with decremented voucherQuantity
   * If the backend doesn't return the updated promotion, it fetches it separately using the promotionId
   * Operation: Enhanced wrapper around PromotionController_confirmVoucherRedemption
   * Endpoint: POST /promotions/voucher/confirm (with promotion fetch fallback)
   * Role: RETAILER, ADMIN
   * 
   * @param data - Voucher confirmation data
   * @param promotionId - Optional promotion ID. If provided and backend doesn't return updated promotion, 
   *                      this will be used to fetch the updated promotion separately.
   */
  confirmVoucherRedemptionWithUpdate: async (
    data: ConfirmVoucherRedemptionDto,
    promotionId?: number
  ): Promise<ConfirmVoucherRedemptionResponseDto & { promotion?: PromotionResponseDto }> => {
    // First, confirm the redemption
    const confirmationResult = await getApiClient().post<ConfirmVoucherRedemptionResponseDto>(
      "/promotions/voucher/confirm",
      data
    );

    // If the backend already returns the updated promotion, use it
    if (confirmationResult.promotion) {
      return confirmationResult;
    }

    // If promotionId is provided and backend didn't return the promotion, fetch it separately
    if (promotionId) {
      try {
        const updatedPromotion = await getApiClient().get<PromotionResponseDto>(
          `/promotions/${promotionId}`
        );
        return {
          ...confirmationResult,
          promotion: updatedPromotion,
        };
      } catch (error) {
        console.warn("Failed to fetch updated promotion after redemption:", error);
        // Return confirmation result without promotion if fetch fails
        return confirmationResult;
      }
    }

    // Return confirmation result (promotion will be undefined if not provided by backend and no promotionId given)
    return confirmationResult;
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

