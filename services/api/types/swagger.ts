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

export type DealType = 
  | "PERCENTAGE_DISCOUNT"
  | "FIXED_DISCOUNT"
  | "BOGO"
  | "BUNDLE"
  | "QUANTITY_DISCOUNT"
  | "VOUCHER";

export interface CreatePromotionDto {
  title: string;
  dealType: DealType;
  description: string;
  startsAt?: string; // ISO 8601 format date-time
  endsAt?: string | null; // ISO 8601 format date-time
  active?: boolean;
  // PERCENTAGE_DISCOUNT fields
  percentageOff?: number; // 0-100, required for PERCENTAGE_DISCOUNT
  // FIXED_DISCOUNT fields
  fixedAmountOff?: number; // > 0, required for FIXED_DISCOUNT
  // BOGO fields
  buyQuantity?: number; // > 0, required for BOGO
  getQuantity?: number; // > 0, required for BOGO
  // BUNDLE fields
  bundlePrice?: number; // > 0, required for BUNDLE (needs at least 2 products)
  // QUANTITY_DISCOUNT fields
  minQuantity?: number; // > 1, required for QUANTITY_DISCOUNT
  quantityDiscount?: number; // 0-100, required for QUANTITY_DISCOUNT
  // VOUCHER fields
  voucherValue?: number; // > 0, required for VOUCHER
  voucherQuantity?: number; // > 0, maximum number of vouchers the store can provide
  // Products
  productIds: number[]; // Array of product IDs this promotion applies to
}

export interface PromotionResponseDto {
  id: number;
  title: string;
  dealType: DealType;
  description: string;
  startsAt: string; // ISO 8601 format date-time
  endsAt: string | null; // ISO 8601 format date-time
  active: boolean;
  // Deal-specific fields (nullable, only populated based on dealType)
  percentageOff?: number | null;
  fixedAmountOff?: number | null;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  bundlePrice?: number | null;
  minQuantity?: number | null;
  quantityDiscount?: number | null;
  voucherValue?: number | null;
  voucherQuantity?: number | null; // Total number of vouchers available. If not provided or null, vouchers are unlimited.
  // Legacy fields for backward compatibility
  productId?: number | null; // Legacy field, may be null for multi-product promotions. If missing, extract from promotionProducts[0].productId
  type?: string; // Legacy field mapped from dealType
  discount?: number; // Legacy field mapped from deal-specific fields
  promotionProducts?: Array<{
    id: number;
    promotionId: number;
    productId: number;
    createdAt: string;
    product?: {
      id: number;
      name: string;
      description: string;
      price: string;
      stock: number;
      createdAt: string;
      isActive: boolean;
      storeId: number;
      categoryId: number | null;
      imageUrl: string | null;
    };
  }>;
}

export interface UpdatePromotionDto {
  title?: string;
  dealType?: DealType;
  description?: string;
  startsAt?: string; // ISO 8601 format date-time
  endsAt?: string | null; // ISO 8601 format date-time
  active?: boolean;
  // Deal-specific fields
  percentageOff?: number;
  fixedAmountOff?: number;
  buyQuantity?: number;
  getQuantity?: number;
  bundlePrice?: number;
  minQuantity?: number;
  quantityDiscount?: number;
  voucherValue?: number;
  voucherQuantity?: number; // Maximum number of vouchers the store can provide
  productIds?: number[]; // Array of product IDs this promotion applies to
}

export interface AddProductsToPromotionDto {
  productIds: number[]; // Array of product IDs to add to the promotion
}

// ============================================================================
// Voucher Redemption Types
// ============================================================================

export type VoucherRedemptionStatus = "PENDING" | "VERIFIED" | "REDEEMED" | "CANCELLED";

export interface GenerateVoucherTokenDto {
  promotionId: number; // Promotion ID for the voucher
  storeId: number; // Store ID where the voucher will be redeemed
  productId: number; // Product ID from the promotion that the consumer wants to use the voucher for. Consumer must select one product from the promotion's products.
}

export interface VoucherTokenResponseDto {
  token: string; // JWT token containing voucher redemption information
  userId: number; // Consumer user ID
  userName: string; // Consumer name
  redemptionId: number; // Voucher redemption ID
  promotionId: number; // Promotion ID
  storeId: number; // Store ID where redemption will occur
  productId?: number | null; // Product ID (if specific product) - nullable
  status: VoucherRedemptionStatus; // Current status of voucher redemption
}

export interface VerifyVoucherDto {
  token: string; // Voucher redemption token generated by consumer
}

export interface VoucherVerificationResponseDto {
  valid: boolean; // Whether the voucher is valid
  userId: number; // Consumer user ID
  userName: string; // Consumer name
  subscriptionTier: string; // Consumer subscription tier
  redemptionId: number; // Voucher redemption ID
  promotionId?: number; // Promotion ID (optional for backward compatibility, should be included by backend)
  promotionTitle: string; // Promotion title
  voucherValue: number; // Voucher value
  storeId: number; // Store ID
  productId?: number | null; // Product ID (if specific product) - nullable
  status: VoucherRedemptionStatus; // Current status
  message?: string | null; // Error message if validation failed - nullable
}

export interface ConfirmVoucherRedemptionDto {
  token: string; // Voucher redemption token to confirm
}

