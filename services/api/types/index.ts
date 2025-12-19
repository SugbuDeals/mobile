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
    AddProductsToPromotionDto, AuthResponseDto, ByRoleAndTierDto,
    // Category
    CategoryResponseDto,
    // AI
    ChatRequestDto,
    ChatResponseDto, ClearAllFilesResponse, CreateCategoryDTO, CreateNotificationDto, CreateProductDTO, CreatePromotionDto, CreateStoreDTO,
    // Views
    EntityType, FileDeleteResponse,
    // File
    FileUploadResponse, ListBookmarksDto,
    // Auth
    LoginDTO, ManageStoreStatusDTO,
    // Notification
    NotificationResponseDto, NotificationType, ProductBookmarkDto, ProductBookmarkResponseDto, ProductRecommendationItemDto,
    // Product
    ProductResponseDto, PromotionRecommendationItemDto,
    // Promotion
    PromotionResponseDto, RecordViewDto, RegisterDTO, RevenueDto, RoleTierCountDto, StoreBookmarkDto,
    // Bookmark
    StoreBookmarkResponseDto, StoreRecommendationItemDto,
    // Store
    StoreResponseDto,
    StoreWithDistanceResponseDto, SubscriptionAnalyticsDto,
    SubscriptionTier,
    // Subscription
    SubscriptionTierResponseDto, UpdateCategoryDTO, UpdateProductDTO,
    UpdateProductStatusDTO, UpdatePromotionDto, UpdateStoreDTO, UpdateUserDTO, UserResponseDto, ViewCountResponseDto, ViewResponseDto
} from "./swagger";

