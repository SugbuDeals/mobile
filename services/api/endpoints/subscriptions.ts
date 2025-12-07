/**
 * Subscription API endpoints
 */

import { getApiClient } from "../client";
import type { Subscription, SubscriptionAnalytics } from "@/features/store/types";

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
  plan: "FREE" | "BASIC" | "PREMIUM";
  price: number;
  durationDays: number;
  maxProducts?: number;
  features?: string[];
  isActive?: boolean;
}

export interface UpdateSubscriptionDTO {
  name?: string;
  plan?: "FREE" | "BASIC" | "PREMIUM";
  price?: number;
  durationDays?: number;
  maxProducts?: number;
  features?: string[];
  isActive?: boolean;
}

export interface JoinSubscriptionDTO {
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
   */
  getActiveSubscription: (userId: number): Promise<Subscription | null> => {
    return getApiClient()
      .get<Subscription>(`/subscription/user/${userId}/active`)
      .catch((error) => {
        // Return null for 404 (no active subscription)
        if (error.status === 404) {
          return null;
        }
        throw error;
      });
  },

  /**
   * Join a subscription (retailer)
   */
  joinSubscription: (data: JoinSubscriptionDTO): Promise<Subscription> => {
    return getApiClient().post<Subscription>(
      "/subscription/retailer/join",
      data
    );
  },

  /**
   * Update retailer subscription
   */
  updateRetailerSubscription: (
    data: JoinSubscriptionDTO
  ): Promise<Subscription> => {
    return getApiClient().patch<Subscription>(
      "/subscription/retailer/update",
      data
    );
  },

  /**
   * Cancel retailer subscription
   */
  cancelRetailerSubscription: (): Promise<Subscription> => {
    return getApiClient().post<Subscription>(
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

