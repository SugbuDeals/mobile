import { logout } from "@/features/auth/slice";
import { useNotifications } from "@/features/notifications";
import { useStoreManagement } from "@/features/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, router } from "expo-router";
import React, { useEffect } from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const RetailerHeader = () => {
  const dispatch = useAppDispatch();
  const { action, state } = useNotifications();
  const { userStore } = useStoreManagement();

  useEffect(() => {
    // Fetch unread count when header mounts
    action.getUnreadCount();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/auth/login");
  };

  return (
    <View style={styles.headerShadowContainer}>
      <LinearGradient
        colors={["#FFBE5D", "#277874"]}
        style={[styles.headerContainer, hasDualRole && styles.headerContainerCompact]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="storefront" size={24} color="#ffffff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>
                SugbuDeals
              </Text>
              <Text style={styles.headerSubtitle}>Manage your Store</Text>
            </View>
          </View>

        <View style={styles.rightButtonsContainer}>
          <TouchableOpacity
            style={styles.notificationContainer}
            onPress={() => router.push("/(retailers)/notifications")}
          >
            <Ionicons
              name={
                state.unreadCount > 0
                  ? "notifications"
                  : "notifications-outline"
              }
              size={20}
              color="#ffffff"
            />
            {state.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {state.unreadCount > 99 ? "99+" : state.unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Role switcher moved to settings page for dual accounts */}

          <TouchableOpacity
            style={styles.logoutContainer}
            onPress={handleLogout}
          >
            <Ionicons name="exit-outline" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
        </View>

        {/* Unverified store reminder */}
        { userStore &&
          userStore.verificationStatus &&
          userStore.verificationStatus !== "VERIFIED" && (
            <View style={styles.unverifiedBanner}>
              <Ionicons
                name="shield-outline"
                size={16}
                color="#B45309"
                style={{ marginRight: 6 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.unverifiedTitle}>
                  Your store is currently unverified
                </Text>
                <Text style={styles.unverifiedText}>
                  Customers cannot see your store, products, or promotions yet.
                  You can still add and manage them while waiting for
                  verification.
                </Text>
              </View>
            </View>
          )}
      </LinearGradient>
    </View>
  );
};

export default function RetailersLayout() {
  // Load user's store data for all retailer pages
  const { userStore, storeLoading } = useStoreManagement();
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  // Check if retailer needs to complete setup (no store created yet)
  React.useEffect(() => {
    // Wait for auth and store loading to complete
    if (authLoading || storeLoading) {
      return;
    }

    if (!user) {
      return;
    }

    // Check if user is logged in as a retailer account
    const normalizedRole = String((user as any).user_type ?? (user as any).role ?? "").toLowerCase();
    const isRetailer = normalizedRole === "retailer";
    // If user is a retailer
    if (isRetailer) {
      // If retailer doesn't have a store, redirect to setup
      // Give a small delay to ensure store loading has truly completed
      const timeoutId = setTimeout(() => {
        if (!userStore) {
          console.log("Retailer has no store, redirecting to setup page");
          router.replace("/auth/setup");
        }
      }, 500); // Small delay to ensure store loading is complete

      return () => clearTimeout(timeoutId);
    }
  }, [user, userStore, storeLoading, authLoading]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFBE5D",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: styles.tabBar,
        header: () => <RetailerHeader />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size = 24 }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="promotions"
        options={{
          title: "Promotions",
          headerShown: false,
          tabBarIcon: ({ color, size = 24 }) => (
            <Ionicons name="ticket" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          headerShown: false,
          tabBarIcon: ({ color, size = 24 }) => (
            <Ionicons name="cube" color={color} size={size} />
          ),
        }}
      />
    
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerShown: false,
          href: null,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          href: null,
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Subscription",
          headerShown: false,
          tabBarIcon: ({ color, size = 24 }) => (
            <Ionicons name="card" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
          tabBarIcon: ({ color, size = 24 }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          headerShown: false,
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-product"
        options={{
          headerShown: false,
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: Platform.OS === "ios" ? 40 : (StatusBar.currentHeight || 0) + 4,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  headerContainerCompact: {
    paddingTop: Platform.OS === "ios" ? 30 : (StatusBar.currentHeight || 0) + 2,
    paddingBottom: 4,
    paddingHorizontal: 12,
    borderBottomRightRadius: 24,
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
  headerTitleCompact: {
    fontSize: 18,
    marginBottom: 0,
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
  unverifiedBanner: {
    marginTop: 6,
    marginHorizontal: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(254, 243, 199, 0.95)",
  },
  unverifiedTitle: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  unverifiedText: {
    color: "#92400E",
    fontSize: 11,
  },
  logoutContainer: {
    width: 30,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingBottom: Platform.OS === "ios" ? 20 : 5,
    paddingTop: 5,
    height: Platform.OS === "ios" ? 85 : 65,
  },
});
