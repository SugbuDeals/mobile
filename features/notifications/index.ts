import { useAppDispatch, useAppSelector } from "@/store/hooks";
import * as thunk from "./thunk";
import { CreateNotificationDto, GetNotificationsParams } from "./types";

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, loading, error } = useAppSelector(
    (state) => state.notifications
  );

  const getNotifications = (params?: GetNotificationsParams) =>
    dispatch(thunk.getNotifications(params));
  const getUnreadCount = () => dispatch(thunk.getUnreadCount());
  const markAsRead = (id: number) => dispatch(thunk.markAsRead(id));
  const markAllAsRead = () => dispatch(thunk.markAllAsRead());
  const deleteNotification = (id: number) =>
    dispatch(thunk.deleteNotification(id));
  const createNotification = (data: CreateNotificationDto) =>
    dispatch(thunk.createNotification(data));

  return {
    action: {
      getNotifications,
      getUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      createNotification,
    },
    state: {
      notifications,
      unreadCount,
      loading,
      error,
    },
  };
};

