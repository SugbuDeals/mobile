import { logout } from "@/features/auth/slice";
import { useAppDispatch } from "@/store/hooks";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, router } from "expo-router";
import React from "react";
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const RetailerHeader = () => {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/auth/login");
  };

  return (
    <View style={styles.headerShadowContainer}>
      <LinearGradient
        colors={["#FFBE5D", "#277874"]}
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" />
        <View style={styles.headerContent}>
          {/* Store Icon */}
          <View style={styles.storeIconContainer}>
            <Ionicons name="storefront" size={24} color="#ffffff" />
          </View>
          
          {/* App Title and Subtitle */}
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>SugbuDeals</Text>
            <Text style={styles.headerSubtitle}>Manage your Store</Text>
          </View>
          
          {/* Right side buttons */}
          <View style={styles.rightButtonsContainer}>
            {/* Notification Bell */}
            <View style={styles.notificationContainer}>
              <Ionicons name="notifications" size={20} color="#ffffff" />
            </View>
            
            {/* Logout Button */}
            <TouchableOpacity 
              style={styles.logoutContainer}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function RetailersLayout() {
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
          tabBarIcon: ({ color, size = 24 }) => (
            <Ionicons name="ticket" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size = 24 }) => (
            <Ionicons name="cube" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size = 24 }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
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
    overflow: "hidden"
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 0),
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent"
  },
  storeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
  headerSubtitle: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
    marginTop: 2,
    textAlign: "center",
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
