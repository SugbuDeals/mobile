/**
 * Promotion domain types
 * Uses Swagger-generated types from services/api/types/swagger
 */

import type {
  PromotionResponseDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  DealType,
} from "@/services/api/types/swagger";

// Re-export Swagger types
export type {
  PromotionResponseDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  DealType,
};

// Aliases for backward compatibility
export type Promotion = PromotionResponseDto;
// CreatePromotionDTO with backward compatibility for productId and old type/discount fields
export type CreatePromotionDTO = CreatePromotionDto & {
  productId?: number; // Legacy field, will be converted to productIds array
  type?: string; // Legacy field for backward compatibility
  discount?: number; // Legacy field for backward compatibility
};
export type UpdatePromotionDTO = UpdatePromotionDto;

