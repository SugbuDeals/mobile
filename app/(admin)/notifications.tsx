import { useNotifications } from "@/features/notifications";
import type { Notification as NotificationType } from "@/features/notifications/types";
import { useStore } from "@/features/store";
import {
    formatNotificationTime,
    getNotificationColor,
    getNotificationTypeTitle,
} from "@/utils/notifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

// Helper function to get icon for notification type
function getNotificationIcon(type: string): keyof typeof Ionicons.glyphMap {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    PRODUCT_CREATED: "cube",
    PRODUCT_PRICE_CHANGED: "pricetag",
    PRODUCT_STOCK_CHANGED: "layers",
    PRODUCT_STATUS_CHANGED: "information-circle",
    PROMOTION_CREATED: "gift",
    PROMOTION_STARTED: "flash",
    PROMOTION_ENDING_SOON: "time",
    PROMOTION_ENDED: "checkmark-circle",
    PROMOTION_NEARBY: "location",
    STORE_VERIFIED: "checkmark-circle",
    STORE_CREATED: "storefront",
    STORE_UNDER_REVIEW: "hourglass",
    SUBSCRIPTION_JOINED: "star",
    SUBSCRIPTION_CANCELLED: "close-circle",
    SUBSCRIPTION_EXPIRED: "alert-circle",
    SUBSCRIPTION_RENEWED: "refresh",
    SUBSCRIPTION_ENDING_SOON: "time",
    SUBSCRIPTION_AVAILABLE: "sparkles",
    CONSUMER_WELCOME: "hand-left",
    GPS_REMINDER: "navigate",
    QUESTIONABLE_PRICING_PRODUCT: "warning",
    QUESTIONABLE_PRICING_PROMOTION: "warning",
  };
  return iconMap[type] || "notifications";
}

