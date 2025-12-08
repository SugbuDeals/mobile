/**
 * Store domain types
 * Uses Swagger-generated types from services/api/types/swagger
 */

import type {
  StoreResponseDto,
  StoreWithDistanceResponseDto,
  CreateStoreDTO,
  UpdateStoreDTO,
  ManageStoreStatusDTO,
} from "@/services/api/types/swagger";

// Re-export Swagger types
export type {
  StoreResponseDto,
  StoreWithDistanceResponseDto,
  CreateStoreDTO,
  UpdateStoreDTO,
  ManageStoreStatusDTO,
};

// Alias for backward compatibility
export type Store = StoreResponseDto;

