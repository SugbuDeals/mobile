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
  // Category
  CategoryResponseDto,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  // Notification
  NotificationResponseDto,
  CreateNotificationDto,
  NotificationType,
  // Subscription
  SubscriptionResponseDto,
  UserSubscriptionResponseDto,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  JoinSubscriptionDTO,
  UpdateRetailerSubscriptionDTO,
  SubscriptionAnalyticsDTO,
  SubscriptionPlan,
  BillingCycle,
  SubscriptionStatus,
  // Bookmark
  StoreBookmarkResponseDto,
  ProductBookmarkResponseDto,
  StoreBookmarkDto,
  ProductBookmarkDto,
  ListBookmarksDto,
  // AI
  ChatRequestDto,
  ChatResponseDto,
  ChatMessageDto,
  FreeformRecommendationDto,
  RecommendationResponseDto,
  ProductRecommendationItemDto,
  StoreRecommendationItemDto,
  PromotionRecommendationItemDto,
  SimilarProductsDto,
  SimilarProductsResponseDto,
  RecommendationIntent,
  // File
  FileUploadResponse,
  FileDeleteResponse,
  ClearAllFilesResponse,
} from "./swagger";

