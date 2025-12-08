/**
 * Notification domain types
 * Uses Swagger-generated types from services/api/types/swagger
 */

import type {
  NotificationResponseDto,
  CreateNotificationDto,
  NotificationType,
} from "@/services/api/types/swagger";

// Re-export Swagger types
export type {
  NotificationResponseDto,
  CreateNotificationDto,
  NotificationType,
};

// Alias for backward compatibility
export type Notification = NotificationResponseDto;

export type GetNotificationsParams = {
  skip?: number;
  take?: number;
  read?: boolean;
};

