/**
 * Product domain types
 * Uses Swagger-generated types from services/api/types/swagger
 */

import type {
  ProductResponseDto,
  CreateProductDTO,
  UpdateProductDTO,
  UpdateProductStatusDTO,
} from "@/services/api/types/swagger";

// Re-export Swagger types
export type {
  ProductResponseDto,
  CreateProductDTO,
  UpdateProductDTO,
  UpdateProductStatusDTO,
};

// Alias for backward compatibility
export type Product = ProductResponseDto;

