/**
 * Store API endpoints
 */

import { getApiClient } from "../client";
import type { Store } from "@/features/store/types";

export interface FindStoresParams {
  skip?: number;
  take?: number;
  search?: string;
  isActive?: boolean;
  verificationStatus?: string;
  [key: string]: unknown;
}

export interface FindNearbyStoresParams {
  latitude: number;
  longitude: number;
  radius?: number;
  radiusKm?: number;
}

export interface CreateStoreDTO {
  name: string;
  description: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  ownerId?: number;
  imageUrl?: string;
  bannerUrl?: string;
  isActive?: boolean;
}

export interface UpdateStoreDTO {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  ownerId?: number;
  imageUrl?: string;
  bannerUrl?: string;
  verificationStatus?: "UNVERIFIED" | "VERIFIED";
  isActive?: boolean;
}

/**
 * ManageStoreStatusDTO matching server.json ManageStoreStatusDTO
 */
export interface ManageStoreStatusDTO {
  verificationStatus?: "UNVERIFIED" | "VERIFIED";
  isActive?: boolean;
}

export const storesApi = {
  /**
   * Find all stores
   */
  findStores: (params?: FindStoresParams): Promise<Store[]> => {
    return getApiClient().get<Store[]>("/store", params);
  },

  /**
   * Find nearby stores
   * Returns StoreWithDistanceResponseDto[] per server.json (includes distance field)
   */
  findNearbyStores: (
    params: FindNearbyStoresParams
  ): Promise<Store[]> => {
    const queryParams = {
      latitude: params.latitude,
      longitude: params.longitude,
      ...(params.radiusKm && { radius: params.radiusKm }),
      ...(params.radius && { radius: params.radius }), // Fallback for radius
    };
    return getApiClient().get<Store[]>("/store/nearby", queryParams);
  },

  /**
   * Find store by ID
   * Returns StoreResponseDto | null per server.json (status 200 with null body if not found)
   */
  findStoreById: (storeId: number): Promise<Store | null> => {
    return getApiClient()
      .get<Store>(`/store/${storeId}`)
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
   */
  createStore: (data: CreateStoreDTO): Promise<Store> => {
    return getApiClient().post<Store>("/store", data);
  },

  /**
   * Update a store
   */
  updateStore: (
    storeId: number,
    data: UpdateStoreDTO
  ): Promise<Store> => {
    return getApiClient().patch<Store>(`/store/${storeId}`, data);
  },

  /**
   * Update store admin status
   */
  updateStoreAdminStatus: (
    storeId: number,
    data: ManageStoreStatusDTO
  ): Promise<Store> => {
    return getApiClient().patch<Store>(
      `/store/${storeId}/admin-status`,
      data
    );
  },

  /**
   * Delete a store
   * Returns StoreResponseDto per server.json (not partial)
   */
  deleteStore: (storeId: number): Promise<Store> => {
    return getApiClient().delete<Store>(`/store/${storeId}`);
  },
};

