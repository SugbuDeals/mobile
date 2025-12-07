/**
 * Store type matching server.json StoreResponseDto
 * All location fields are nullable per server.json
 */
export type Store = {
  id: number;
  name: string;
  description: string;
  createdAt: string; // ISO 8601 format date-time
  verificationStatus: "UNVERIFIED" | "VERIFIED";
  ownerId: number;
  isActive: boolean;
  imageUrl: string | null; // Nullable per server.json
  bannerUrl: string | null; // Nullable per server.json
  latitude: number | null; // Nullable per server.json
  longitude: number | null; // Nullable per server.json
  address: string | null; // Nullable per server.json
  city: string | null; // Nullable per server.json
  state: string | null; // Nullable per server.json
  country: string | null; // Nullable per server.json
  postalCode: string | null; // Nullable per server.json
  distance?: number; // Only present in StoreWithDistanceResponseDto
};

/**
 * Product type matching server.json ProductResponseDto
 * price is string (Decimal as string from backend)
 */
export type Product = {
  id: number;
  name: string;
  description: string;
  price: string; // Decimal as string per server.json
  stock: number;
  isActive: boolean;
  storeId: number;
  createdAt: string; // ISO 8601 format date-time
  imageUrl: string | null; // Nullable per server.json
  categoryId: number | null; // Nullable per server.json
};

/**
 * CreateProductDTO matching server.json CreateProductDTO
 * price is number in request (will be converted to string by backend)
 */
export type CreateProductDTO = {
  name: string;
  description: string;
  price: number; // Number in request, backend converts to Decimal string
  stock: number;
  isActive?: boolean;
  storeId: number;
  imageUrl?: string;
  categoryId?: number;
};

/**
 * UpdateProductDTO matching server.json UpdateProductDTO
 * price is number in request (will be converted to string by backend)
 */
export type UpdateProductDTO = {
  name?: string;
  description?: string;
  price?: number; // Number in request, backend converts to Decimal string
  stock?: number;
  isActive?: boolean;
  imageUrl?: string;
  categoryId?: number;
};

export type ManageStoreStatusDTO = {
  verificationStatus?: "UNVERIFIED" | "VERIFIED";
  isActive?: boolean;
};

export type UpdateProductStatusDTO = {
  isActive: boolean;
};

export type CreateStoreDTO = {
  name: string;
  description: string;
  ownerId: number;
  imageUrl?: string;
  bannerUrl?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

export type UpdateStoreDTO = {
  name?: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  verificationStatus?: "UNVERIFIED" | "VERIFIED";
  ownerId?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

/**
 * Promotion type matching server.json PromotionResponseDto
 */
export type Promotion = {
  id: number;
  title: string;
  type: string; // Promotion type (e.g., "PERCENTAGE")
  description: string;
  startsAt: string; // ISO 8601 format date-time
  endsAt: string | null; // Nullable per server.json
  active: boolean;
  discount: number;
  productId: number | null; // Nullable per server.json
};

export type CreatePromotionDTO = {
  title: string;
  type: 'percentage' | 'fixed';
  description: string;
  startsAt: string;
  endsAt: string;
  discount: number;
  productId: number;
  active?: boolean;
};

export type UpdatePromotionDTO = {
  title?: string;
  type?: 'percentage' | 'fixed';
  description?: string;
  startsAt?: string;
  endsAt?: string;
  discount?: number;
  productId?: number;
  active?: boolean;
};

/**
 * Subscription type matching server.json SubscriptionResponseDto
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

export type JoinSubscriptionDTO = {
  subscriptionId: number;
};

export type CreateSubscriptionDTO = {
  /**
   * Display name of the subscription plan
   */
  name: string;
  /**
   * Short description of the subscription
   */
  description?: string;
  plan?: "FREE" | "BASIC" | "PREMIUM";
  billingCycle?: "MONTHLY" | "YEARLY";
  /**
   * Subscription price (string in API spec)
   */
  price?: string;
  /**
   * Additional benefits or perks description
   */
  benefits?: string;
  /**
   * Whether this subscription is currently available for retailers
   */
  isActive?: boolean;
  /**
   * Subscription availability window (optional)
   */
  startsAt?: string;
  endsAt?: string;
};

export type UpdateSubscriptionDTO = {
  name?: string;
  description?: string;
  plan?: "FREE" | "BASIC" | "PREMIUM";
  billingCycle?: "MONTHLY" | "YEARLY";
  price?: string;
  benefits?: string;
  isActive?: boolean;
  status?: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";
  startsAt?: string;
  endsAt?: string;
  cancelledAt?: string;
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