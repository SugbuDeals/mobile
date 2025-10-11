import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StatusBar, StyleSheet, Text, View } from "react-native";

const ConsumerHeader = () => {
  return (
    <View style={styles.headerShadowContainer}>
      <LinearGradient
        colors={["#FFBE5D", "#277874"]}
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#277874" />
        <View style={styles.headerContent}>
          {/* Shopping Cart Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="cart" size={20} color="#ffffff" />
          </View>
          
          {/* App Title and Tagline */}
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>SugbuDeals</Text>
            <Text style={styles.headerSubtitle}>Explore Deals!</Text>
          </View>
          
          {/* Notification Bell */}
          <View style={styles.notificationContainer}>
            <Ionicons name="notifications" size={20} color="#ffffff" />
          </View>
          
          {/* Profile Picture */}
          <View style={styles.profileContainer}>
            <Ionicons name="person" size={20} color="#ffffff" />
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
          title: "Home",
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
    backgroundColor: "transparent",
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 0),
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
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
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingBottom: Platform.OS === "ios" ? 20 : 5,
    paddingTop: 5,
    height: Platform.OS === "ios" ? 85 : 65,
  },
});