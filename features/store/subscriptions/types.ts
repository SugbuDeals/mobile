/**
 * Subscription domain types matching server.json SubscriptionResponseDto
 * Used for subscription plans (admin-managed)
 */
export type Subscription = {
  id: number;
  name: string;
  plan: "FREE" | "BASIC" | "PREMIUM";
  billingCycle: "MONTHLY" | "YEARLY";
  price: string; // Decimal as string per server.json
  isActive: boolean;
  createdAt: string; // ISO 8601 format date-time
  updatedAt: string; // ISO 8601 format date-time
  startsAt: string; // ISO 8601 format date-time
  endsAt: string | null; // Nullable per server.json
  description: string | null; // Nullable per server.json
  benefits: string | null; // Nullable per server.json
};

/**
 * UserSubscription type matching server.json UserSubscriptionResponseDto
 * Used for user-specific subscriptions
 */
export type UserSubscription = {
  id: number;
  userId: number;
  subscriptionId: number;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";
  price: string; // Decimal as string per server.json
  billingCycle: "MONTHLY" | "YEARLY";
  startsAt: string; // ISO 8601 format date-time
  endsAt: string | null; // Nullable per server.json
  cancelledAt: string | null; // Nullable per server.json
  createdAt: string; // ISO 8601 format date-time
  updatedAt: string; // ISO 8601 format date-time
  subscription?: Subscription; // Nested subscription plan details
};

export type SubscriptionAnalytics = {
  total: number;
  active: number;
  cancelled: number;
  expired: number;
  pending: number;
  byPlan: Array<{ plan: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byBillingCycle: Array<{ billingCycle: string; count: number }>;
  totalRevenue: string;
  averagePrice: string;
  recentSubscriptions: number;
  subscriptionsThisMonth: number;
};

/**
 * CreateSubscriptionDTO matching server.json CreateSubscriptionDTO
 */
export type CreateSubscriptionDTO = {
  name: string;
  description?: string;
  plan?: "FREE" | "BASIC" | "PREMIUM";
  billingCycle?: "MONTHLY" | "YEARLY";
  price?: string; // Decimal as string per server.json
  benefits?: string;
  isActive?: boolean;
  startsAt?: string; // ISO 8601 format date-time
  endsAt?: string; // ISO 8601 format date-time
};

/**
 * UpdateSubscriptionDTO matching server.json UpdateSubscriptionDTO
 */
export type UpdateSubscriptionDTO = {
  name?: string;
  description?: string;
  plan?: "FREE" | "BASIC" | "PREMIUM";
  billingCycle?: "MONTHLY" | "YEARLY";
  price?: string; // Decimal as string per server.json
  benefits?: string;
  isActive?: boolean;
  startsAt?: string; // ISO 8601 format date-time
  endsAt?: string; // ISO 8601 format date-time
};

export type JoinSubscriptionDTO = {
  subscriptionId: number;
};

