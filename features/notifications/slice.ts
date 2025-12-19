import { createSlice } from "@reduxjs/toolkit";
import {
  createNotification,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "./thunk";
import { Notification } from "./types";

const initialState: {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
} = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    /**
     * [GET] notifications/getNotifications
     */
    builder
      .addCase(getNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.notifications = action.payload;
        // DO NOT update unread count here - it should ONLY come from getUnreadCount API call
        // This prevents race conditions where getNotifications overwrites the correct count
        // The unread count is managed separately via getUnreadCount API call
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as { message?: string })?.message || "Get notifications failed";
      })
      /**
       * [GET] notifications/getUnreadCount
       */
      .addCase(getUnreadCount.pending, (state) => {
        // Don't set loading to true for unread count to avoid UI flicker
      })
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        // Always update with the accurate count from API (source of truth)
        // This will override any count calculated from getNotifications
        state.unreadCount = action.payload;
      })
      .addCase(getUnreadCount.rejected, (state, action) => {
        state.error = action.payload?.message || "Get unread count failed";
      })
      /**
       * [PATCH] notifications/markAsRead
       */
      .addCase(markAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Update the notification in the list
        const index = state.notifications.findIndex(
          (n) => n.id === action.payload.id
        );
        if (index !== -1) {
          state.notifications[index] = action.payload;
        }
        // Unread count will be refreshed via getUnreadCount() call
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload && typeof action.payload === 'object' && 'message' in action.payload)
          ? String(action.payload.message)
          : "Mark as read failed";
      })
      /**
       * [PATCH] notifications/markAllAsRead
       */
      .addCase(markAllAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // Mark all notifications as read
        state.notifications = state.notifications.map((n) => ({
          ...n,
          read: true,
        }));
        // Unread count will be refreshed via getUnreadCount() call
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Mark all as read failed";
      })
      /**
       * [DELETE] notifications/deleteNotification
       */
      .addCase(deleteNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Remove the notification from the list
        state.notifications = state.notifications.filter(
          (n) => n.id !== action.payload.id
        );
        // Unread count will be refreshed via getUnreadCount() call
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Delete notification failed";
      })
      /**
       * [POST] notifications/createNotification
       */
      .addCase(createNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Add the new notification to the list
        state.notifications.unshift(action.payload);
        // Unread count will be refreshed via getUnreadCount() call
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Create notification failed";
      });
  },
});

export const { clearNotifications } = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;

