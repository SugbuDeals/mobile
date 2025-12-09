/**
 * TypeScript types generated from server.json OpenAPI 3.0 specification
 * All types match the Swagger schema exactly, including nullable fields, enums, and required fields
 */

// ============================================================================
// Auth Types
// ============================================================================

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  role: "CONSUMER" | "RETAILER";
}

export interface UserResponseDto {
  id: number;
  email: string;
  name: string;
  createdAt: string; // ISO 8601 format date-time
  role: "CONSUMER" | "RETAILER" | "ADMIN";
  imageUrl: string | null;
}

export interface AuthResponseDto {
  access_token: string;
  user: UserResponseDto;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  role?: "CONSUMER" | "RETAILER" | "ADMIN";
  imageUrl?: string | null;
}

// ============================================================================
// Store Types
// ============================================================================

export interface StoreResponseDto {
  id: number;
  name: string;
  description: string;
  createdAt: string; // ISO 8601 format date-time
  verificationStatus: "UNVERIFIED" | "VERIFIED";
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

export interface StoreWithDistanceResponseDto extends StoreResponseDto {
  distance: number; // Distance from search point in kilometers
}

export interface CreateStoreDTO {
  name: string;
  description: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  ownerId?: number;
  imageUrl?: string;
  bannerUrl?: string;
  isActive?: boolean;
}

export interface UpdateStoreDTO {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  verificationStatus?: "UNVERIFIED" | "VERIFIED";
  ownerId?: number;
  imageUrl?: string;
  bannerUrl?: string;
  isActive?: boolean;
}

export interface ManageStoreStatusDTO {
  verificationStatus?: "UNVERIFIED" | "VERIFIED";
  isActive?: boolean;
}

// ============================================================================
// Product Types
// ============================================================================

export interface ProductResponseDto {
  id: number;
  name: string;
  description: string;
  price: string; // Decimal as string
  stock: number;
  createdAt: string; // ISO 8601 format date-time
  isActive: boolean;
  storeId: number;
  categoryId: number | null;
  imageUrl: string | null;
}

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  stock: number;
  isActive?: boolean;
  storeId: number;
  imageUrl?: string;
  categoryId?: number;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  imageUrl?: string;
  categoryId?: number;
}

export interface UpdateProductStatusDTO {
  isActive: boolean;
}

// ============================================================================
// Promotion Types
// ============================================================================

export interface CreatePromotionDto {
  title: string;
  type: string; // e.g., "percentage", "fixed amount"
  description: string;
  startsAt?: string; // ISO 8601 format date-time
  endsAt?: string | null; // ISO 8601 format date-time
  active?: boolean;
  discount: number;
  productIds: number[]; // Array of product IDs this promotion applies to
}

export interface PromotionResponseDto {
  id: number;
  title: string;
  type: string; // e.g., "PERCENTAGE"
  description: string;
  startsAt: string; // ISO 8601 format date-time
  endsAt: string | null; // ISO 8601 format date-time
  active: boolean;
  discount: number;
  productId: number | null; // Legacy field, may be null for multi-product promotions
}

export interface UpdatePromotionDto {
  title?: string;
  type?: string;
  description?: string;
  startsAt?: string; // ISO 8601 format date-time
  endsAt?: string | null; // ISO 8601 format date-time
  active?: boolean;
  discount?: number;
  productIds?: number[]; // Array of product IDs this promotion applies to
}

export interface AddProductsToPromotionDto {
  productIds: number[]; // Array of product IDs to add to the promotion
}

// ============================================================================
// Category Types
// ============================================================================

export interface CategoryResponseDto {
  id: number;
  name: string;
  createdAt: string; // ISO 8601 format date-time
  updatedAt: string; // ISO 8601 format date-time
}

export interface CreateCategoryDTO {
  name: string;
}

