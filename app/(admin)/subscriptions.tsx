import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SubscriptionAnalytics() {
  const {
    action: { getSubscriptionAnalytics },
    state: { subscriptionAnalytics, loading },
  } = useStore();

  // Fetch analytics on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getSubscriptionAnalytics();
    }, [getSubscriptionAnalytics])
  );

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "₱0.00";
    return `₱${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  if (loading && !subscriptionAnalytics) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#277874" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  const analytics = subscriptionAnalytics;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={[styles.overviewCard, styles.primaryCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="people" size={24} color="#ffffff" />
                <Text style={[styles.cardLabel, styles.primaryCardText]}>Total Users</Text>
              </View>
              <Text style={[styles.cardValue, styles.primaryCardText]}>
                {analytics ? formatNumber(analytics.total) : "0"}
              </Text>
              <View style={[styles.cardFooter, styles.primaryCardFooter]}>
                <View style={styles.footerItem}>
                  <Text style={[styles.footerLabel, styles.primaryCardText]}>Active</Text>
                  <Text style={[styles.footerValue, styles.primaryCardText]}>
                    {analytics ? formatNumber(analytics.active) : "0"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.overviewCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="cash" size={24} color="#10B981" />
                <Text style={styles.cardLabel}>Total Revenue</Text>
              </View>
              <Text style={[styles.cardValue, styles.revenueValue]}>
                {analytics ? formatCurrency(analytics.totalRevenue) : "₱0.00"}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>Avg Price</Text>
                  <Text style={styles.footerValue}>
                    {analytics ? formatCurrency(analytics.averagePrice) : "₱0.00"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.overviewCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="calendar" size={24} color="#FFBE5D" />
                <Text style={styles.cardLabel}>This Month</Text>
              </View>
              <Text style={styles.cardValue}>
                {analytics ? formatNumber(analytics.subscriptionsThisMonth) : "0"}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>Recent (30d)</Text>
                  <Text style={styles.footerValue}>
                    {analytics ? formatNumber(analytics.recentSubscriptions) : "0"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Status Breakdown */}
        {analytics && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status Breakdown</Text>
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: "#10B981" }]} />
                    <Text style={styles.breakdownLabel}>Active</Text>
                    <Text style={styles.breakdownValue}>{formatNumber(analytics.active)}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: "#EF4444" }]} />
                    <Text style={styles.breakdownLabel}>Cancelled</Text>
                    <Text style={styles.breakdownValue}>{formatNumber(analytics.cancelled || 0)}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: "#6B7280" }]} />
                    <Text style={styles.breakdownLabel}>Expired</Text>
                    <Text style={styles.breakdownValue}>{formatNumber(analytics.expired || 0)}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: "#F59E0B" }]} />
                    <Text style={styles.breakdownLabel}>Pending</Text>
                    <Text style={styles.breakdownValue}>{formatNumber(analytics.pending || 0)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Plan Distribution */}
            {analytics.byPlan && analytics.byPlan.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Plan Distribution</Text>
                <View style={styles.distributionCard}>
                  {analytics.byPlan.map((item, index) => (
                    <View key={index} style={styles.distributionRow}>
                      <View style={styles.distributionLeft}>
                        <View
                          style={[
                            styles.planBadge,
                            {
                              backgroundColor:
                                item.plan === "PRO"
                                  ? "#FFBE5D"
                                  : item.plan === "BASIC"
                                  ? "#277874"
                                  : "#6B7280",
                            },
                          ]}
                        >
                          <Text style={styles.planBadgeText}>{item.plan}</Text>
                        </View>
                        <Text style={styles.distributionLabel}>{item.plan} Plan</Text>
                      </View>
                      <Text style={styles.distributionValue}>{formatNumber(item.count)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Billing Cycle Distribution */}
            {analytics.byBillingCycle && analytics.byBillingCycle.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Billing Cycle</Text>
                <View style={styles.distributionCard}>
                  {analytics.byBillingCycle.map((item, index) => (
                    <View key={index} style={styles.distributionRow}>
                      <View style={styles.distributionLeft}>
                        <Ionicons
                          name={item.billingCycle === "YEARLY" ? "calendar" : "calendar-outline"}
                          size={20}
                          color="#277874"
                        />
                        <Text style={styles.distributionLabel}>
                          {item.billingCycle === "MONTHLY" ? "Monthly" : "Yearly"}
                        </Text>
                      </View>
                      <Text style={styles.distributionValue}>{formatNumber(item.count)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Status Distribution */}
            {analytics.byStatus && analytics.byStatus.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status Distribution</Text>
                <View style={styles.distributionCard}>
                  {analytics.byStatus.map((item, index) => (
                    <View key={index} style={styles.distributionRow}>
                      <View style={styles.distributionLeft}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                item.status === "ACTIVE"
                                  ? "#10B981"
                                  : item.status === "CANCELLED"
                                  ? "#EF4444"
                                  : item.status === "EXPIRED"
                                  ? "#6B7280"
                                  : "#F59E0B",
                            },
                          ]}
                        />
                        <Text style={styles.distributionLabel}>{item.status}</Text>
                      </View>
                      <Text style={styles.distributionValue}>{formatNumber(item.count)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {!analytics && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="stats-chart-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No analytics data available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
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
  overviewSection: {
    marginBottom: 24,
  },
  overviewGrid: {
    gap: 16,
  },
  overviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCard: {
    backgroundColor: "#277874",
  },
  primaryCardText: {
    color: "#ffffff",
  },
  primaryCardFooter: {
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  cardValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
  },
  revenueValue: {
    color: "#10B981",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  breakdownCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 16,
  },
  breakdownItem: {
    alignItems: "center",
    minWidth: 80,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },
  distributionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 16,
  },
  distributionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  distributionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  distributionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  distributionValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#277874",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emptyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
  },
});
