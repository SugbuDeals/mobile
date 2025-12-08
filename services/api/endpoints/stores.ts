/**
 * Store API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - GET /store (operationId: StoreController_findManyStores)
 * - GET /store/nearby (operationId: StoreController_findNearby)
 * - GET /store/{id} (operationId: StoreController_findUniqueStore)
 * - POST /store (operationId: StoreController_createStore)
 * - PATCH /store/{id} (operationId: StoreController_updateStore)
 * - PATCH /store/{id}/admin-status (operationId: StoreController_updateStoreAdminStatus)
 * - DELETE /store/{id} (operationId: StoreController_deleteStore)
 */

import { getApiClient } from "../client";
import type {
  StoreResponseDto,
  StoreWithDistanceResponseDto,
  CreateStoreDTO,
  UpdateStoreDTO,
  ManageStoreStatusDTO,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
  StoreResponseDto,
  StoreWithDistanceResponseDto,
  CreateStoreDTO,
  UpdateStoreDTO,
  ManageStoreStatusDTO,
};

export interface FindStoresParams {
  skip?: number;
  take?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface FindNearbyStoresParams {
  latitude: number;
  longitude: number;
  radius?: number;
  radiusKm?: number;
}

export const storesApi = {
  /**
   * Find all stores with optional search and pagination
   * Operation: StoreController_findManyStores
   * Endpoint: GET /store
   */
  findStores: (params?: FindStoresParams): Promise<StoreResponseDto[]> => {
    return getApiClient().get<StoreResponseDto[]>("/store", params);
  },

  /**
   * Find nearby stores within specified radius
   * Returns stores with distance field in kilometers
   * Operation: StoreController_findNearby
   * Endpoint: GET /store/nearby
   */
  findNearbyStores: (
    params: FindNearbyStoresParams
  ): Promise<StoreWithDistanceResponseDto[]> => {
    const queryParams = {
      latitude: params.latitude,
      longitude: params.longitude,
      ...(params.radiusKm && { radius: params.radiusKm }),
      ...(params.radius && { radius: params.radius }), // Fallback for radius
    };
    return getApiClient().get<StoreWithDistanceResponseDto[]>("/store/nearby", queryParams);
  },

  /**
   * Find store by ID
   * Returns StoreResponseDto | null per server.json (status 200 with null body if not found)
   * Operation: StoreController_findUniqueStore
   * Endpoint: GET /store/{id}
   */
  findStoreById: (storeId: number): Promise<StoreResponseDto | null> => {
    return getApiClient()
      .get<StoreResponseDto>(`/store/${storeId}`)
      .catch((error) => {
        // Return null for 404 or 200 with null body
        if (error.status === 404 || error.status === 200) {
          return null;
        }
        throw error;
      });
  },

  /**
   * Create a new store
   * Operation: StoreController_createStore
   * Endpoint: POST /store
   */
  createStore: (data: CreateStoreDTO): Promise<StoreResponseDto> => {
    return getApiClient().post<StoreResponseDto>("/store", data);
  },

  /**
   * Update a store
   * Operation: StoreController_updateStore
   * Endpoint: PATCH /store/{id}
   */
  updateStore: (
    storeId: number,
    data: UpdateStoreDTO
  ): Promise<StoreResponseDto> => {
    return getApiClient().patch<StoreResponseDto>(`/store/${storeId}`, data);
  },

  /**
   * Update store admin status (verification and active status)
   * Restricted to admins only
   * Operation: StoreController_updateStoreAdminStatus
   * Endpoint: PATCH /store/{id}/admin-status
   */
  updateStoreAdminStatus: (
    storeId: number,
    data: ManageStoreStatusDTO
  ): Promise<StoreResponseDto> => {
    return getApiClient().patch<StoreResponseDto>(
      `/store/${storeId}/admin-status`,
      data
    );
  },

  /**
   * Delete a store
   * Operation: StoreController_deleteStore
   * Endpoint: DELETE /store/{id}
   */
  deleteStore: (storeId: number): Promise<StoreResponseDto> => {
    return getApiClient().delete<StoreResponseDto>(`/store/${storeId}`);
  },
};

