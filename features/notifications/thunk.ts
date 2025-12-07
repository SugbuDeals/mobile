import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { notificationsApi } from "@/services/api";
import {
  CreateNotificationDto,
  GetNotificationsParams,
  Notification,
  NotificationType,
} from "./types";

/**
 * Get user notifications with optional filters
 */
export const getNotifications = createAsyncThunk<
  Notification[],
  GetNotificationsParams | undefined,
  { rejectValue: { message: string }; state: RootState }
>(
  "notifications/getNotifications",
  async (params, { rejectWithValue }) => {
    try {
      const apiNotifications = await notificationsApi.getNotifications(params);
      // Map API notifications to feature Notification format
      return apiNotifications.map((n: any) => ({
        id: n.id,
        userId: 0, // Not returned by API, will need to be set from context
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt,
        readAt: n.readAt,
        productId: null, // Not returned by API
        storeId: null, // Not returned by API
        promotionId: null, // Not returned by API
      }));
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Get notifications failed",
      });
    }
  }
);

/**
 * Get unread notification count
 */
export const getUnreadCount = createAsyncThunk<
  number,
  void,
  { rejectValue: { message: string }; state: RootState }
>("notifications/getUnreadCount", async (_, { rejectWithValue }) => {
  try {
    const result = await notificationsApi.getUnreadCount();
    return result.count || 0;
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Get unread count failed",
    });
  }
});

/**
 * Mark a notification as read
 */
export const markAsRead = createAsyncThunk<
  Notification,
  number,
  { rejectValue: { message: string }; state: RootState }
>("notifications/markAsRead", async (id, { rejectWithValue }) => {
  try {
    const result = await notificationsApi.markAsRead(id);
    // Map API response to Notification format
    return {
      id: result.id,
      userId: 0, // Not returned by API
      type: "PRODUCT_CREATED" as any, // Not returned by API
      title: "",
      message: "",
      read: result.read,
      createdAt: result.readAt || new Date().toISOString(),
      readAt: result.readAt ? new Date(result.readAt) : null,
      productId: null,
      storeId: null,
      promotionId: null,
    };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Mark as read failed",
    });
  }
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = createAsyncThunk<
  void,
  void,
  { rejectValue: { message: string }; state: RootState }
>(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await notificationsApi.markAllAsRead();
      return;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Mark all as read failed",
      });
    }
  }
);

/**
 * Delete a notification
 */
export const deleteNotification = createAsyncThunk<
  Notification,
  number,
  { rejectValue: { message: string }; state: RootState }
>(
  "notifications/deleteNotification",
  async (id, { rejectWithValue }) => {
    try {
      await notificationsApi.deleteNotification(id);
      // Return a minimal notification object for the reducer
      return {
        id,
        userId: 0,
        type: "PRODUCT_CREATED" as any,
        title: "",
        message: "",
        read: false,
        createdAt: new Date().toISOString(),
        readAt: null,
        productId: null,
        storeId: null,
        promotionId: null,
      };
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Delete notification failed",
      });
    }
  }
);

/**
 * Create a notification (admin only)
 */
export const createNotification = createAsyncThunk<
  Notification,
  CreateNotificationDto,
  { rejectValue: { message: string }; state: RootState }
>(
  "notifications/createNotification",
  async (notificationData, { rejectWithValue }) => {
    try {
      const result = await notificationsApi.createNotification(notificationData);
      // Map API response to Notification format
      return {
        id: result.id,
        userId: result.userId,
        type: result.type as any,
        title: result.title,
        message: result.message,
        read: false,
        createdAt: new Date().toISOString(),
        readAt: null,
        productId: notificationData.productId || null,
        storeId: notificationData.storeId || null,
        promotionId: notificationData.promotionId || null,
      };
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Create notification failed",
      });
    }
  }
);

