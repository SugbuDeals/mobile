/**
 * Notification API endpoints
 */

import { getApiClient } from "../client";

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

/**
 * NotificationResponseDto matching server.json NotificationResponseDto
 */
export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO 8601 format date-time (required per server.json)
  readAt: string | null; // ISO 8601 format date-time, nullable per server.json
  productId: number | null; // Nullable per server.json
  storeId: number | null; // Nullable per server.json
  promotionId: number | null; // Nullable per server.json
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

export interface GetNotificationsParams {
  skip?: number;
  take?: number;
  read?: boolean;
  [key: string]: unknown;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAllAsReadResponse {
  count: number;
}

export const notificationsApi = {
  /**
   * Get user notifications with optional filters
   */
  getNotifications: (
    params?: GetNotificationsParams
  ): Promise<Notification[]> => {
    return getApiClient().get<Notification[]>("/notifications", params);
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: (): Promise<UnreadCountResponse> => {
    return getApiClient().get<UnreadCountResponse>(
      "/notifications/unread-count"
    );
  },

  /**
   * Mark a notification as read
   * Returns NotificationResponseDto per server.json
   */
  markAsRead: (
    notificationId: number
  ): Promise<Notification> => {
    return getApiClient().patch<Notification>(
      `/notifications/${notificationId}/read`
    );
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: (): Promise<MarkAllAsReadResponse> => {
    return getApiClient().patch<MarkAllAsReadResponse>(
      "/notifications/mark-all-read"
    );
  },

  /**
   * Create a notification
   * Returns NotificationResponseDto per server.json
   */
  createNotification: (
    data: CreateNotificationDto
  ): Promise<Notification> => {
    return getApiClient().post<Notification>("/notifications", data);
  },

  /**
   * Delete a notification
   * Returns NotificationResponseDto per server.json (not partial)
   */
  deleteNotification: (
    notificationId: number
  ): Promise<Notification> => {
    return getApiClient().delete<Notification>(
      `/notifications/${notificationId}`
    );
  },
};

