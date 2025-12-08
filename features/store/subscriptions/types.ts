/**
 * Subscription domain types
 * Uses Swagger-generated types from services/api/types/swagger
 */

import type {
  SubscriptionResponseDto,
  UserSubscriptionResponseDto,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  JoinSubscriptionDTO,
  UpdateRetailerSubscriptionDTO,
  SubscriptionAnalyticsDTO,
} from "@/services/api/types/swagger";

// Re-export Swagger types
export type {
  SubscriptionResponseDto,
  UserSubscriptionResponseDto,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  JoinSubscriptionDTO,
  UpdateRetailerSubscriptionDTO,
  SubscriptionAnalyticsDTO,
};

// Aliases for backward compatibility
export type Subscription = SubscriptionResponseDto;
export type UserSubscription = UserSubscriptionResponseDto;
export type SubscriptionAnalytics = SubscriptionAnalyticsDTO;

