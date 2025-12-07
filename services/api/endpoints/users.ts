/**
 * User API endpoints
 * Aligned with server.json UserResponseDto
 */

import { getApiClient } from "../client";
import type { UserResponseDto } from "./auth";

/**
 * User type alias for backward compatibility
 * @deprecated Use UserResponseDto instead
 */
export type User = UserResponseDto;

export interface FindUsersParams {
  name?: string;
  email?: string;
  skip?: number;
  take?: number;
  [key: string]: unknown;
}

/**
 * UpdateUserDTO matching server.json UpdateUserDTO
 */
export interface UpdateUserDTO {
  name?: string;
  email?: string;
  role?: "CONSUMER" | "RETAILER" | "ADMIN";
  imageUrl?: string | null; // Nullable per server.json
}

export const usersApi = {
  /**
   * Find all users
   * Returns UserResponseDto[] per server.json
   */
  findUsers: (params?: FindUsersParams): Promise<UserResponseDto[]> => {
    return getApiClient().get<UserResponseDto[]>("/user", params);
  },

  /**
   * Find user by ID
   * Returns UserResponseDto | null per server.json (status 200 with null body if not found)
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
   * Returns UserResponseDto per server.json
   */
  updateUser: (userId: number, data: UpdateUserDTO): Promise<UserResponseDto> => {
    return getApiClient().patch<UserResponseDto>(`/user/${userId}`, data);
  },

  /**
   * Delete a user
   * Returns UserResponseDto per server.json (not partial)
   */
  deleteUser: (userId: number): Promise<UserResponseDto> => {
    return getApiClient().delete<UserResponseDto>(`/user/${userId}`);
  },

  /**
   * Approve retailer (admin)
   * Returns UserResponseDto per server.json
   */
  approveRetailer: (userId: number): Promise<UserResponseDto> => {
    return getApiClient().patch<UserResponseDto>(`/user/${userId}/approve`);
  },
};

