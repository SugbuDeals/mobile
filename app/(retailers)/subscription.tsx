import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
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
  const { state: { user } } = useLogin();
  const {
    action: {
      getActiveSubscription,
      findSubscriptions,
      joinSubscription,
      cancelRetailerSubscription,
      updateRetailerSubscription,
    },
    state: { activeSubscription, subscriptions, loading },
  } = useStore();

  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch subscriptions on mount and when focused
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getActiveSubscription(Number(user.id));
        // Fetch available active subscription plans defined by admin
        findSubscriptions({ isActive: true });
      }
    }, [user, getActiveSubscription, findSubscriptions])
  );

  const handleJoinSubscription = async (subscriptionId: number) => {
    try {
      setIsProcessing(true);
      await joinSubscription({ subscriptionId }).unwrap();
      
      // Refresh active subscription
      if (user?.id) {
        await getActiveSubscription(Number(user.id));
      }
      
      Alert.alert("Success", "Subscription joined successfully!");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to join subscription. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateSubscription = async (subscriptionId: number) => {
    try {
      setIsProcessing(true);
      await updateRetailerSubscription({ subscriptionId }).unwrap();
      
      // Refresh active subscription
      if (user?.id) {
        await getActiveSubscription(Number(user.id));
      }
      
      Alert.alert("Success", "Subscription updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update subscription. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your current subscription?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);
              await cancelRetailerSubscription().unwrap();
              
              // Refresh active subscription
              if (user && (user as any).id) {
                await getActiveSubscription(Number((user as any).id));
              }
              
              Alert.alert("Success", "Subscription cancelled successfully.");
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to cancel subscription. Please try again.");
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "PREMIUM":
        return "#FFBE5D";
      case "BASIC":
        return "#277874";
      case "FREE":
      default:
        return "#6B7280";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={["#FFBE5D", "#277874"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="card" size={24} color="#ffffff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Subscription</Text>
              <Text style={styles.headerSubtitle}>Manage your subscription plan</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Subscription (retailer-specific, joined plan) */}
        {activeSubscription ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Subscription</Text>
            <View
              style={[
                styles.subscriptionCard,
                { borderColor: getPlanColor(activeSubscription.plan || "FREE") },
              ]}
            >
              <View style={styles.subscriptionHeader}>
                <View
                  style={[
                    styles.planBadge,
                    { backgroundColor: getPlanColor(activeSubscription.plan || "FREE") },
                  ]}
                >
                  <Text style={styles.planBadgeText}>
                    {activeSubscription.plan || "FREE"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        activeSubscription.status === "ACTIVE" ? "#10B981" : "#F59E0B",
                    },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {activeSubscription.status || "ACTIVE"}
                  </Text>
                </View>
              </View>

              <View style={styles.subscriptionDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Started: {formatDate(activeSubscription.startsAt || "")}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Expires: {formatDate(activeSubscription.endsAt || "")}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="repeat-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Billing: {activeSubscription.billingCycle || "MONTHLY"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Price:{" "}
                    {activeSubscription.price ? `₱${activeSubscription.price}` : "Free"}
                  </Text>
                </View>
              </View>

              {activeSubscription.status === "ACTIVE" && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelSubscription}
                  disabled={isProcessing}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
                  <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.noSubscriptionCard}>
              <Ionicons name="card-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noSubscriptionText}>No Active Subscription</Text>
              <Text style={styles.noSubscriptionSubtext}>
                You're currently on the FREE plan. Upgrade to unlock more features!
              </Text>
            </View>
          </View>
        )}

        {/* Available Subscriptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          
          {loading && subscriptions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading subscriptions...</Text>
            </View>
          ) : subscriptions.length > 0 ? (
            subscriptions.map((subscription) => {
              const isCurrentPlan = activeSubscription?.id === subscription.id;
              const planKey = subscription.plan || "FREE";
              const displayName = subscription.name || `${planKey} Plan`;

              // Prepare benefits list from admin-defined benefits string
              const benefitLines =
                subscription.benefits
                  ?.split("\n")
                  .map((line: string) => line.replace(/^•\s*/, "").trim())
                  .filter((line: string) => line.length > 0) || [];

              const featuresToShow =
                benefitLines.length > 0
                  ? benefitLines
                  : ["Standard listing visibility", "Access to promotions", "Basic support"];
              
              return (
                <View
                  key={subscription.id}
                  style={[
                    styles.planCard,
                    isCurrentPlan && styles.currentPlanCard,
                    { borderColor: getPlanColor(planKey) },
                  ]}
                >
                  <View style={styles.planHeader}>
                    <View
                      style={[
                        styles.planBadge,
                        { backgroundColor: getPlanColor(planKey) },
                      ]}
                    >
                      <Text style={styles.planBadgeText}>{planKey}</Text>
                    </View>
                    <Text style={styles.planNameText}>{displayName}</Text>
                    {isCurrentPlan && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                      {subscription.price ? `₱${subscription.price}` : "Free"}
                    </Text>
                    <Text style={styles.billingCycle}>
                      /
                      {(subscription.billingCycle || "MONTHLY").toLowerCase()}
                    </Text>
                  </View>

                  <View style={styles.featuresContainer}>
                    {featuresToShow.map((feature: string, index: number) => (
                      <View key={index} style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  {!isCurrentPlan && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: getPlanColor(planKey) },
                        isProcessing && styles.actionButtonDisabled,
                      ]}
                      onPress={() => {
                        if (activeSubscription) {
                          handleUpdateSubscription(subscription.id);
                        } else {
                          handleJoinSubscription(subscription.id);
                        }
                      }}
                      disabled={isProcessing}
                    >
                      <Text style={styles.actionButtonText}>
                        {activeSubscription ? "Switch Plan" : "Subscribe Now"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No subscriptions available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 16,
  },
  subscriptionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  planBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  subscriptionDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: "#374151",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#DC2626",
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
  noSubscriptionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noSubscriptionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  noSubscriptionSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  planCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currentPlanCard: {
    backgroundColor: "#F0FDF4",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  currentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#10B981",
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  planNameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 12,
    flex: 1,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#374151",
  },
  billingCycle: {
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#374151",
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 16,
  },
});

