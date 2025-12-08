/**
 * Catalog domain types
 * Uses Swagger-generated types from services/api/types/swagger
 */

import type {
  CategoryResponseDto,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  ProductResponseDto,
} from "@/services/api/types/swagger";

// Re-export Swagger types
export type {
  CategoryResponseDto,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  ProductResponseDto,
};

// Aliases for backward compatibility
export type Category = CategoryResponseDto;
export type Product = ProductResponseDto;

