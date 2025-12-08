/**
 * Runtime type validation utilities
 * Type guards for critical API responses matching Swagger schemas
 */

import type {
  UserResponseDto,
  AuthResponseDto,
  StoreResponseDto,
  ProductResponseDto,
  PromotionResponseDto,
  CategoryResponseDto,
  NotificationResponseDto,
  SubscriptionResponseDto,
  UserSubscriptionResponseDto,
} from "@/services/api/types/swagger";

/**
 * Type guard for UserResponseDto
 */
export function isUserResponseDto(data: unknown): data is UserResponseDto {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "number" &&
    typeof obj.email === "string" &&
    typeof obj.name === "string" &&
    typeof obj.createdAt === "string" &&
    typeof obj.role === "string" &&
    ["CONSUMER", "RETAILER", "ADMIN"].includes(obj.role) &&
    (obj.imageUrl === null || typeof obj.imageUrl === "string")
  );
}

/**
 * Type guard for AuthResponseDto
 */
export function isAuthResponseDto(data: unknown): data is AuthResponseDto {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.access_token === "string" &&
    isUserResponseDto(obj.user)
  );
}

/**
 * Type guard for StoreResponseDto
 */
export function isStoreResponseDto(data: unknown): data is StoreResponseDto {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    typeof obj.description === "string" &&
    typeof obj.createdAt === "string" &&
    typeof obj.verificationStatus === "string" &&
    ["UNVERIFIED", "VERIFIED"].includes(obj.verificationStatus) &&
    typeof obj.ownerId === "number" &&
    typeof obj.isActive === "boolean" &&
    (obj.imageUrl === null || typeof obj.imageUrl === "string") &&
    (obj.bannerUrl === null || typeof obj.bannerUrl === "string") &&
    (obj.latitude === null || typeof obj.latitude === "number") &&
    (obj.longitude === null || typeof obj.longitude === "number")
  );
}

/**
 * Type guard for ProductResponseDto
 */
export function isProductResponseDto(data: unknown): data is ProductResponseDto {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    typeof obj.description === "string" &&
    typeof obj.price === "string" &&
    typeof obj.stock === "number" &&
    typeof obj.createdAt === "string" &&
    typeof obj.isActive === "boolean" &&
    typeof obj.storeId === "number" &&
    (obj.categoryId === null || typeof obj.categoryId === "number") &&
    (obj.imageUrl === null || typeof obj.imageUrl === "string")
  );
}

/**
 * Type guard for PromotionResponseDto
 */
export function isPromotionResponseDto(data: unknown): data is PromotionResponseDto {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "number" &&
    typeof obj.title === "string" &&
    typeof obj.type === "string" &&
    typeof obj.description === "string" &&
    typeof obj.startsAt === "string" &&
    typeof obj.active === "boolean" &&
    typeof obj.discount === "number" &&
    (obj.endsAt === null || typeof obj.endsAt === "string") &&
    (obj.productId === null || typeof obj.productId === "number")
  );
}

/**
 * Type guard for CategoryResponseDto
 */
export function isCategoryResponseDto(data: unknown): data is CategoryResponseDto {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    typeof obj.createdAt === "string" &&
    typeof obj.updatedAt === "string"
  );
}

/**
 * Type guard for NotificationResponseDto
 */
export function isNotificationResponseDto(data: unknown): data is NotificationResponseDto {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "number" &&
    typeof obj.userId === "number" &&
    typeof obj.type === "string" &&
    typeof obj.title === "string" &&
    typeof obj.message === "string" &&
    typeof obj.read === "boolean" &&
    typeof obj.createdAt === "string" &&
    (obj.readAt === null || typeof obj.readAt === "string") &&
    (obj.productId === null || typeof obj.productId === "number") &&
    (obj.storeId === null || typeof obj.storeId === "number") &&
    (obj.promotionId === null || typeof obj.promotionId === "number")
  );
}

/**
 * Type guard for SubscriptionResponseDto
 */
export function isSubscriptionResponseDto(data: unknown): data is SubscriptionResponseDto {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    typeof obj.plan === "string" &&
    ["FREE", "BASIC", "PREMIUM"].includes(obj.plan) &&
    typeof obj.billingCycle === "string" &&
    ["MONTHLY", "YEARLY"].includes(obj.billingCycle) &&
    typeof obj.price === "string" &&
    typeof obj.isActive === "boolean" &&
    typeof obj.createdAt === "string" &&
    typeof obj.updatedAt === "string" &&
    typeof obj.startsAt === "string" &&
    (obj.description === null || typeof obj.description === "string") &&
    (obj.benefits === null || typeof obj.benefits === "string") &&
    (obj.endsAt === null || typeof obj.endsAt === "string")
  );
}

/**
 * Type guard for UserSubscriptionResponseDto
 */
export function isUserSubscriptionResponseDto(data: unknown): data is UserSubscriptionResponseDto {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "number" &&
    typeof obj.userId === "number" &&
    typeof obj.subscriptionId === "number" &&
    typeof obj.status === "string" &&
    ["ACTIVE", "CANCELLED", "EXPIRED", "PENDING"].includes(obj.status) &&
    typeof obj.price === "string" &&
    typeof obj.billingCycle === "string" &&
    ["MONTHLY", "YEARLY"].includes(obj.billingCycle) &&
    typeof obj.startsAt === "string" &&
    typeof obj.createdAt === "string" &&
    typeof obj.updatedAt === "string" &&
    (obj.endsAt === null || typeof obj.endsAt === "string") &&
    (obj.cancelledAt === null || typeof obj.cancelledAt === "string")
  );
}

/**
 * Validate array of items with a type guard
 */
export function validateArray<T>(
  data: unknown,
  guard: (item: unknown) => item is T
): data is T[] {
  if (!Array.isArray(data)) return false;
  return data.every(guard);
}

