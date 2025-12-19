import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import { useNotifications } from "@/features/notifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Subscription() {
  const router = useRouter();
  const { state: { user } } = useLogin();
  const {
    action: { getCurrentTier, upgradeToPro, downgradeToBasic },
    state: { currentTier, loading },
  } = useStore();
  const { action: notificationActions } = useNotifications();

  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch current tier when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getCurrentTier();
    }, [getCurrentTier])
  );

  const handleUpgrade = async () => {
    if (currentTier?.tier === "PRO") {
      Alert.alert("Already PRO", "You are already subscribed to PRO tier.");
      return;
    }

    Alert.alert(
      "Upgrade to PRO",
      "Upgrade to PRO tier for ₱100/month? This will unlock extended features and limits.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade",
          onPress: async () => {
            try {
              setIsProcessing(true);
              await upgradeToPro().unwrap();
              
              // Create a thank you notification for subscribing
              if (user?.id) {
                try {
                  await notificationActions.createNotification({
                    userId: Number(user.id),
                    type: "SUBSCRIPTION_JOINED",
                    title: "🎉 Thank You for Subscribing!",
                    message: "Welcome to PRO! You now have access to extended features including discovering deals up to 3km away. Enjoy exploring more stores and better deals!",
                  });
                  // Refresh unread count to show the new notification
                  notificationActions.getUnreadCount();
                } catch (notifError) {
                  // Silently handle notification creation errors - don't block the upgrade
                  console.warn("Failed to create subscription notification:", notifError);
                }
              }
              
              Alert.alert("Success", "Successfully upgraded to PRO tier!");
              getCurrentTier(); // Refresh tier info
            } catch (error: unknown) {
              const errorMessage = error instanceof Error 
                ? error.message 
                : "Failed to upgrade. Please try again.";
              Alert.alert("Error", errorMessage);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleDowngrade = async () => {
    if (currentTier?.tier === "BASIC") {
      Alert.alert("Already BASIC", "You are already on BASIC tier.");
      return;
    }

    Alert.alert(
      "Downgrade to BASIC",
      "Are you sure you want to downgrade to BASIC tier? You will lose PRO features and extended limits.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Downgrade",
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);
              await downgradeToBasic().unwrap();
              Alert.alert("Success", "Successfully downgraded to BASIC tier.");
              getCurrentTier(); // Refresh tier info
            } catch (error: unknown) {
              const errorMessage = error instanceof Error 
                ? error.message 
                : "Failed to downgrade. Please try again.";
              Alert.alert("Error", errorMessage);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const isPro = currentTier?.tier === "PRO";
  const isBasic = currentTier?.tier === "BASIC";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#277874" />
      <LinearGradient
        colors={["#FFBE5D", "#277874"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Tier Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={isPro ? "star" : "star-outline"}
              size={24}
              color={isPro ? "#FFBE5D" : "#6b7280"}
            />
            <Text style={styles.statusTitle}>Current Plan</Text>
          </View>
          <View style={styles.tierBadge}>
            <Text style={[styles.tierText, isPro && styles.tierTextPro]}>
              {currentTier?.tier || "BASIC"}
            </Text>
          </View>
          {currentTier && (
            <Text style={styles.userInfo}>
              {currentTier.name} • {currentTier.email}
            </Text>
          )}
        </View>

        {/* Tier Comparison */}
        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>Choose Your Plan</Text>
          <Text style={styles.comparisonSubtitle}>
            Unlock more discovery options to find the best deals near you
          </Text>

          {/* BASIC Tier */}
          <View style={[styles.tierCard, !isPro && styles.tierCardActive]}>
            <View style={styles.tierCardHeader}>
              <Text style={styles.tierCardTitle}>BASIC</Text>
              <Text style={styles.tierCardPrice}>Free</Text>
            </View>
            <View style={styles.featuresList}>
              <FeatureItem
                icon="location-outline"
                text="Discover nearby deals within 1km"
                description="Find stores and products close to you for quick and convenient shopping. Perfect for everyday essentials and local purchases."
                color="#6b7280"
              />
            </View>
            {isBasic && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current Plan</Text>
              </View>
            )}
          </View>

          {/* PRO Tier */}
          <View style={[styles.tierCard, isPro && styles.tierCardActive]}>
            <View style={styles.tierCardHeader}>
              <View style={styles.proHeaderRow}>
                <Text style={styles.tierCardTitle}>PRO</Text>
                <View style={styles.proInlineBadge}>
                  <Ionicons name="star" size={14} color="#FFBE5D" />
                  <Text style={styles.proInlineBadgeText}>BEST VALUE</Text>
                </View>
              </View>
              <Text style={styles.tierCardPrice}>₱100/month</Text>
            </View>
            <View style={styles.featuresList}>
              <FeatureItem
                icon="location"
                text="Discover deals up to 3km away"
                description="Explore a wider area to find the best deals, compare prices across more stores, and discover hidden gems in your neighborhood. Perfect for finding rare items, comparing options before you shop, or when you're willing to travel a bit further for better prices. Access 3x more stores and deals!"
                color="#277874"
              />
            </View>
            {isPro && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current Plan</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!isPro ? (
            <TouchableOpacity
              style={[styles.upgradeButton, isProcessing && styles.buttonDisabled]}
              onPress={handleUpgrade}
              disabled={isProcessing || loading}
            >
              <LinearGradient
                colors={["#FFBE5D", "#277874"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="star" size={20} color="#ffffff" />
                <Text style={styles.upgradeButtonText}>
                  {isProcessing ? "Processing..." : "Upgrade to PRO"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.downgradeButton, isProcessing && styles.buttonDisabled]}
              onPress={handleDowngrade}
              disabled={isProcessing || loading}
            >
              <Text style={styles.downgradeButtonText}>
                {isProcessing ? "Processing..." : "Downgrade to BASIC"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#277874" />
          <Text style={styles.infoText}>
            PRO tier provides extended limits and features. You can upgrade or downgrade at any time.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function FeatureItem({
  icon,
  text,
  description,
  color,
}: {
  icon: string;
  text: string;
  description?: string;
  color: string;
}) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={20} color={color} style={styles.featureIcon} />
      <View style={styles.featureContent}>
        <Text style={[styles.featureText, { color }]}>{text}</Text>
        {description && (
          <Text style={[styles.featureDescription, { color: color === "#277874" ? "#6b7280" : "#9ca3af" }]}>
            {description}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontWeight: "600",
    color: "#ffffff",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  statusCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  tierBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  tierText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6b7280",
  },
  tierTextPro: {
    color: "#277874",
  },
  userInfo: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  comparisonCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  proHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  proInlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proInlineBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#92400E",
    letterSpacing: 0.3,
  },
  tierCard: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: "relative",
  },
  tierCardActive: {
    borderColor: "#277874",
    backgroundColor: "#f0fdf4",
  },
  tierCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tierCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  tierCardPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: "#277874",
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureIcon: {
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
    flexShrink: 1,
  },
  featureText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
    flexWrap: "wrap",
  },
  currentBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#277874",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  actionsContainer: {
    gap: 12,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  downgradeButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  downgradeButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },
});

