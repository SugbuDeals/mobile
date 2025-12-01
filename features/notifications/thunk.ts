import env from "@/config/env";
import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  CreateNotificationDto,
  GetNotificationsParams,
  Notification,
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
  async (params, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().auth;

      if (!accessToken) {
        return rejectWithValue({
          message: "Authentication required. Please log in again.",
        });
      }

      const queryParams = new URLSearchParams();
      if (params?.skip !== undefined) {
        queryParams.append("skip", params.skip.toString());
      }
      if (params?.take !== undefined) {
        queryParams.append("take", params.take.toString());
      }
      if (params?.read !== undefined) {
        queryParams.append("read", params.read.toString());
      }

      const queryString = queryParams.toString();
      const url = `${env.API_BASE_URL}/notifications${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return rejectWithValue({
          message: error.message || "Get notifications failed",
        });
      }

      return response.json();
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
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
>("notifications/getUnreadCount", async (_, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(
      `${env.API_BASE_URL}/notifications/unread-count`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Get unread count failed",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
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
>("notifications/markAsRead", async (id, { rejectWithValue, getState }) => {
  try {
    const { accessToken } = getState().auth;

    if (!accessToken) {
      return rejectWithValue({
        message: "Authentication required. Please log in again.",
      });
    }

    const response = await fetch(
      `${env.API_BASE_URL}/notifications/${id}/read`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Mark as read failed",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
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
  async (_, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().auth;

      if (!accessToken) {
        return rejectWithValue({
          message: "Authentication required. Please log in again.",
        });
      }

      const response = await fetch(
        `${env.API_BASE_URL}/notifications/mark-all-read`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return rejectWithValue({
          message: error.message || "Mark all as read failed",
        });
      }

      // Response might be empty, so we don't return anything
      return;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
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
  async (id, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().auth;

      if (!accessToken) {
        return rejectWithValue({
          message: "Authentication required. Please log in again.",
        });
      }

      const response = await fetch(`${env.API_BASE_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return rejectWithValue({
          message: error.message || "Delete notification failed",
        });
      }

      return response.json();
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
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
  async (notificationData, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().auth;

      if (!accessToken) {
        return rejectWithValue({
          message: "Authentication required. Please log in again.",
        });
      }

      const response = await fetch(`${env.API_BASE_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return rejectWithValue({
          message: error.message || "Create notification failed",
        });
      }

      return response.json();
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }
);

