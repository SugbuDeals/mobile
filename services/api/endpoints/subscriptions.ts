/**
 * Subscription API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - GET /subscription (operationId: SubscriptionController_findManySubscriptions)
 * - GET /subscription/{id} (operationId: SubscriptionController_findUniqueSubscription)
 * - GET /subscription/user/{userId}/active (operationId: SubscriptionController_getActiveSubscription)
 * - GET /subscription/admin/analytics (operationId: SubscriptionController_getAnalytics)
 * - POST /subscription (operationId: SubscriptionController_createSubscription)
 * - POST /subscription/retailer/join (operationId: SubscriptionController_joinSubscription)
 * - POST /subscription/retailer/cancel (operationId: SubscriptionController_cancelRetailerSubscription)
 * - PATCH /subscription/{id} (operationId: SubscriptionController_updateSubscription)
 * - PATCH /subscription/retailer/update (operationId: SubscriptionController_updateRetailerSubscription)
 * - DELETE /subscription/{id} (operationId: SubscriptionController_deleteSubscription)
 */

import { getApiClient } from "../client";
import type {
  SubscriptionResponseDto,
  UserSubscriptionResponseDto,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  JoinSubscriptionDTO,
  UpdateRetailerSubscriptionDTO,
  SubscriptionAnalyticsDTO,
  SubscriptionPlan,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
  SubscriptionResponseDto,
  UserSubscriptionResponseDto,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  JoinSubscriptionDTO,
  UpdateRetailerSubscriptionDTO,
  SubscriptionAnalyticsDTO,
  SubscriptionPlan,
};

// Aliases for backward compatibility
export type Subscription = SubscriptionResponseDto;
export type UserSubscription = UserSubscriptionResponseDto;
export type SubscriptionAnalytics = SubscriptionAnalyticsDTO;

export interface FindSubscriptionsParams {
  plan?: SubscriptionPlan;
  isActive?: boolean;
  search?: string;
  skip?: number;
  take?: number;
  [key: string]: string | number | boolean | undefined;
}

export const subscriptionsApi = {
  /**
   * Find all subscriptions with optional filters and pagination
   * Operation: SubscriptionController_findManySubscriptions
   * Endpoint: GET /subscription
   */
  findSubscriptions: (
    params?: FindSubscriptionsParams
  ): Promise<SubscriptionResponseDto[]> => {
    return getApiClient().get<SubscriptionResponseDto[]>("/subscription", params);
  },

  /**
   * Find subscription by ID
   * Returns SubscriptionResponseDto | null per server.json (status 200 with null body if not found)
   * Operation: SubscriptionController_findUniqueSubscription
   * Endpoint: GET /subscription/{id}
   */
  findSubscriptionById: (subscriptionId: number): Promise<SubscriptionResponseDto | null> => {
    return getApiClient()
      .get<SubscriptionResponseDto>(`/subscription/${subscriptionId}`)
      .catch((error) => {
        // Return null for 404 or 200 with null body
        if (error.status === 404 || error.status === 200) {
          return null;
        }
        throw error;
      });
  },

  /**
   * Get active subscription for a user
   * Returns UserSubscriptionResponseDto | null per server.json (status 200 with null body if not found)
   * Operation: SubscriptionController_getActiveSubscription
   * Endpoint: GET /subscription/user/{userId}/active
   */
  getActiveSubscription: (userId: number): Promise<UserSubscriptionResponseDto | null> => {
    return getApiClient()
      .get<UserSubscriptionResponseDto>(`/subscription/user/${userId}/active`)
      .catch((error) => {
        // Return null for 404 (no active subscription) or 200 with null body
        if (error.status === 404 || error.status === 200) {
          return null;
        }
        throw error;
      });
  },

  /**
   * Join a subscription (retailer only)
   * Operation: SubscriptionController_joinSubscription
   * Endpoint: POST /subscription/retailer/join
   */
  joinSubscription: (data: JoinSubscriptionDTO): Promise<UserSubscriptionResponseDto> => {
    return getApiClient().post<UserSubscriptionResponseDto>(
      "/subscription/retailer/join",
      data
    );
  },

  /**
   * Update retailer subscription
   * Operation: SubscriptionController_updateRetailerSubscription
   * Endpoint: PATCH /subscription/retailer/update
   */
  updateRetailerSubscription: (
    data: UpdateRetailerSubscriptionDTO
  ): Promise<UserSubscriptionResponseDto> => {
    return getApiClient().patch<UserSubscriptionResponseDto>(
      "/subscription/retailer/update",
      data
    );
  },

  /**
   * Cancel retailer subscription
   * Operation: SubscriptionController_cancelRetailerSubscription
   * Endpoint: POST /subscription/retailer/cancel
   */
  cancelRetailerSubscription: (): Promise<UserSubscriptionResponseDto> => {
    return getApiClient().post<UserSubscriptionResponseDto>(
      "/subscription/retailer/cancel"
    );
  },

  /**
   * Create a subscription plan (admin only)
   * Operation: SubscriptionController_createSubscription
   * Endpoint: POST /subscription
   */
  createSubscription: (
    data: CreateSubscriptionDTO
  ): Promise<SubscriptionResponseDto> => {
    return getApiClient().post<SubscriptionResponseDto>("/subscription", data);
  },

  /**
   * Update a subscription plan (admin only)
   * Operation: SubscriptionController_updateSubscription
   * Endpoint: PATCH /subscription/{id}
   */
  updateSubscription: (
    subscriptionId: number,
    data: UpdateSubscriptionDTO
  ): Promise<SubscriptionResponseDto> => {
    return getApiClient().patch<SubscriptionResponseDto>(
      `/subscription/${subscriptionId}`,
      data
    );
  },

  /**
   * Delete a subscription plan (admin only)
   * Operation: SubscriptionController_deleteSubscription
   * Endpoint: DELETE /subscription/{id}
   */
  deleteSubscription: (subscriptionId: number): Promise<SubscriptionResponseDto> => {
    return getApiClient().delete<SubscriptionResponseDto>(
      `/subscription/${subscriptionId}`
    );
  },

  /**
   * Get subscription analytics (admin only)
   * Operation: SubscriptionController_getAnalytics
   * Endpoint: GET /subscription/admin/analytics
   */
  getSubscriptionAnalytics: (): Promise<SubscriptionAnalyticsDTO> => {
    return getApiClient().get<SubscriptionAnalyticsDTO>(
      "/subscription/admin/analytics"
    );
  },
};

