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
    CreateStoreDTO,
    ManageStoreStatusDTO,
    StoreResponseDto,
    StoreWithDistanceResponseDto,
    UpdateStoreDTO,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
    CreateStoreDTO, ManageStoreStatusDTO, StoreResponseDto,
    StoreWithDistanceResponseDto, UpdateStoreDTO
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

export interface GetStoreWithFullDetailsParams {
  includeProducts?: boolean; // Include products in the response (default: true)
  includePromotions?: boolean; // Include promotions for each product (default: true)
  onlyActivePromotions?: boolean; // Filter to only active promotions (default: true)
  [key: string]: string | number | boolean | undefined;
}

// Response types for stores with full details
export interface StoreWithFullDetailsDto extends StoreResponseDto {
  products?: Array<{
    id: number;
    name: string;
    price: string;
    stock: number;
    isActive: boolean;
    promotions?: Array<{
      id: number;
      title: string;
      dealType: string;
      percentageOff?: number | null;
      active: boolean;
    }>;
  }>;
}

export interface NearbyStoreWithPromotionsDto {
  stores: Array<StoreWithDistanceResponseDto>;
  promotions: Array<{
    id: number;
    title: string;
    dealType: string;
    percentageOff?: number | null;
    active: boolean;
    products: Array<{
      id: number;
      name: string;
      price: string;
      store: {
        id: number;
        name: string;
      };
    }>;
  }>;
  searchParams: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
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
    const queryParams: {
      latitude: number;
      longitude: number;
      radius?: number;
    } = {
      latitude: params.latitude,
      longitude: params.longitude,
    };
    
    // Always include radius to avoid backend default of 10km
    // Prefer radiusKm, fallback to radius, or default to 1km (BASIC tier limit)
    if (params.radiusKm !== undefined) {
      queryParams.radius = params.radiusKm;
    } else if (params.radius !== undefined) {
      queryParams.radius = params.radius;
    } else {
      // Default to 1km (BASIC tier limit) if not provided
      queryParams.radius = 1;
    }
    
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

  /**
   * Retrieves a store with all its products and their active promotions
   * Use query parameters to control which data is included for optimal performance
   * Perfect for store detail pages
   * Operation: StoreController_getStoreWithProductsAndPromotions
   * Endpoint: GET /store/{id}/full
   * 
   * @param storeId - Store ID
   * @param params - Optional query parameters to control which data is included
   */
  getStoreWithFullDetails: (
    storeId: number,
    params?: GetStoreWithFullDetailsParams
  ): Promise<StoreWithFullDetailsDto> => {
    return getApiClient().get<StoreWithFullDetailsDto>(`/store/${storeId}/full`, params);
  },

  /**
   * Returns stores within a specified radius with their active promotions
   * Perfect for location-based deal discovery
   * Operation: StoreController_findNearbyWithPromotions
   * Endpoint: GET /store/nearby-with-promotions
   * 
   * @param params - Location parameters (latitude, longitude, radius)
   */
  findNearbyStoresWithPromotions: (
    params: FindNearbyStoresParams
  ): Promise<NearbyStoreWithPromotionsDto> => {
    const queryParams: {
      latitude: number;
      longitude: number;
      radius?: number;
    } = {
      latitude: params.latitude,
      longitude: params.longitude,
    };
    
    // Always include radius to avoid backend default of 10km
    // Prefer radiusKm, fallback to radius, or default to 1km (BASIC tier limit)
    if (params.radiusKm !== undefined) {
      queryParams.radius = params.radiusKm;
    } else if (params.radius !== undefined) {
      queryParams.radius = params.radius;
    } else {
      // Default to 1km (BASIC tier limit) if not provided
      queryParams.radius = 1;
    }
    
    return getApiClient().get<NearbyStoreWithPromotionsDto>(
      "/store/nearby-with-promotions",
      queryParams
    );
  },
};

