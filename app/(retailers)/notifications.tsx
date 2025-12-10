import { useNotifications } from "@/features/notifications";
import type { Notification as NotificationType } from "@/features/notifications/types";
import {
  formatNotificationTime,
  getNotificationColor,
} from "@/utils/notifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Notifications() {
  const router = useRouter();
  const { action, state } = useNotifications();

  useEffect(() => {
    // Fetch notifications when component mounts
    action.getNotifications({ skip: 0, take: 50 });
    action.getUnreadCount();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    await action.markAsRead(id);
    // Refresh unread count
    action.getUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await action.markAllAsRead();
    // Refresh notifications and unread count
    action.getNotifications({ skip: 0, take: 50 });
    action.getUnreadCount();
  };

  const handleNotificationPress = (notification: NotificationType) => {
    // Mark as read when pressed
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.productId) {
      // Navigate to product page if needed
      // router.push(`/product/${notification.productId}`);
    } else if (notification.storeId) {
      // Navigate to store page if needed
      // router.push(`/store/${notification.storeId}`);
    } else if (notification.promotionId) {
      // Navigate to promotion page if needed
      // router.push(`/promotion/${notification.promotionId}`);
    }
  };

  return (
    <View style={styles.container}>
      {state.loading && state.notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#277874" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {state.notifications.map((notification) => {
              const color = getNotificationColor(notification.type);
              const time = formatNotificationTime(notification.createdAt);
              
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.card,
                    !notification.read && styles.unreadCard,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: `${color}22`,
                        borderColor: color,
                      },
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: color }]} />
                  </View>
                  <View style={styles.body}>
                    <View style={styles.rowTop}>
                      <Text
                        style={[
                          styles.cardTitle,
                          !notification.read && styles.unreadTitle,
                        ]}
                      >
                        {notification.title}
                      </Text>
                      <Text style={styles.time}>{time}</Text>
                    </View>
                    <Text style={styles.desc}>{notification.message}</Text>
                  </View>
                  {!notification.read && (
                    <View style={styles.unreadIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
            {state.notifications.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>You&apos;re all caught up!</Text>
                <Text style={styles.emptySubtext}>
                  No notifications at the moment
                </Text>
              </View>
            )}
          </ScrollView>

          {state.notifications.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtnFixed}
              onPress={handleMarkAllAsRead}
              disabled={state.loading}
            >
              {state.loading ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <Text style={styles.clearText}>Mark All as Read</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}

      {state.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: Platform.OS === "ios" ? 120 : 100 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  clearBtnFixed: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: Platform.OS === "ios" ? 90 : 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  clearText: { color: "#6B7280", fontWeight: "700" },
  errorContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    position: "relative",
  },
  unreadCard: {
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 3,
    borderLeftColor: "#277874",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  dot: { width: 12, height: 12, borderRadius: 999 },
  body: { flex: 1 },
  rowTop: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: { fontWeight: "600", fontSize: 15 },
  unreadTitle: { fontWeight: "700" },
  time: { color: "#9CA3AF", fontSize: 13 },
  desc: { color: "#6B7280", fontSize: 14 },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#277874",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 4,
  },
});
