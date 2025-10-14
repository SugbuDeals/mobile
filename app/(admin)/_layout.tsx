import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const AdminHeader = ({ title = "Dashboard", subtitle = "Welcome back, Admin!" }: { title?: string; subtitle?: string }) => {
  const router = useRouter();
  
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
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="cart" size={24} color="#ffffff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
          </View>
          
          {/* Right side buttons */}
          <View style={styles.rightButtonsContainer}>
            {/* Notification Bell */}
            <TouchableOpacity 
              style={styles.notificationContainer}
              onPress={() => router.push("/(admin)/notifications")}
            >
              <Ionicons name="notifications" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function AdminLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#1B6F5D",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 0,
            paddingBottom: Platform.OS === "ios" ? 20 : 5,
            paddingTop: 5,
            height: Platform.OS === "ios" ? 85 : 65,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            header: () => <AdminHeader title="Dashboard" subtitle="Welcome back, Admin!" />,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: "Users",
            header: () => <AdminHeader title="User Management" subtitle="Manage Users" />,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: "AI",
            header: () => <AdminHeader title="AI Testing" subtitle="Test AI Functionality" />,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "hardware-chip" : "hardware-chip-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="deals"
          options={{
            title: "Deals",
            header: () => <AdminHeader title="Deal Analytics" subtitle="Monitor Deals" />,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "pricetag" : "pricetag-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notifications",
            header: () => <AdminHeader title="Notifications" subtitle="System alerts and updates" />,
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            header: () => <AdminHeader title="Admin Settings" subtitle="Configure system settings" />,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "settings" : "settings-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  headerShadowContainer: {
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,

    backgroundColor: "transparent",
    overflow: "hidden"
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 0),
    paddingBottom: 20,
    paddingHorizontal: 20,
    
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    justifyContent: "space-between",
    backgroundColor: "transparent"
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
  },
});
