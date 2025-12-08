/**
 * Notification API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - GET /notifications (operationId: NotificationController_getUserNotifications)
 * - GET /notifications/unread-count (operationId: NotificationController_getUnreadCount)
 * - POST /notifications (operationId: NotificationController_createNotification)
 * - PATCH /notifications/{id}/read (operationId: NotificationController_markAsRead)
 * - PATCH /notifications/mark-all-read (operationId: NotificationController_markAllAsRead)
 * - DELETE /notifications/{id} (operationId: NotificationController_deleteNotification)
 */

import { getApiClient } from "../client";
import type {
  NotificationResponseDto,
  CreateNotificationDto,
  NotificationType,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
  NotificationResponseDto,
  CreateNotificationDto,
  NotificationType,
};

// Alias for backward compatibility
export type Notification = NotificationResponseDto;

export interface GetNotificationsParams {
  skip?: number;
  take?: number;
  read?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAllAsReadResponse {
  count: number;
}

export const notificationsApi = {
  /**
   * Get user notifications with optional filters and pagination
   * Operation: NotificationController_getUserNotifications
   * Endpoint: GET /notifications
   */
  getNotifications: (
    params?: GetNotificationsParams
  ): Promise<NotificationResponseDto[]> => {
    return getApiClient().get<NotificationResponseDto[]>("/notifications", params);
  },

  /**
   * Get unread notification count
   * Operation: NotificationController_getUnreadCount
   * Endpoint: GET /notifications/unread-count
   */
  getUnreadCount: (): Promise<UnreadCountResponse> => {
    return getApiClient().get<UnreadCountResponse>(
      "/notifications/unread-count"
    );
  },

  /**
   * Mark a notification as read
   * Operation: NotificationController_markAsRead
   * Endpoint: PATCH /notifications/{id}/read
   */
  markAsRead: (
    notificationId: number
  ): Promise<NotificationResponseDto> => {
    return getApiClient().patch<NotificationResponseDto>(
      `/notifications/${notificationId}/read`
    );
  },

  /**
   * Mark all notifications as read
   * Operation: NotificationController_markAllAsRead
   * Endpoint: PATCH /notifications/mark-all-read
   */
  markAllAsRead: (): Promise<MarkAllAsReadResponse> => {
    return getApiClient().patch<MarkAllAsReadResponse>(
      "/notifications/mark-all-read"
    );
  },

  /**
   * Create a notification
   * Operation: NotificationController_createNotification
   * Endpoint: POST /notifications
   */
  createNotification: (
    data: CreateNotificationDto
  ): Promise<NotificationResponseDto> => {
    return getApiClient().post<NotificationResponseDto>("/notifications", data);
  },

  /**
   * Delete a notification
   * Operation: NotificationController_deleteNotification
   * Endpoint: DELETE /notifications/{id}
   */
  deleteNotification: (
    notificationId: number
  ): Promise<NotificationResponseDto> => {
    return getApiClient().delete<NotificationResponseDto>(
      `/notifications/${notificationId}`
    );
  },
};

