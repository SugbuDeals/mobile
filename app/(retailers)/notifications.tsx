import { useNotifications } from "@/features/notifications";
import { useAppDispatch } from "@/store/hooks";
import {
  formatNotificationTime,
  getNotificationColor,
} from "@/utils/notifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const RetailerHeader = () => {
  const dispatch = useAppDispatch();
  const { action, state } = useNotifications();

  useEffect(() => {
    // Fetch unread count when header mounts
    action.getUnreadCount();
  }, []);

  return (
    <View style={headerStyles.headerShadowContainer}>
      <LinearGradient
        colors={["#FFBE5D", "#277874"]}
        style={headerStyles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" />
        <View style={headerStyles.headerContent}>
          <View style={headerStyles.headerLeft}>
            <View style={headerStyles.headerIcon}>
              <Ionicons name="storefront" size={24} color="#ffffff" />
            </View>
            <View style={headerStyles.headerText}>
              <Text style={headerStyles.headerTitle}>SugbuDeals</Text>
              <Text style={headerStyles.headerSubtitle}>Manage your Store</Text>
            </View>
          </View>

          {/* Right side buttons */}
          <View style={headerStyles.rightButtonsContainer}>
            {/* Notification Bell */}
            <TouchableOpacity
              style={headerStyles.notificationContainer}
              onPress={() => router.push("/(retailers)/notifications")}
            >
              <Ionicons 
                name={state.unreadCount > 0 ? "notifications" : "notifications-outline"} 
                size={20} 
                color="#ffffff" 
              />
              {state.unreadCount > 0 && (
                <View style={headerStyles.badge}>
                  <Text style={headerStyles.badgeText}>
                    {state.unreadCount > 99 ? "99+" : state.unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

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

  const handleNotificationPress = (notification: any) => {
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
      <RetailerHeader />

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
  content: { paddingHorizontal: 20, paddingBottom: 50 },
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
    bottom: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
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

const headerStyles = StyleSheet.create({
  headerShadowContainer: {
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderBottomRightRadius: 40,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#277874",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  rightButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationContainer: {
    width: 30,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#277874",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
});
