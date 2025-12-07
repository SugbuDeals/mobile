export type Store = {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  /**
   * Optional store banner image (wide hero image shown on consumer store page)
   */
  bannerUrl?: string;
  createdAt: Date;
  verificationStatus: "UNVERIFIED" | "VERIFIED";
  isActive?: boolean;
  ownerId?: number;
  userId?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  distance?: number;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number | string; // API returns string, we'll convert to number
  stock: number;
  isActive: boolean;
  storeId: number;
  imageUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  categoryId?: number | null;
};

export type CreateProductDTO = {
  name: string;
  description: string;
  price: number;
  stock: number;
  isActive?: boolean;
  storeId: number;
  imageUrl?: string;
  categoryId?: number | null;
};

export type UpdateProductDTO = {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  imageUrl?: string;
  categoryId?: number | null;
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

export type Promotion = {
  id: number;
  title: string;
  type: string;
  description: string;
  startsAt?: Date;
  endsAt?: Date;
  active: boolean;
  discount: number;
  productId: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CreatePromotionDTO = {
  title: string;
  type: 'percentage' | 'fixed';
  description: string;
  startsAt: string;
  endsAt: string;
  discount: number;
  productId: number;
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

export type Subscription = {
  id: number;
  /**
   * For retailer/user-specific subscriptions returned by
   * `/subscription/user/{userId}/active`, join/update/cancel endpoints.
   */
  userId?: number;
  status?: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";
  billingCycle?: "MONTHLY" | "YEARLY";
  price?: string;
  startsAt?: string;
  endsAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  /**
   * For admin-managed subscription plans returned by `/subscription` endpoints.
   */
  name?: string;
  description?: string;
  plan?: "FREE" | "BASIC" | "PREMIUM";
  benefits?: string;
  isActive?: boolean;
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