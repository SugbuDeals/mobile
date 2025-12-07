/**
 * Subscription API endpoints
 */

import { getApiClient } from "../client";
import type { Subscription, SubscriptionAnalytics, UserSubscription } from "@/features/store/types";

export interface FindSubscriptionsParams {
  plan?: "FREE" | "BASIC" | "PREMIUM";
  isActive?: boolean;
  search?: string;
  skip?: number;
  take?: number;
  [key: string]: unknown;
}

export interface CreateSubscriptionDTO {
  name: string;
  description?: string;
  plan?: "FREE" | "BASIC" | "PREMIUM";
  billingCycle?: "MONTHLY" | "YEARLY";
  price?: string;
  benefits?: string;
  isActive?: boolean;
  startsAt?: string; // ISO 8601 format
  endsAt?: string; // ISO 8601 format
}

export interface UpdateSubscriptionDTO {
  name?: string;
  description?: string;
  plan?: "FREE" | "BASIC" | "PREMIUM";
  billingCycle?: "MONTHLY" | "YEARLY";
  price?: string;
  benefits?: string;
  isActive?: boolean;
  startsAt?: string; // ISO 8601 format
  endsAt?: string; // ISO 8601 format
}

export interface JoinSubscriptionDTO {
  subscriptionId: number;
}

export interface UpdateRetailerSubscriptionDTO {
  subscriptionId: number;
}

export const subscriptionsApi = {
  /**
   * Find all subscriptions
   */
  findSubscriptions: (
    params?: FindSubscriptionsParams
  ): Promise<Subscription[]> => {
    return getApiClient().get<Subscription[]>("/subscription", params);
  },

  /**
   * Find subscription by ID
   */
  findSubscriptionById: (subscriptionId: number): Promise<Subscription> => {
    return getApiClient().get<Subscription>(`/subscription/${subscriptionId}`);
  },

  /**
   * Get active subscription for a user
   * Returns UserSubscriptionResponseDto per server.json
   */
  getActiveSubscription: (userId: number): Promise<UserSubscription | null> => {
    return getApiClient()
      .get<UserSubscription>(`/subscription/user/${userId}/active`)
      .catch((error) => {
        // Return null for 404 (no active subscription) or 200 with null body
        if (error.status === 404 || error.status === 200) {
          return null;
        }
        throw error;
      });
  },

  /**
   * Join a subscription (retailer)
   * Returns UserSubscriptionResponseDto per server.json
   */
  joinSubscription: (data: JoinSubscriptionDTO): Promise<UserSubscription> => {
    return getApiClient().post<UserSubscription>(
      "/subscription/retailer/join",
      data
    );
  },

  /**
   * Update retailer subscription
   * Returns UserSubscriptionResponseDto per server.json
   */
  updateRetailerSubscription: (
    data: UpdateRetailerSubscriptionDTO
  ): Promise<UserSubscription> => {
    return getApiClient().patch<UserSubscription>(
      "/subscription/retailer/update",
      data
    );
  },

  /**
   * Cancel retailer subscription
   * Returns UserSubscriptionResponseDto per server.json
   */
  cancelRetailerSubscription: (): Promise<UserSubscription> => {
    return getApiClient().post<UserSubscription>(
      "/subscription/retailer/cancel"
    );
  },

  /**
   * Create a subscription (admin)
   */
  createSubscription: (
    data: CreateSubscriptionDTO
  ): Promise<Subscription> => {
    return getApiClient().post<Subscription>("/subscription", data);
  },

  /**
   * Update a subscription (admin)
   */
  updateSubscription: (
    subscriptionId: number,
    data: UpdateSubscriptionDTO
  ): Promise<Subscription> => {
    return getApiClient().patch<Subscription>(
      `/subscription/${subscriptionId}`,
      data
    );
  },

  /**
   * Delete a subscription (admin)
   */
  deleteSubscription: (subscriptionId: number): Promise<{ id: number }> => {
    return getApiClient().delete<{ id: number }>(
      `/subscription/${subscriptionId}`
    );
  },

  /**
   * Get subscription analytics (admin)
   */
  getSubscriptionAnalytics: (): Promise<SubscriptionAnalytics> => {
    return getApiClient().get<SubscriptionAnalytics>(
      "/subscription/admin/analytics"
    );
  },
};