export interface ConfirmVoucherRedemptionResponseDto {
  message: string; // Success message
  redemptionId: number; // Voucher redemption ID
  promotion?: PromotionResponseDto; // Updated promotion with decremented voucherQuantity (optional for backward compatibility)
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
// View Types
// ============================================================================

export type EntityType = "STORE" | "PRODUCT" | "PROMOTION";

export interface RecordViewDto {
  entityType: EntityType;
  entityId: number; // Must be a positive integer
}

export interface ViewResponseDto {
  id: number;
  userId: number;
  entityType: EntityType;
  entityId: number;
  viewedAt: string; // ISO 8601 format date-time
  store?: StoreResponseDto; // Only populated when entityType is STORE
  product?: ProductResponseDto; // Only populated when entityType is PRODUCT
  promotion?: PromotionResponseDto; // Only populated when entityType is PROMOTION
}

export interface ViewCountResponseDto {
  entityType: EntityType;
  entityId: number;
  viewCount: number; // Total number of unique users who have viewed this entity
}

export interface ListViewsParams {
  skip?: number; // Number of records to skip for pagination (default: 0)
  take?: number; // Number of records to return (max 100, default: 10)
  entityType?: EntityType; // Filter views by entity type
}

export type TimePeriod = "daily" | "weekly" | "monthly" | "custom";

export interface DateRangeDto {
  start: string; // ISO 8601 format date-time
  end: string; // ISO 8601 format date-time
}

export interface StoreViewItem {
  store: StoreResponseDto;
  viewCount: number;
}

export interface ProductViewItem {
  product: ProductResponseDto;
  viewCount: number;
}

export interface RetailerAnalyticsResponseDto {
  totalStoreViews: number;
  totalProductViews: number;
  storeViews: StoreViewItem[];
  productViews: ProductViewItem[];
  timePeriod: TimePeriod;
  dateRange: DateRangeDto;
}

export interface GetRetailerAnalyticsParams {
  timePeriod: TimePeriod;
  startDate?: string; // ISO 8601 format date-time, required when timePeriod is "custom"
  endDate?: string; // ISO 8601 format date-time, required when timePeriod is "custom"
  entityType?: EntityType; // Optional filter by entity type (STORE or PRODUCT only)
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

// ============================================================================
// Review Types
// ============================================================================

export interface CreateReviewDto {
  storeId: number;
  rating?: number; // Rating from 1 to 5 stars (optional - consumers can comment without rating)
  comment: string; // Review comment - the consumer's comment about the store
}

export interface ReviewResponseDto {
  id: number;
  storeId: number;
  userId: number;
  userName: string;
  userImageUrl: string | null;
  rating: number | null; // Rating from 1 to 5 stars (optional - consumers can comment without rating)
  comment: string; // Review comment - the consumer's comment about the store
  createdAt: string; // ISO 8601 format date-time
  updatedAt: string; // ISO 8601 format date-time
  likesCount: number; // Number of likes
  dislikesCount: number; // Number of dislikes
  repliesCount: number; // Number of replies
  userLiked: boolean | null; // Whether current user liked this review
  userDisliked: boolean | null; // Whether current user disliked this review
}

export interface UpdateReviewDto {
  rating?: number; // Rating from 1 to 5 stars (optional)
  comment?: string; // Review comment
}

export interface CreateReplyDto {
  reviewId: number;
  parentReplyId?: number; // Optional parent reply ID - if provided, this reply will be a reply to another reply (nested reply)
  comment: string; // Reply comment
}

export interface UpdateReplyDto {
  comment: string; // Updated reply comment
}

export interface ReplyResponseDto {
  id: number;
  reviewId: number;
  userId: number;
  userName: string;
  userImageUrl: string | null;
  parentReplyId: number | null; // Parent reply ID - if this is a reply to another reply
  comment: string; // Reply comment
  createdAt: string; // ISO 8601 format date-time
  updatedAt: string; // ISO 8601 format date-time
  replies?: ReplyResponseDto[]; // Nested replies - replies to this reply
}

export interface ReactionDto {
  reviewId: number;
}

export interface ReactionResponseDto {
  isLike: boolean | null; // true if liked, false if disliked, null if no reaction
}

export interface StoreRatingStatsDto {
  averageRating: number; // Average rating (1-5)
  totalRatings: number; // Total number of ratings
  fiveStarCount: number; // Number of 5-star ratings
  fourStarCount: number; // Number of 4-star ratings
  threeStarCount: number; // Number of 3-star ratings
  twoStarCount: number; // Number of 2-star ratings
  oneStarCount: number; // Number of 1-star ratings
}

// ============================================================================
// Report Types
// ============================================================================

export type ReportReason = 
  | "SPAM"
  | "HARASSMENT"
  | "INAPPROPRIATE_CONTENT"
  | "FAKE_REVIEW"
  | "SCAM"
  | "OTHER";

export type ReportStatus = 
  | "PENDING"
  | "REVIEWED"
  | "RESOLVED"
  | "DISMISSED";

export interface CreateReportDto {
  reportedUserId?: number; // User ID being reported (for reporting consumers). Either this or reportedStoreId must be provided.
  reportedStoreId?: number; // Store ID being reported (for reporting stores/retailers). Either this or reportedUserId must be provided.
  reason: ReportReason; // Reason for the report
  description?: string; // Optional additional details about the report
}

export interface ReportResponseDto {
  id: number;
  reporterId: number;
  reporterName: string;
  reportedUserId: number | null; // User ID being reported (nullable - for reporting consumers)
  reportedUserName: string | null; // Reported user name (if reporting a user)
  reportedStoreId: number | null; // Store ID being reported (nullable - for reporting stores)
  reportedStoreName: string | null; // Reported store name (if reporting a store)
  reason: ReportReason; // Reason for the report
  description: string | null; // Additional details about the report
  status: ReportStatus; // Current status of the report
  createdAt: string; // ISO 8601 format date-time
  reviewedAt: string | null; // When the report was reviewed
  reviewedById: number | null; // Admin user ID who reviewed the report
  reviewedByName: string | null; // Admin name who reviewed the report
}

export interface UpdateReportStatusDto {
  status: ReportStatus; // New status for the report
}

