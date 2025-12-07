/**
 * User API endpoints
 */

import { getApiClient } from "../client";

export interface User {
  id: number;
  name?: string;
  fullname?: string;
  email: string;
  role?: string;
  user_type?: string;
  imageUrl?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface FindUsersParams {
  name?: string;
  email?: string;
  skip?: number;
  take?: number;
  [key: string]: unknown;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  imageUrl?: string;
}

export const usersApi = {
  /**
   * Find all users
   */
  findUsers: (params?: FindUsersParams): Promise<User[]> => {
    return getApiClient().get<User[]>("/user", params);
  },

  /**
   * Find user by ID
   */
  findUserById: (userId: number): Promise<User> => {
    return getApiClient().get<User>(`/user/${userId}`);
  },

  /**
   * Update a user
   */
  updateUser: (userId: number, data: UpdateUserDTO): Promise<User> => {
    return getApiClient().patch<User>(`/user/${userId}`, data);
  },

  /**
   * Delete a user
   */
  deleteUser: (userId: number): Promise<{ success: boolean }> => {
    return getApiClient().delete<{ success: boolean }>(`/user/${userId}`);
  },

  /**
   * Approve retailer (admin)
   */
  approveRetailer: (userId: number): Promise<User> => {
    return getApiClient().patch<User>(`/user/${userId}/approve`);
  },
};

