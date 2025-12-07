/**
 * Subscription domain types
 */

export type Subscription = {
  id: number;
  userId?: number;
  status?: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";
  billingCycle?: "MONTHLY" | "YEARLY";
  price?: string;
  startsAt?: string;
  endsAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  name?: string;
  description?: string;
  plan?: "FREE" | "BASIC" | "PREMIUM";
  benefits?: string;
  isActive?: boolean;
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

export type CreateSubscriptionDTO = {
  name: string;
  plan: "FREE" | "BASIC" | "PREMIUM";
  price: number;
  durationDays: number;
  maxProducts?: number;
  features?: string[];
  isActive?: boolean;
};

export type UpdateSubscriptionDTO = {
  name?: string;
  plan?: "FREE" | "BASIC" | "PREMIUM";
  price?: number;
  durationDays?: number;
  maxProducts?: number;
  features?: string[];
  isActive?: boolean;
};

export type JoinSubscriptionDTO = {
  subscriptionId: number;
};

