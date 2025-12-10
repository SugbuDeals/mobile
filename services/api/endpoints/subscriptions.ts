/**
 * Subscription API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - GET /subscription/me (operationId: SubscriptionController_getCurrentTier)
 * - POST /subscription/upgrade (operationId: SubscriptionController_upgradeToPro)
 * - POST /subscription/downgrade (operationId: SubscriptionController_downgradeToBasic)
 * - GET /subscription/analytics (operationId: SubscriptionController_getAnalytics)
 */

import { getApiClient } from "../client";
import type {
  SubscriptionTierResponseDto,
  SubscriptionAnalyticsDto,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
  SubscriptionTierResponseDto,
  SubscriptionAnalyticsDto,
};

// Note: SubscriptionTier is already exported from swagger.ts as "BASIC" | "PRO"
// Do not re-export SubscriptionTier here to avoid conflict
// SubscriptionAnalytics is an alias for SubscriptionAnalyticsDto
export type SubscriptionAnalytics = SubscriptionAnalyticsDto;

export const subscriptionsApi = {
  /**
   * Get current user subscription tier
   * Returns the authenticated user's current subscription tier (BASIC or PRO) along with role information.
   * Operation: SubscriptionController_getCurrentTier
   * Endpoint: GET /subscription/me
   */
  getCurrentTier: (): Promise<SubscriptionTierResponseDto> => {
    return getApiClient().get<SubscriptionTierResponseDto>("/subscription/me");
  },

  /**
   * Upgrade to PRO tier
   * Upgrades the user from BASIC to PRO tier. PRO costs 100 PHP/month and provides extended limits.
   * Restricted to consumers and retailers.
   * Operation: SubscriptionController_upgradeToPro
   * Endpoint: POST /subscription/upgrade
   */
  upgradeToPro: (): Promise<SubscriptionTierResponseDto> => {
    return getApiClient().post<SubscriptionTierResponseDto>("/subscription/upgrade");
  },

  /**
   * Downgrade to BASIC tier
   * Downgrades the user from PRO to BASIC tier. BASIC tier has limited features.
   * Restricted to consumers and retailers.
   * Operation: SubscriptionController_downgradeToBasic
   * Endpoint: POST /subscription/downgrade
   */
  downgradeToBasic: (): Promise<SubscriptionTierResponseDto> => {
    return getApiClient().post<SubscriptionTierResponseDto>("/subscription/downgrade");
  },

  /**
   * Get subscription analytics (admin only)
   * Returns comprehensive subscription tier analytics including user counts by tier/role and revenue metrics.
   * Operation: SubscriptionController_getAnalytics
   * Endpoint: GET /subscription/analytics
   */
  getAnalytics: (): Promise<SubscriptionAnalyticsDto> => {
    return getApiClient().get<SubscriptionAnalyticsDto>("/subscription/analytics");
  },
};