export interface UpdateCategoryDTO {
  name?: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType =
  | "PRODUCT_CREATED"
  | "PRODUCT_PRICE_CHANGED"
  | "PRODUCT_STOCK_CHANGED"
  | "PRODUCT_STATUS_CHANGED"
  | "PROMOTION_CREATED"
  | "PROMOTION_STARTED"
  | "PROMOTION_ENDING_SOON"
  | "PROMOTION_ENDED"
  | "STORE_VERIFIED"
  | "STORE_CREATED"
  | "STORE_UNDER_REVIEW"
  | "SUBSCRIPTION_JOINED"
  | "SUBSCRIPTION_CANCELLED"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_ENDING_SOON"
  | "SUBSCRIPTION_AVAILABLE"
  | "CONSUMER_WELCOME"
  | "PROMOTION_NEARBY"
  | "GPS_REMINDER"
  | "QUESTIONABLE_PRICING_PRODUCT"
  | "QUESTIONABLE_PRICING_PROMOTION";

export interface NotificationResponseDto {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO 8601 format date-time
  readAt: string | null; // ISO 8601 format date-time
  productId: number | null;
  storeId: number | null;
  promotionId: number | null;
}

export interface CreateNotificationDto {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  productId?: number;
  storeId?: number;
  promotionId?: number;
}

// ============================================================================
// Subscription Types
// ============================================================================

export type SubscriptionTier = "BASIC" | "PRO";

export interface SubscriptionTierResponseDto {
  userId: number;
  email: string;
  name: string;
  tier: SubscriptionTier;
  role: "CONSUMER" | "RETAILER" | "ADMIN";
}

export interface RoleTierCountDto {
  basic: number;
  pro: number;
  total: number;
}

export interface ByRoleAndTierDto {
  consumer: RoleTierCountDto;
  retailer: RoleTierCountDto;
  admin: RoleTierCountDto;
}

export interface RevenueDto {
  monthly: number;
  yearly: number;
  currency: string;
}

export interface SubscriptionAnalyticsDto {
  totalUsers: number;
  basicUsers: number;
  proUsers: number;
  byRoleAndTier: ByRoleAndTierDto;
  revenue: RevenueDto;
}

// ============================================================================
// Bookmark Types
// ============================================================================

export interface ListBookmarksDto {
  take?: number;
  skip?: number;
}

export interface StoreBookmarkDto {
  storeId: number;
}

export interface StoreBookmarkResponseDto {
  id: number;
  userId: number;
  storeId: number;
  createdAt: string; // ISO 8601 format date-time
  store?: StoreResponseDto;
}

export interface ProductBookmarkDto {
  productId: number;
}

export interface ProductBookmarkResponseDto {
  id: number;
  userId: number;
  productId: number;
  createdAt: string; // ISO 8601 format date-time
  product?: ProductResponseDto;
}

// ============================================================================
// AI Types
// ============================================================================

export interface ChatMessageDto {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequestDto {
  content: string;
  count: number; // 1-10
  latitude?: number;
  longitude?: number;
  radius?: 5 | 10 | 15;
}

export interface ChatResponseDto {
  content: string;
  intent?: "product" | "store" | "promotion" | "chat";
  products?: ProductRecommendationItemDto[];
  stores?: StoreRecommendationItemDto[];
  promotions?: PromotionRecommendationItemDto[];
}

export type RecommendationIntent = "product" | "store" | "promotion" | "chat";

export interface FreeformRecommendationDto {
  query: string;
  count?: number;
  latitude?: number;
  longitude?: number;
  radius?: 5 | 10 | 15;
  intent?: RecommendationIntent;
}

export interface ProductRecommendationItemDto {
  id: number;
  name: string;
  description: string;
  price: string; // Decimal as string
  imageUrl: string | null;
  storeId: number;
  storeName: string | null;
  distance: number | null; // Distance from user location in kilometers
}

export interface StoreRecommendationItemDto {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  distance: number | null; // Distance from user location in kilometers
}

export interface PromotionRecommendationItemDto {
  id: number;
  title: string;
  type: string;
  description: string;
  startsAt: string; // ISO 8601 format date-time
  endsAt: string | null; // ISO 8601 format date-time
  discount: number;
  productCount: number; // Number of products in this promotion
}

export interface RecommendationResponseDto {
  recommendation: string;
  intent: RecommendationIntent;
  products?: ProductRecommendationItemDto[];
  stores?: StoreRecommendationItemDto[];
  promotions?: PromotionRecommendationItemDto[];
}

export interface SimilarProductsDto {
  productId: number;
  count?: number;
}

export interface SimilarProductsResponseDto {
  role: "user" | "assistant" | "system";
  content: string;
}

// ============================================================================
// File Types
// ============================================================================

export interface FileUploadResponse {
  fileName: string;
  originalName: string;
  fileUrl: string;
  size: number;
  mimeType: string;
}

export interface FileDeleteResponse {
  message: string;
  fileName: string;
}

export interface ClearAllFilesResponse {
  message: string;
  deletedCount: number;
  totalFiles: number;
  errors?: string[];
}

