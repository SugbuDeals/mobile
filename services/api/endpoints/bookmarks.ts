/**
 * Bookmark API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - POST /bookmarks/stores/list (operationId: BookmarkController_listMyStoreBookmarks)
 * - POST /bookmarks/stores (operationId: BookmarkController_bookmarkStore)
 * - DELETE /bookmarks/stores (operationId: BookmarkController_unbookmarkStore)
 * - POST /bookmarks/products/list (operationId: BookmarkController_listMyProductBookmarks)
 * - POST /bookmarks/products (operationId: BookmarkController_bookmarkProduct)
 * - DELETE /bookmarks/products (operationId: BookmarkController_unbookmarkProduct)
 */

import { getApiClient } from "../client";
import type {
  StoreBookmarkResponseDto,
  ProductBookmarkResponseDto,
  StoreBookmarkDto,
  ProductBookmarkDto,
  ListBookmarksDto,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
  StoreBookmarkResponseDto,
  ProductBookmarkResponseDto,
  StoreBookmarkDto,
  ProductBookmarkDto,
  ListBookmarksDto,
};

// Aliases for backward compatibility
export type StoreBookmark = StoreBookmarkResponseDto;
export type ProductBookmark = ProductBookmarkResponseDto;

export const bookmarksApi = {
  /**
   * List store bookmarks for authenticated user
   * Operation: BookmarkController_listMyStoreBookmarks
   * Endpoint: POST /bookmarks/stores/list
   */
  listStoreBookmarks: (
    params: ListBookmarksDto
  ): Promise<StoreBookmarkResponseDto[]> => {
    return getApiClient().post<StoreBookmarkResponseDto[]>(
      "/bookmarks/stores/list",
      params
    );
  },

  /**
   * Bookmark a store
   * Operation: BookmarkController_bookmarkStore
   * Endpoint: POST /bookmarks/stores
   */
  bookmarkStore: (data: StoreBookmarkDto): Promise<StoreBookmarkResponseDto> => {
    return getApiClient().post<StoreBookmarkResponseDto>("/bookmarks/stores", data);
  },

  /**
   * Unbookmark a store
   * Operation: BookmarkController_unbookmarkStore
   * Endpoint: DELETE /bookmarks/stores
   */
  unbookmarkStore: (
    data: StoreBookmarkDto
  ): Promise<StoreBookmarkResponseDto> => {
    const client = getApiClient();
    // DELETE with body - use request method directly
    return client.request<StoreBookmarkResponseDto>(
      "/bookmarks/stores",
      {
        method: "DELETE",
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * List product bookmarks for authenticated user
   * Operation: BookmarkController_listMyProductBookmarks
   * Endpoint: POST /bookmarks/products/list
   */
  listProductBookmarks: (
    params: ListBookmarksDto
  ): Promise<ProductBookmarkResponseDto[]> => {
    return getApiClient().post<ProductBookmarkResponseDto[]>(
      "/bookmarks/products/list",
      params
    );
  },

  /**
   * Bookmark a product
   * Operation: BookmarkController_bookmarkProduct
   * Endpoint: POST /bookmarks/products
   */
  bookmarkProduct: (data: ProductBookmarkDto): Promise<ProductBookmarkResponseDto> => {
    return getApiClient().post<ProductBookmarkResponseDto>("/bookmarks/products", data);
  },

  /**
   * Unbookmark a product
   * Operation: BookmarkController_unbookmarkProduct
   * Endpoint: DELETE /bookmarks/products
   */
  unbookmarkProduct: (
    data: ProductBookmarkDto
  ): Promise<ProductBookmarkResponseDto> => {
    const client = getApiClient();
    // DELETE with body - use request method directly
    return client.request<ProductBookmarkResponseDto>(
      "/bookmarks/products",
      {
        method: "DELETE",
        body: JSON.stringify(data),
      }
    );
  },
};

