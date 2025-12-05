import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNotifications } from "@/features/notifications";
import {
  formatNotificationTime,
  getNotificationColor,
} from "@/utils/notifications";

export default function Notifications() {
  const router = useRouter();
  const { action, state } = useNotifications();
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  useEffect(() => {
    // Fetch notifications when component mounts
    action.getNotifications({ skip: 0, take: 50 });
    action.getUnreadCount();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      setMarkingAsRead(id);
      await action.markAsRead(id);
      // Unread count is automatically updated in the slice
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      await action.markAllAsRead();
      // Refresh notifications list to ensure UI is updated
      action.getNotifications({ skip: 0, take: 50 });
      // Unread count is automatically updated in the slice
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const handleNotificationPress = (notification: any) => {
    // Mark as read when pressed
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.storeId) {
      // Navigate to store details page
      router.push({
        pathname: "/(consumers)/storedetails",
        params: { 
          storeId: notification.storeId.toString(),
        },
      });
    } else if (notification.productId) {
      // Navigate to product page if needed
      // router.push(`/product/${notification.productId}`);
    } else if (notification.promotionId) {
      // Navigate to promotion page if needed
      // router.push(`/promotion/${notification.promotionId}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerShadowContainer}>
        <LinearGradient
          colors={["#FFBE5D", "#277874"]}
          style={styles.headerContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <StatusBar
            barStyle="light-content"
            translucent
            backgroundColor="transparent"
          />
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </LinearGradient>
      </View>

      {state.loading && state.notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
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
                  disabled={markingAsRead === notification.id}
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
                  {markingAsRead === notification.id ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : !notification.read ? (
                    <View style={styles.unreadIndicator} />
                  ) : null}
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
              disabled={markingAllAsRead}
            >
              {markingAllAsRead ? (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  headerShadowContainer: {
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 40,
  },
  content: { 
    paddingHorizontal: 20, 
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 120 : 100 
  },
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
    bottom: Platform.OS === "ios" ? 90 : 70,
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
    bottom: 20,
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
    borderLeftColor: "#3B82F6",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: { fontWeight: "600", fontSize: 15 },
  unreadTitle: { fontWeight: "700" },
  time: { color: "#9CA3AF", fontSize: 12 },
  desc: { color: "#6B7280", fontSize: 14 },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
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
