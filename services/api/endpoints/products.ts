/**
 * Product API endpoints
 */

import { getApiClient } from "../client";
import type { Product } from "@/features/store/types";

export interface FindProductsParams {
  storeId?: number;
  isActive?: boolean;
  skip?: number;
  take?: number;
  search?: string;
  [key: string]: unknown;
}

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  stock: number;
  storeId: number;
  categoryId?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateProductStatusDTO {
  isActive: boolean;
}

export const productsApi = {
  /**
   * Find all products
   */
  findProducts: (params?: FindProductsParams): Promise<Product[]> => {
    return getApiClient().get<Product[]>("/product", params);
  },

  /**
   * Find product by ID
   */
  findProductById: (productId: number): Promise<Product> => {
    return getApiClient().get<Product>(`/product/${productId}`);
  },

  /**
   * Create a new product
   */
  createProduct: (data: CreateProductDTO): Promise<Product> => {
    return getApiClient().post<Product>("/product", data);
  },

  /**
   * Update a product
   */
  updateProduct: (
    productId: number,
    data: UpdateProductDTO
  ): Promise<Product> => {
    return getApiClient().patch<Product>(`/product/${productId}`, data);
  },

  /**
   * Update product admin status
   */
  updateProductAdminStatus: (
    productId: number,
    data: UpdateProductStatusDTO
  ): Promise<Product> => {
    return getApiClient().patch<Product>(
      `/product/${productId}/admin-status`,
      data
    );
  },

  /**
   * Delete a product
   */
  deleteProduct: (productId: number): Promise<{ id: number }> => {
    return getApiClient().delete<{ id: number }>(`/product/${productId}`);
  },
};

