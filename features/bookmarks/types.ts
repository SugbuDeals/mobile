/**
 * Bookmark domain types
 * Uses Swagger-generated types from services/api/types/swagger
 */

import type {
  StoreBookmarkResponseDto,
  ProductBookmarkResponseDto,
  ListBookmarksDto,
} from "@/services/api/types/swagger";

// Re-export Swagger types
export type {
  StoreBookmarkResponseDto,
  ProductBookmarkResponseDto,
  ListBookmarksDto,
};

// Internal state types (simplified for UI)
export type BookmarkedStore = {
  storeId: number;
  name?: string;
};

export type BookmarkedProduct = {
  productId: number;
  name?: string;
};

// Alias for backward compatibility
export type ListBookmarksPayload = ListBookmarksDto;

export type BookmarksState = {
  stores: BookmarkedStore[];
  products: BookmarkedProduct[];
  loading: boolean;
  error: string | null;
};


