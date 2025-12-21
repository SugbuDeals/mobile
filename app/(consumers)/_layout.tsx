import { VoucherRedeemedPopup } from "@/components/consumers/VoucherRedeemedPopup";
import { useNotifications } from "@/features/notifications";
import { useStore } from "@/features/store";
import { useNearbyPromotionNotifications } from "@/hooks/useNearbyPromotionNotifications";
import { useVoucherStatusPolling } from "@/hooks/useVoucherStatusPolling";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Animated, AppState, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ConsumerHeader = () => {
  const router = useRouter();
  const { action, state } = useNotifications();
  const {
    action: { getCurrentTier },
    state: { currentTier },
  } = useStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasUnread = (state.unreadCount ?? 0) > 0;

  useEffect(() => {
    // Fetch unread count when header mounts
    action.getUnreadCount();
    // Fetch current tier to show PRO indicator
    getCurrentTier();
  }, [action, getCurrentTier]);

  // Refresh unread count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      action.getUnreadCount();
    }, [action])
  );

  // Refresh unread count when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        action.getUnreadCount();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [action]);

  // Animate notification icon when there are unread notifications
  useEffect(() => {
    if (hasUnread) {
      // Continuous pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animation and reset to normal size
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [hasUnread, pulseAnim]);

  const isPro = currentTier?.tier === "PRO";

  return (
    <View style={styles.headerWrapper}>
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
        {/* App Title with PRO Badge */}
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>SugbuDeals</Text>
            {isPro && (
              <View style={styles.proBadge}>
                <Ionicons name="star" size={12} color="#FFBE5D" />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Icons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.notificationContainer}
            onPress={() => router.push("/(consumers)/notifications")}
            activeOpacity={0.7}
          >
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <Ionicons 
                name="notifications" 
                size={22} 
                color={hasUnread ? "#EF4444" : "#ffffff"}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileContainer}
            onPress={() => router.push("/(consumers)/profile")}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
      </LinearGradient>
    </View>
  );
};

export default function ConsumersLayout() {
  // Initialize nearby promotion notifications
  // This hook handles location tracking and notifications automatically
  useNearbyPromotionNotifications();
  
  // Initialize voucher status polling
  const { redeemedVoucher, clearRedeemedVoucher } = useVoucherStatusPolling();
  
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#277874",
          tabBarInactiveTintColor: "#6b7280",
          tabBarStyle: {
            ...styles.tabBar,
            paddingBottom: Math.max(insets.bottom, 5),
            height: Platform.OS === "ios" ? 65 + insets.bottom : 60 + insets.bottom,
          },
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
            headerShown: false,
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
        <Tabs.Screen
          name="subscription"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="my-reports"
          options={{
            href: null,
            headerShown: false,
          }}
        />
      </Tabs>
      
      {/* Voucher Redeemed Popup */}
      <VoucherRedeemedPopup
        visible={!!redeemedVoucher}
        onClose={clearRedeemedVoucher}
        storeId={redeemedVoucher?.storeId}
        promotionId={redeemedVoucher?.promotionId}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: "transparent",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        // No elevation to avoid background box
      },
    }),
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 0,
    paddingBottom: 12,
    paddingHorizontal: 20,
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
    width: "100%",
  },
  titleContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFBE5D",
    letterSpacing: 0.5,
  },
  headerTitleCompact: {
    fontSize: 18,
  },
  notificationContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 5,
  },
});
