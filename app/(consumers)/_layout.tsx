import { useNotifications } from "@/features/notifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ConsumerHeader = () => {
  const router = useRouter();
  const { action, state } = useNotifications();

  useEffect(() => {
    // Fetch unread count when header mounts
    action.getUnreadCount();
  }, []);

  return (
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
          {/* Shopping Cart Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="cart" size={20} color="#ffffff" />
          </View>

          {/* App Title and Tagline */}
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>
              SugbuDeals
            </Text>
            <Text style={styles.headerSubtitle}>Explore Deals!</Text>
          </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.notificationContainer}
            onPress={() => router.push("/(consumers)/notifications")}
          >
            <Ionicons 
              name={state.unreadCount > 0 ? "notifications" : "notifications-outline"} 
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

          <TouchableOpacity
            style={styles.profileContainer}
            onPress={() => router.push("/(consumers)/profile")}
          >
            <Ionicons name="person" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function ConsumersLayout() {
  return (
    <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#277874",
          tabBarInactiveTintColor: "#6b7280",
          tabBarStyle: styles.tabBar,
          header: () => <ConsumerHeader />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Consumer",
            tabBarIcon: ({ color, size = 24 }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, size = 24 }) => (
              <Ionicons name="compass" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="save"
          options={{
            title: "Save",
            tabBarIcon: ({ color, size = 24 }) => (
              <Ionicons name="heart" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size = 24 }) => (
              <Ionicons name="person" color={color} size={size} />
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
          name="recommendations"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="storedetails"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="product"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="viewmap"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="navigate"
          options={{
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
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 0,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  headerContainerCompact: {
    paddingTop: Platform.OS === "ios" ? 32 : (StatusBar.currentHeight || 0) + 2,
    paddingBottom: 4,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#277874",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  headerTitleCompact: {
    fontSize: 18,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
    marginTop: 2,
    textAlign: "center",
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
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#277874",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
