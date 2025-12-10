/**
 * Promotion domain types
 * Uses Swagger-generated types from services/api/types/swagger
 */

import type {
  PromotionResponseDto,
  CreatePromotionDto,
  UpdatePromotionDto,
} from "@/services/api/types/swagger";

// Re-export Swagger types
export type {
  PromotionResponseDto,
  CreatePromotionDto,
  UpdatePromotionDto,
};

// Aliases for backward compatibility
export type Promotion = PromotionResponseDto;
// CreatePromotionDTO with backward compatibility for productId
export type CreatePromotionDTO = CreatePromotionDto & {
  productId?: number; // Legacy field, will be converted to productIds array
};
export type UpdatePromotionDTO = UpdatePromotionDto;