// ===== MAIN COMPONENT =====
export default function AdminNotifications() {
  const router = useRouter();
  const { action, state } = useNotifications();
  const { state: storeState, action: storeActions } = useStore();
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    // Fetch notifications when component mounts, then refresh unread count
    const fetchData = async () => {
      await action.getNotifications({ skip: 0, take: 50 });
      // Always refresh unread count after fetching notifications to ensure accuracy
      action.getUnreadCount();
    };
    fetchData();

    if (!storeState.products || !storeState.products.length) {
      storeActions.findProducts();
    }
    if (!storeState.stores || !storeState.stores.length) {
      storeActions.findStores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await action.getNotifications({ skip: 0, take: 50 });
        // Always refresh unread count after fetching notifications to ensure accuracy
        action.getUnreadCount();
      };
      fetchData();
    }, [action])
  );

  const handleMarkAsRead = async (id: number) => {
    try {
      setMarkingAsRead(id);
      await action.markAsRead(id);
      // Refresh notifications list to ensure UI reflects the read status
      await action.getNotifications({ skip: 0, take: 50 });
      // Refresh unread count to update header bell icon
      action.getUnreadCount();
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
      // Refresh notifications list to ensure UI is updated, then refresh count
      await action.getNotifications({ skip: 0, take: 50 });
      // Always refresh unread count after fetching notifications to ensure accuracy
      action.getUnreadCount();
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeletingAll(true);
      // Get all notifications
      const notificationsToDelete = state.notifications;
      
      // Delete each notification
      await Promise.all(
        notificationsToDelete.map((notification) =>
          action.deleteNotification(notification.id)
        )
      );
      
      // Refresh notifications list, then refresh count
      await action.getNotifications({ skip: 0, take: 50 });
      // Always refresh unread count after fetching notifications to ensure accuracy
      action.getUnreadCount();
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    } finally {
      setDeletingAll(false);
    }
  };

  const handleNotificationPress = async (notification: NotificationType) => {
    // Mark as read when pressed (if unread) - don't await to avoid blocking UI
    if (!notification.read) {
      handleMarkAsRead(notification.id).catch(console.error);
    }
    
    // Navigate immediately based on notification type
    if (notification.productId) {
      // Find the product to determine its store for deep linking
      const product = storeState.products.find(
        (p) => String(p.id) === String(notification.productId)
      );

      if (product?.storeId) {
        const store = storeState.stores.find(
          (s) => String(s.id) === String(product.storeId)
        );

        router.push({
          pathname: "/(admin)/store-details",
          params: {
            storeId: String(product.storeId),
            storeName:
              store?.name ||
              notification.title ||
              undefined,
          },
        });
      } else {
        // Fallback: go to products list
        router.push("/(admin)/view-product");
      }
    } else if (notification.storeId) {
      // Navigate to the specific store details
      router.push({
        pathname: "/(admin)/store-details",
        params: {
          storeId: String(notification.storeId),
          storeName: notification.title || undefined,
        },
      });
    } else if (notification.promotionId) {
      // Route to the admin promotions overview
      router.push("/(admin)/view-promotion");
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
            {state.notifications.length > 0 && (
              <TouchableOpacity
                style={styles.deleteAllButton}
                onPress={handleDeleteAll}
                disabled={deletingAll}
              >
                {deletingAll ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="trash-outline" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            )}
            {state.notifications.length === 0 && (
              <View style={styles.headerPlaceholder} />
            )}
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
            {state.notifications.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {state.unreadCount > 0 
                    ? `${state.unreadCount} New Notification${state.unreadCount > 1 ? 's' : ''}`
                    : 'All Notifications'}
                </Text>
                <TouchableOpacity
                  style={styles.markAllReadButton}
                  onPress={handleMarkAllAsRead}
                  disabled={markingAllAsRead || state.unreadCount === 0}
                >
                  {markingAllAsRead ? (
                    <ActivityIndicator size="small" color="#277874" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={16} color="#277874" />
                      <Text style={styles.markAllReadText}>Mark All Read</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {state.notifications.map((notification) => {
              const color = getNotificationColor(notification.type);
              const time = formatNotificationTime(notification.createdAt);
              const typeTitle = getNotificationTypeTitle(notification.type);
              const isMarkingAsRead = markingAsRead === notification.id;
              
              const cardContent = (
                <View style={styles.cardContent}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: `${color}15`,
                        borderColor: color,
                      },
                    ]}
                  >
                    <Ionicons 
                      name={getNotificationIcon(notification.type)} 
                      size={20} 
                      color={color} 
                    />
                  </View>
                  <View style={styles.body}>
                    <View style={styles.rowTop}>
                      <View style={styles.titleContainer}>
                        <Text
                          style={[
                            styles.cardTitle,
                            !notification.read && styles.unreadTitle,
                          ]}
                          numberOfLines={1}
                        >
                          {notification.title}
                        </Text>
                        {!notification.read && !isMarkingAsRead && (
                          <View style={[styles.unreadDot, { backgroundColor: color }]} />
                        )}
                      </View>
                      <Text style={styles.time}>{time}</Text>
                    </View>
                    <Text style={styles.typeLabel}>{typeTitle}</Text>
                    <Text style={styles.desc} numberOfLines={2}>
                      {notification.message}
                    </Text>
                  </View>
                  {isMarkingAsRead && (
                    <View style={styles.loadingIndicator}>
                      <ActivityIndicator size="small" color="#3B82F6" />
                    </View>
                  )}
                </View>
              );

              const cardStyle = [
                styles.card,
                !notification.read && styles.unreadCard,
                isMarkingAsRead && styles.readingCard,
              ];

              if (isMarkingAsRead) {
                return (
                  <View
                    key={notification.id}
                    style={cardStyle}
                  >
                    {cardContent}
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={notification.id}
                  style={cardStyle}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.6}
                >
                  {cardContent}
                </TouchableOpacity>
              );
            })}
            {state.notifications.length === 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="notifications-outline" size={80} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyText}>You&apos;re all caught up!</Text>
                <Text style={styles.emptySubtext}>
                  No notifications at the moment. Check back later for updates.
                </Text>
              </View>
            )}
          </ScrollView>
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
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
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
  deleteAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { 
    paddingHorizontal: 16, 
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 80 : 60 
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  markAllReadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  markAllReadText: {
    color: "#277874",
    fontWeight: "600",
    fontSize: 13,
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
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  unreadCard: {
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  readingCard: {
    opacity: 0.8,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  loadingIndicator: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 24,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 2,
  },
  body: { flex: 1 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  cardTitle: { 
    fontWeight: "600", 
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  unreadTitle: { fontWeight: "700" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  time: { 
    color: "#9CA3AF", 
    fontSize: 12,
    fontWeight: "500",
  },
  desc: { 
    color: "#374151", 
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyText: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#6B7280",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
