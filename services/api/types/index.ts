/**
 * Centralized type exports organized by domain
 * All types are generated from server.json OpenAPI specification
 */

// Common types
export * from "./common";

// Swagger-generated types
export * from "./swagger";

// Re-export commonly used types for convenience
export type {
  // Auth
  LoginDTO,
  RegisterDTO,
  UserResponseDto,
  AuthResponseDto,
  UpdateUserDTO,
  // Store
  StoreResponseDto,
  StoreWithDistanceResponseDto,
  CreateStoreDTO,
  UpdateStoreDTO,
  ManageStoreStatusDTO,
  // Product
  ProductResponseDto,
  CreateProductDTO,
  UpdateProductDTO,
  UpdateProductStatusDTO,
  // Promotion
  PromotionResponseDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  AddProductsToPromotionDto,
  // Category
  CategoryResponseDto,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  // Notification
  NotificationResponseDto,
  CreateNotificationDto,
  NotificationType,
  // Subscription
  SubscriptionTierResponseDto,
  SubscriptionAnalyticsDto,
  SubscriptionTier,
  RoleTierCountDto,
  ByRoleAndTierDto,
  RevenueDto,
  // Bookmark
  StoreBookmarkResponseDto,
  ProductBookmarkResponseDto,
  StoreBookmarkDto,
  ProductBookmarkDto,
  ListBookmarksDto,
  // AI
  ChatRequestDto,
  ChatResponseDto,
  ProductRecommendationItemDto,
  StoreRecommendationItemDto,
  PromotionRecommendationItemDto,
  // File
  FileUploadResponse,
  FileDeleteResponse,
  ClearAllFilesResponse,
} from "./swagger";

