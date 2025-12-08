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
export type CreatePromotionDTO = CreatePromotionDto;
export type UpdatePromotionDTO = UpdatePromotionDto;

