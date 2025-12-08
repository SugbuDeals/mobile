/**
 * Category API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - GET /category (operationId: CategoryController_findManyCategories)
 * - GET /category/{id} (operationId: CategoryController_findUniqueCategory)
 * - POST /category (operationId: CategoryController_createCategory)
 * - PATCH /category/{id} (operationId: CategoryController_updateCategory)
 * - DELETE /category/{id} (operationId: CategoryController_deleteCategory)
 */

import { getApiClient } from "../client";
import type {
  CategoryResponseDto,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
  CategoryResponseDto,
  CreateCategoryDTO,
  UpdateCategoryDTO,
};

// Alias for backward compatibility
export type Category = CategoryResponseDto;

export const categoriesApi = {
  /**
   * Find all categories
   * Operation: CategoryController_findManyCategories
   * Endpoint: GET /category
   */
  findCategories: (): Promise<CategoryResponseDto[]> => {
    return getApiClient().get<CategoryResponseDto[]>("/category");
  },

  /**
   * Find category by ID
   * Returns CategoryResponseDto | null per server.json (status 200 with null body if not found)
   * Operation: CategoryController_findUniqueCategory
   * Endpoint: GET /category/{id}
   */
  findCategoryById: (categoryId: number): Promise<CategoryResponseDto | null> => {
    return getApiClient()
      .get<CategoryResponseDto>(`/category/${categoryId}`)
      .catch((error) => {
        // Return null for 404 or 200 with null body
        if (error.status === 404 || error.status === 200) {
          return null;
        }
        throw error;
      });
  },

  /**
   * Create a new category (admin only)
   * Operation: CategoryController_createCategory
   * Endpoint: POST /category
   */
  createCategory: (data: CreateCategoryDTO): Promise<CategoryResponseDto> => {
    return getApiClient().post<CategoryResponseDto>("/category", data);
  },

  /**
   * Update a category (admin only)
   * Operation: CategoryController_updateCategory
   * Endpoint: PATCH /category/{id}
   */
  updateCategory: (
    categoryId: number,
    data: UpdateCategoryDTO
  ): Promise<CategoryResponseDto> => {
    return getApiClient().patch<CategoryResponseDto>(`/category/${categoryId}`, data);
  },

  /**
   * Delete a category (admin only)
   * Operation: CategoryController_deleteCategory
   * Endpoint: DELETE /category/{id}
   */
  deleteCategory: (categoryId: number): Promise<CategoryResponseDto> => {
    return getApiClient().delete<CategoryResponseDto>(`/category/${categoryId}`);
  },
};

