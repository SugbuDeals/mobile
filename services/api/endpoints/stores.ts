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
  address?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  bannerUrl?: string;
}

export interface UpdateStoreDTO {
  name?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  bannerUrl?: string;
}

export interface ManageStoreStatusDTO {
  isActive?: boolean;
  verificationStatus?: string;
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
   */
  findNearbyStores: (
    params: FindNearbyStoresParams
  ): Promise<Store[]> => {
    const queryParams = {
      latitude: params.latitude,
      longitude: params.longitude,
      ...(params.radius && { radius: params.radius }),
      ...(params.radiusKm && { radius: params.radiusKm }),
    };
    return getApiClient().get<Store[]>("/store/nearby", queryParams);
  },

  /**
   * Find store by ID
   */
  findStoreById: (storeId: number): Promise<Store> => {
    return getApiClient().get<Store>(`/store/${storeId}`);
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
   */
  deleteStore: (storeId: number): Promise<{ id: number }> => {
    return getApiClient().delete<{ id: number }>(`/store/${storeId}`);
  },
};

