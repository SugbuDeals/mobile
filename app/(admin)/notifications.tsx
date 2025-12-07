import { useNotifications } from "@/features/notifications";
import { useStore } from "@/features/store";
import {
    formatNotificationTime,
    getNotificationColor,
} from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ===== MAIN COMPONENT =====
export default function AdminNotifications() {
  const router = useRouter();
  const { action, state } = useNotifications();
  const { state: storeState, action: storeActions } = useStore();

  useEffect(() => {
    // Fetch notifications when component mounts
    action.getNotifications({ skip: 0, take: 50 });
    action.getUnreadCount();

    if (!storeState.products.length) {
      storeActions.findProducts();
    }
    if (!storeState.stores.length) {
      storeActions.findStores();
    }
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
      // Find the product to determine its store for deep linking
      const product = storeState.products.find(
        (p: any) => String(p.id) === String(notification.productId)
      );

      if (product?.storeId) {
        const store = storeState.stores.find(
          (s: any) => String(s.id) === String(product.storeId)
        );

        router.push({
          pathname: "/(admin)/store-details",
          params: {
            storeId: String(product.storeId),
            storeName:
              store?.name ||
              notification.storeName ||
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
          storeName: notification.storeName || notification.title || undefined,
        },
      });
    } else if (notification.promotionId) {
      // For now, route to the admin promotions overview
      router.push("/(admin)/view-promotion");
    }
  };

  return (
    <View style={styles.container}>
      {state.loading && state.notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Notification List */}
            <NotificationList 
              notifications={state.notifications}
              onNotificationPress={handleNotificationPress}
            />
          </ScrollView>
          
          {/* Clear All Button - Fixed above tabbar */}
          {state.notifications.length > 0 && (
            <ClearAllButton 
              onClearAll={handleMarkAllAsRead}
              loading={state.loading}
            />
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

// ===== SUB-COMPONENTS =====

// Notification List Component
const NotificationList = ({ 
  notifications,
  onNotificationPress,
}: {
  notifications: any[];
  onNotificationPress: (notification: any) => void;
}) => (
  <>
    {notifications.map((notification) => (
      <NotificationCard 
        key={notification.id} 
        notification={notification}
        onPress={() => onNotificationPress(notification)}
      />
    ))}
    {notifications.length === 0 && (
      <EmptyState />
    )}
  </>
);

// Individual Notification Card Component
const NotificationCard = ({ 
  notification,
  onPress,
}: {
  notification: any;
  onPress: () => void;
}) => {
  const color = getNotificationColor(notification.type);
  const time = formatNotificationTime(notification.createdAt);
  
  return (
    <TouchableOpacity
      style={[
        styles.card,
        !notification.read && styles.unreadCard,
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { 
        backgroundColor: `${color}22`, 
        borderColor: color 
      }]}> 
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
      <View style={styles.body}>
        <View style={styles.rowTop}>
          <Text style={[
            styles.cardTitle,
            !notification.read && styles.unreadTitle,
          ]}>
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
};

// Empty State Component
const EmptyState = () => (
  <View style={styles.emptyState}>
    <Ionicons name="notifications-outline" size={64} color="#D1D5DB" />
    <Text style={styles.emptyText}>You're all caught up!</Text>
    <Text style={styles.emptySubtext}>
      No notifications at the moment
    </Text>
  </View>
);

// Clear All Button Component
const ClearAllButton = ({ 
  onClearAll,
  loading,
}: {
  onClearAll: () => void;
  loading: boolean;
}) => (
  <TouchableOpacity 
    style={styles.clearButtonFixed} 
    onPress={onClearAll}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator size="small" color="#6B7280" />
    ) : (
      <Text style={styles.clearText}>Mark All as Read</Text>
    )}
  </TouchableOpacity>
);

// ===== STYLES =====
const styles = StyleSheet.create({
  // ===== MAIN LAYOUT STYLES =====
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 120 : 100,
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
  
  // ===== NOTIFICATION CARD STYLES =====
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  body: {
    flex: 1,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: 16,
    color: "#1F2937",
    flex: 1,
  },
  unreadTitle: {
    fontWeight: "700",
  },
  time: {
    color: "#9CA3AF",
    fontSize: 12,
    marginLeft: 8,
  },
  desc: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
    marginLeft: 8,
  },
  
  // ===== EMPTY STATE STYLES =====
  emptyState: {
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
  
  // ===== CLEAR ALL BUTTON STYLES =====
  clearButtonFixed: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: Platform.OS === "ios" ? 20 : 5,
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
  clearText: {
    color: "#6B7280",
    fontWeight: "700",
    fontSize: 16,
  },
  
  // ===== ERROR STYLES =====
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
});
