/**
 * Subscription domain types
 * Uses Swagger-generated types from services/api/types/swagger
 */

import type {
  SubscriptionTierResponseDto,
  SubscriptionAnalyticsDto,
} from "@/services/api/types/swagger";

// Re-export Swagger types
export type {
  SubscriptionTierResponseDto,
  SubscriptionAnalyticsDto,
};

// Aliases for backward compatibility
export type SubscriptionTier = SubscriptionTierResponseDto;
export type SubscriptionAnalytics = SubscriptionAnalyticsDto;

