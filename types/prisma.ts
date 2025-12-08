/**
 * TypeScript types generated from Prisma schema
 * These types match the Prisma models exactly
 */

// Enums
export enum UserRole {
  CONSUMER = "CONSUMER",
  RETAILER = "RETAILER",
  ADMIN = "ADMIN",
}

export enum StoreVerificationStatus {
  UNVERIFIED = "UNVERIFIED",
  VERIFIED = "VERIFIED",
}

export enum SubscriptionPlan {
  FREE = "FREE",
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  PENDING = "PENDING",
}

export enum BillingCycle {
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export enum NotificationType {
  PRODUCT_CREATED = "PRODUCT_CREATED",
  PRODUCT_PRICE_CHANGED = "PRODUCT_PRICE_CHANGED",
  PRODUCT_STOCK_CHANGED = "PRODUCT_STOCK_CHANGED",
  PRODUCT_STATUS_CHANGED = "PRODUCT_STATUS_CHANGED",
  PROMOTION_CREATED = "PROMOTION_CREATED",
  PROMOTION_STARTED = "PROMOTION_STARTED",
  PROMOTION_ENDING_SOON = "PROMOTION_ENDING_SOON",
  PROMOTION_ENDED = "PROMOTION_ENDED",
  STORE_VERIFIED = "STORE_VERIFIED",
  STORE_CREATED = "STORE_CREATED",
  STORE_UNDER_REVIEW = "STORE_UNDER_REVIEW",
  SUBSCRIPTION_JOINED = "SUBSCRIPTION_JOINED",
  SUBSCRIPTION_CANCELLED = "SUBSCRIPTION_CANCELLED",
  SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
  SUBSCRIPTION_RENEWED = "SUBSCRIPTION_RENEWED",
  SUBSCRIPTION_ENDING_SOON = "SUBSCRIPTION_ENDING_SOON",
  SUBSCRIPTION_AVAILABLE = "SUBSCRIPTION_AVAILABLE",
  CONSUMER_WELCOME = "CONSUMER_WELCOME",
  PROMOTION_NEARBY = "PROMOTION_NEARBY",
  GPS_REMINDER = "GPS_REMINDER",
  QUESTIONABLE_PRICING_PRODUCT = "QUESTIONABLE_PRICING_PRODUCT",
  QUESTIONABLE_PRICING_PROMOTION = "QUESTIONABLE_PRICING_PROMOTION",
}

// Base Models (without relations)
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  createdAt: Date | string;
  role: UserRole | keyof typeof UserRole;
  imageUrl: string | null;
}

export interface Store {
  id: number;
  name: string;
  description: string;
  createdAt: Date | string;
  verificationStatus: StoreVerificationStatus | keyof typeof StoreVerificationStatus;
  ownerId: number;
  imageUrl: string | null;
  bannerUrl: string | null;
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string; // Decimal can be number or string depending on context
  stock: number;
  createdAt: Date | string;
  isActive: boolean;
  storeId: number;
  categoryId: number | null;
  imageUrl: string | null;
}

export interface Promotion {
  id: number;
  title: string;
  type: string;
  description: string;
  startsAt: Date | string;
  endsAt: Date | string | null;
  active: boolean;
  discount: number;
  productId: number | null;
}

export interface Category {
  id: number;
  name: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StoreBookmark {
  id: number;
  userId: number;
  storeId: number;
  createdAt: Date | string;
}

export interface ProductBookmark {
  id: number;
  userId: number;
  productId: number;
  createdAt: Date | string;
}

export interface Subscription {
  id: number;
  name: string;
  description: string | null;
  plan: SubscriptionPlan | keyof typeof SubscriptionPlan;
  billingCycle: BillingCycle | keyof typeof BillingCycle;
  price: number | string; // Decimal can be number or string depending on context
  benefits: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  startsAt: Date | string;
  endsAt: Date | string | null;
}

export interface UserSubscription {
  id: number;
  userId: number;
  subscriptionId: number;
  status: SubscriptionStatus | keyof typeof SubscriptionStatus;
  price: number | string; // Decimal can be number or string depending on context
  billingCycle: BillingCycle | keyof typeof BillingCycle;
  startsAt: Date | string;
  endsAt: Date | string | null;
  cancelledAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType | keyof typeof NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date | string;
  readAt: Date | string | null;
  productId: number | null;
  storeId: number | null;
  promotionId: number | null;
}

// Models with relations (for API responses that include nested data)
export interface UserWithRelations extends User {
  Store?: Store[];
  StoreBookmark?: StoreBookmark[];
  ProductBookmark?: ProductBookmark[];
  subscriptions?: UserSubscription[];
  notifications?: Notification[];
}

export interface StoreWithRelations extends Store {
  owner?: User;
  products?: Product[];
  bookmarks?: StoreBookmark[];
}

export interface ProductWithRelations extends Product {
  store?: Store;
  category?: Category | null;
  bookmarks?: ProductBookmark[];
  promotions?: Promotion[];
}

export interface PromotionWithRelations extends Promotion {
  product?: Product | null;
}

export interface CategoryWithRelations extends Category {
  products?: Product[];
}

export interface StoreBookmarkWithRelations extends StoreBookmark {
  user?: User;
  store?: Store;
}

export interface ProductBookmarkWithRelations extends ProductBookmark {
  user?: User;
  product?: Product;
}

export interface UserSubscriptionWithRelations extends UserSubscription {
  user?: User;
  subscription?: Subscription;
}

export interface NotificationWithRelations extends Notification {
  user?: User;
}

// Type guards and utility types
export type PrismaEnum = UserRole | StoreVerificationStatus | SubscriptionPlan | SubscriptionStatus | BillingCycle | NotificationType;

export type PrismaModel = 
  | User 
  | Store 
  | Product 
  | Promotion 
  | Category 
  | StoreBookmark 
  | ProductBookmark 
  | Subscription 
  | UserSubscription 
  | Notification;

// Router types (for Expo Router)
export interface Router {
  push: (path: string | { pathname: string; params?: Record<string, unknown> }) => void;
  replace: (path: string | { pathname: string; params?: Record<string, unknown> }) => void;
  back: () => void;
  canGoBack: () => boolean;
}

