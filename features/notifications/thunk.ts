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
      return apiNotifications.map((n) => ({
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
    } catch (error: unknown) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Get notifications failed",
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
  } catch (error: unknown) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : "Get unread count failed",
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
>("notifications/markAsRead", async (id, { rejectWithValue, dispatch }) => {
  try {
    const result = await notificationsApi.markAsRead(id);
    // Automatically refresh unread count
    dispatch(getUnreadCount());
    return result;
  } catch (error: unknown) {
    return rejectWithValue({
      message: error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Mark as read failed",
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
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await notificationsApi.markAllAsRead();
      // Automatically refresh unread count
      dispatch(getUnreadCount());
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
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await notificationsApi.deleteNotification(id);
      // Automatically refresh unread count
      dispatch(getUnreadCount());
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
  async (notificationData, { rejectWithValue, dispatch }) => {
    try {
      const result = await notificationsApi.createNotification(notificationData);
      // Automatically refresh unread count
      dispatch(getUnreadCount());
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
    } catch (error: unknown) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Create notification failed",
      });
    }
  }
);

