/**
 * Bookmark API endpoints
 */

import { getApiClient } from "../client";

export interface StoreBookmarkDto {
  storeId: number;
}

export interface ProductBookmarkDto {
  productId: number;
}

export interface ListBookmarksDto {
  take?: number;
  skip?: number;
}

/**
 * StoreBookmarkResponseDto matching server.json StoreBookmarkResponseDto
 */
export interface StoreBookmark {
  id: number;
  userId: number;
  storeId: number;
  createdAt: string; // ISO 8601 format date-time (required per server.json)
  store?: import("@/features/store/types").Store; // Nested StoreResponseDto per server.json
}

/**
 * ProductBookmarkResponseDto matching server.json ProductBookmarkResponseDto
 */
export interface ProductBookmark {
  id: number;
  userId: number;
  productId: number;
  createdAt: string; // ISO 8601 format date-time (required per server.json)
  product?: import("@/features/store/types").Product; // Nested ProductResponseDto per server.json
}

export const bookmarksApi = {
  /**
   * List store bookmarks (POST method per schema)
   */
  listStoreBookmarks: (
    params: ListBookmarksDto
  ): Promise<StoreBookmark[]> => {
    return getApiClient().post<StoreBookmark[]>(
      "/bookmarks/stores/list",
      params
    );
  },

  /**
   * Bookmark a store
   */
  bookmarkStore: (data: StoreBookmarkDto): Promise<StoreBookmark> => {
    return getApiClient().post<StoreBookmark>("/bookmarks/stores", data);
  },

  /**
   * Unbookmark a store
   * Returns StoreBookmarkResponseDto per server.json (not partial)
   */
  unbookmarkStore: (
    data: StoreBookmarkDto
  ): Promise<StoreBookmark> => {
    const client = getApiClient();
    // DELETE with body - use request method directly
    return client.request<StoreBookmark>(
      "/bookmarks/stores",
      {
        method: "DELETE",
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * List product bookmarks (POST method per schema)
   */
  listProductBookmarks: (
    params: ListBookmarksDto
  ): Promise<ProductBookmark[]> => {
    return getApiClient().post<ProductBookmark[]>(
      "/bookmarks/products/list",
      params
    );
  },

  /**
   * Bookmark a product
   */
  bookmarkProduct: (data: ProductBookmarkDto): Promise<ProductBookmark> => {
    return getApiClient().post<ProductBookmark>("/bookmarks/products", data);
  },

  /**
   * Unbookmark a product
   * Returns ProductBookmarkResponseDto per server.json (not partial)
   */
  unbookmarkProduct: (
    data: ProductBookmarkDto
  ): Promise<ProductBookmark> => {
    const client = getApiClient();
    // DELETE with body - use request method directly
    return client.request<ProductBookmark>(
      "/bookmarks/products",
      {
        method: "DELETE",
        body: JSON.stringify(data),
      }
    );
  },
};

