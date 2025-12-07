/**
 * Category API endpoints
 */

import { getApiClient } from "../client";

/**
 * CategoryResponseDto matching server.json CategoryResponseDto
 */
export interface Category {
  id: number;
  name: string;
  createdAt: string; // ISO 8601 format date-time (required per server.json)
  updatedAt: string; // ISO 8601 format date-time (required per server.json)
}

export interface CreateCategoryDTO {
  name: string;
}

export interface UpdateCategoryDTO {
  name?: string;
}

export const categoriesApi = {
  /**
   * Find all categories
   */
  findCategories: (): Promise<Category[]> => {
    return getApiClient().get<Category[]>("/category");
  },

  /**
   * Find category by ID
   * Returns CategoryResponseDto | null per server.json (status 200 with null body if not found)
   */
  findCategoryById: (categoryId: number): Promise<Category | null> => {
    return getApiClient()
      .get<Category>(`/category/${categoryId}`)
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
   */
  createCategory: (data: CreateCategoryDTO): Promise<Category> => {
    return getApiClient().post<Category>("/category", data);
  },

  /**
   * Update a category (admin only)
   */
  updateCategory: (
    categoryId: number,
    data: UpdateCategoryDTO
  ): Promise<Category> => {
    return getApiClient().patch<Category>(`/category/${categoryId}`, data);
  },

  /**
   * Delete a category (admin only)
   * Returns CategoryResponseDto per server.json (not partial)
   */
  deleteCategory: (categoryId: number): Promise<Category> => {
    return getApiClient().delete<Category>(`/category/${categoryId}`);
  },
};

