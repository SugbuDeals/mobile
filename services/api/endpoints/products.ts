/**
 * Product API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - GET /product (operationId: ProductController_findManyProducts)
 * - GET /product/{id} (operationId: ProductController_findUniqueProduct)
 * - POST /product (operationId: ProductController_createProduct)
 * - PATCH /product/{id} (operationId: ProductController_updateProduct)
 * - PATCH /product/{id}/admin-status (operationId: ProductController_updateProductAdminStatus)
 * - DELETE /product/{id} (operationId: ProductController_deleteProduct)
 */

import { getApiClient } from "../client";
import type {
    CreateProductDTO,
    ProductResponseDto,
    UpdateProductDTO,
    UpdateProductStatusDTO,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
    CreateProductDTO, ProductResponseDto, UpdateProductDTO,
    UpdateProductStatusDTO
};

export interface FindProductsParams {
  storeId?: number;
  isActive?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface GetProductsWithDetailsParams {
  storeId?: number;
  isActive?: boolean;
  includeStore?: boolean; // Include store details in response (default: false)
  includePromotions?: boolean; // Include promotions in response (default: false)
  skip?: number; // Number of records to skip for pagination (default: 0)
  take?: number; // Number of records to return (default: 10, max: 100)
  [key: string]: string | number | boolean | undefined;
}

export interface GetProductWithFullDetailsParams {
  includeStore?: boolean; // Include store details in response (default: false)
  includePromotions?: boolean; // Include promotions in response (default: false)
  [key: string]: string | number | boolean | undefined;
}

// Response types for products with details
export interface ProductWithDetailsDto extends ProductResponseDto {
  store?: {
    id: number;
    name: string;
    verificationStatus: "UNVERIFIED" | "VERIFIED";
    isActive: boolean;
  };
  promotions?: Array<{
    id: number;
    title: string;
    dealType: string;
    percentageOff?: number | null;
    fixedAmountOff?: number | null;
    active: boolean;
  }>;
}

export interface ProductsWithDetailsResponseDto {
  data: ProductWithDetailsDto[];
  pagination: {
    skip: number;
    take: number;
    total: number;
  };
}

export const productsApi = {
  /**
   * Find all products with optional filters
   * Operation: ProductController_findManyProducts
   * Endpoint: GET /product
   */
  findProducts: (params?: FindProductsParams): Promise<ProductResponseDto[]> => {
    return getApiClient().get<ProductResponseDto[]>("/product", params);
  },

  /**
   * Find product by ID
   * Returns ProductResponseDto | null per server.json (status 200 with null body if not found)
   * Operation: ProductController_findUniqueProduct
   * Endpoint: GET /product/{id}
   */
  findProductById: (productId: number): Promise<ProductResponseDto | null> => {
    return getApiClient()
      .get<ProductResponseDto>(`/product/${productId}`)
      .catch((error) => {
        // Return null for 404 or 200 with null body
        if (error.status === 404 || error.status === 200) {
          return null;
        }
        throw error;
      });
  },

  /**
   * Create a new product
   * Operation: ProductController_createProduct
   * Endpoint: POST /product
   */
  createProduct: (data: CreateProductDTO): Promise<ProductResponseDto> => {
    return getApiClient().post<ProductResponseDto>("/product", data);
  },

  /**
   * Update a product
   * Operation: ProductController_updateProduct
   * Endpoint: PATCH /product/{id}
   */
  updateProduct: (
    productId: number,
    data: UpdateProductDTO
  ): Promise<ProductResponseDto> => {
    return getApiClient().patch<ProductResponseDto>(`/product/${productId}`, data);
  },

  /**
   * Update product admin status (enable/disable)
   * Restricted to admins only
   * Operation: ProductController_updateProductAdminStatus
   * Endpoint: PATCH /product/{id}/admin-status
   */
  updateProductAdminStatus: (
    productId: number,
    data: UpdateProductStatusDTO
  ): Promise<ProductResponseDto> => {
    return getApiClient().patch<ProductResponseDto>(
      `/product/${productId}/admin-status`,
      data
    );
  },

  /**
   * Delete a product
   * Operation: ProductController_deleteProduct
   * Endpoint: DELETE /product/{id}
   */
  deleteProduct: (productId: number): Promise<ProductResponseDto> => {
    return getApiClient().delete<ProductResponseDto>(`/product/${productId}`);
  },

  /**
   * Retrieves products with optional store and promotion data
   * Supports pagination and filtering
   * Operation: ProductController_getProductsWithDetails
   * Endpoint: GET /product/with-details
   * 
   * @param params - Optional query parameters for filtering and pagination
   */
  getProductsWithDetails: (
    params?: GetProductsWithDetailsParams
  ): Promise<ProductsWithDetailsResponseDto> => {
    return getApiClient().get<ProductsWithDetailsResponseDto>("/product/with-details", params);
  },

  /**
   * Retrieves a product with optional store and promotion details
   * Perfect for product detail pages
   * Operation: ProductController_getProductWithFullDetails
   * Endpoint: GET /product/{id}/full
   * 
   * @param productId - Product ID
   * @param params - Optional query parameters to control which data is included
   */
  getProductWithFullDetails: (
    productId: number,
    params?: GetProductWithFullDetailsParams
  ): Promise<ProductWithDetailsDto> => {
    return getApiClient().get<ProductWithDetailsDto>(`/product/${productId}/full`, params);
  },
};

