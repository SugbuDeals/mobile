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
        // Calculate unread count from the notifications array
        state.unreadCount = action.payload.filter((n) => !n.read).length;
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
          // Check if notification was previously unread
          const wasUnread = !state.notifications[index].read;
          state.notifications[index] = action.payload;
          // Decrease unread count if notification was previously unread
          if (wasUnread && action.payload.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Mark as read failed";
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
        state.unreadCount = 0;
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
        // Find the notification before removing it
        const notification = state.notifications.find(
          (n) => n.id === action.payload.id
        );
        // Remove the notification from the list
        state.notifications = state.notifications.filter(
          (n) => n.id !== action.payload.id
        );
        // Decrease unread count if notification was unread
        if (notification && !notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
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
        // Increase unread count if notification is unread
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Create notification failed";
      });
  },
});

export const { clearNotifications } = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;

