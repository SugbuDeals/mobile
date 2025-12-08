/**
 * User API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - GET /user (operationId: UserController_findManyUsers)
 * - GET /user/{id} (operationId: UserController_findUniqueUser)
 * - PATCH /user/{id} (operationId: UserController_updateUser)
 * - DELETE /user/{id} (operationId: UserController_deleteUser)
 * - PATCH /user/{id}/approve (operationId: UserController_approveRetailer)
 */

import { getApiClient } from "../client";
import type {
  UserResponseDto,
  UpdateUserDTO,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
  UserResponseDto,
  UpdateUserDTO,
};

// Alias for backward compatibility
export type User = UserResponseDto;

export interface FindUsersParams {
  name?: string;
  email?: string;
  skip?: number;
  take?: number;
  [key: string]: string | number | boolean | undefined;
}

export const usersApi = {
  /**
   * Find all users with optional filters and pagination
   * Operation: UserController_findManyUsers
   * Endpoint: GET /user
   */
  findUsers: (params?: FindUsersParams): Promise<UserResponseDto[]> => {
    return getApiClient().get<UserResponseDto[]>("/user", params);
  },

  /**
   * Find user by ID (returns authenticated user's profile, ID parameter is ignored)
   * Returns UserResponseDto | null per server.json (status 200 with null body if not found)
   * Operation: UserController_findUniqueUser
   * Endpoint: GET /user/{id}
   */
  findUserById: (userId: number): Promise<UserResponseDto | null> => {
    return getApiClient()
      .get<UserResponseDto>(`/user/${userId}`)
      .catch((error) => {
        // Return null for 404 or 200 with null body
        if (error.status === 404 || error.status === 200) {
          return null;
        }
        throw error;
      });
  },

  /**
   * Update a user
   * Users can only update their own account. Admins can update any account.
   * Operation: UserController_updateUser
   * Endpoint: PATCH /user/{id}
   */
  updateUser: (userId: number, data: UpdateUserDTO): Promise<UserResponseDto> => {
    return getApiClient().patch<UserResponseDto>(`/user/${userId}`, data);
  },

  /**
   * Delete a user
   * Users can only delete their own account. Admins can delete any account.
   * Operation: UserController_deleteUser
   * Endpoint: DELETE /user/{id}
   */
  deleteUser: (userId: number): Promise<UserResponseDto> => {
    return getApiClient().delete<UserResponseDto>(`/user/${userId}`);
  },

  /**
   * Approve retailer (admin only)
   * Changes user's role to RETAILER
   * Operation: UserController_approveRetailer
   * Endpoint: PATCH /user/{id}/approve
   */
  approveRetailer: (userId: number): Promise<UserResponseDto> => {
    return getApiClient().patch<UserResponseDto>(`/user/${userId}/approve`);
  },
};

