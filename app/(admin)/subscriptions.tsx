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

  const analytics = subscriptionAnalytics;

  // Calculate derived metrics from API data
  const totalUsers = analytics?.totalUsers || 0;
  const basicUsers = analytics?.basicUsers || 0;
  const proUsers = analytics?.proUsers || 0;
  const monthlyRevenue = analytics?.revenue?.monthly || 0;
  const yearlyRevenue = analytics?.revenue?.yearly || 0;
  
  // Get role-based breakdowns
  const consumerStats = analytics?.byRoleAndTier?.consumer;
  const retailerStats = analytics?.byRoleAndTier?.retailer;
  const adminStats = analytics?.byRoleAndTier?.admin;

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
                {formatNumber(totalUsers)}
              </Text>
              <View style={[styles.cardFooter, styles.primaryCardFooter]}>
                <View style={styles.footerItem}>
                  <Text style={[styles.footerLabel, styles.primaryCardText]}>Basic</Text>
                  <Text style={[styles.footerValue, styles.primaryCardText]}>
                    {formatNumber(basicUsers)}
                  </Text>
                </View>
                <View style={styles.footerItem}>
                  <Text style={[styles.footerLabel, styles.primaryCardText]}>Pro</Text>
                  <Text style={[styles.footerValue, styles.primaryCardText]}>
                    {formatNumber(proUsers)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.overviewCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="cash" size={24} color="#10B981" />
                <Text style={styles.cardLabel}>Monthly Revenue</Text>
              </View>
              <Text style={[styles.cardValue, styles.revenueValue]}>
                {formatCurrency(monthlyRevenue)}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>Yearly</Text>
                  <Text style={styles.footerValue}>
                    {formatCurrency(yearlyRevenue)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.overviewCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="stats-chart" size={24} color="#FFBE5D" />
                <Text style={styles.cardLabel}>Tier Distribution</Text>
              </View>
              <Text style={styles.cardValue}>
                {formatNumber(proUsers)}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>Pro Users</Text>
                  <Text style={styles.footerValue}>
                    {formatNumber(basicUsers)} Basic
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Role & Tier Breakdown */}
        {analytics && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tier Breakdown</Text>
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: "#277874" }]} />
                    <Text style={styles.breakdownLabel}>Basic</Text>
                    <Text style={styles.breakdownValue}>{formatNumber(basicUsers)}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: "#FFBE5D" }]} />
                    <Text style={styles.breakdownLabel}>Pro</Text>
                    <Text style={styles.breakdownValue}>{formatNumber(proUsers)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Role Distribution */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>By Role & Tier</Text>
              <View style={styles.distributionCard}>
                {/* Consumers */}
                {consumerStats && (
                  <View style={styles.distributionRow}>
                    <View style={styles.distributionLeft}>
                      <Ionicons name="people" size={20} color="#277874" />
                      <Text style={styles.distributionLabel}>Consumers</Text>
                    </View>
                    <View style={styles.distributionRight}>
                      <Text style={styles.distributionValue}>{formatNumber(consumerStats.total)}</Text>
                      <Text style={styles.distributionSubtext}>
                        {formatNumber(consumerStats.basic)} Basic, {formatNumber(consumerStats.pro)} Pro
                      </Text>
                    </View>
                  </View>
                )}

                {/* Retailers */}
                {retailerStats && (
                  <View style={styles.distributionRow}>
                    <View style={styles.distributionLeft}>
                      <Ionicons name="storefront" size={20} color="#277874" />
                      <Text style={styles.distributionLabel}>Retailers</Text>
                    </View>
                    <View style={styles.distributionRight}>
                      <Text style={styles.distributionValue}>{formatNumber(retailerStats.total)}</Text>
                      <Text style={styles.distributionSubtext}>
                        {formatNumber(retailerStats.basic)} Basic, {formatNumber(retailerStats.pro)} Pro
                      </Text>
                    </View>
                  </View>
                )}

                {/* Admins */}
                {adminStats && (
                  <View style={styles.distributionRow}>
                    <View style={styles.distributionLeft}>
                      <Ionicons name="shield" size={20} color="#277874" />
                      <Text style={styles.distributionLabel}>Admins</Text>
                    </View>
                    <View style={styles.distributionRight}>
                      <Text style={styles.distributionValue}>{formatNumber(adminStats.total)}</Text>
                      <Text style={styles.distributionSubtext}>
                        {formatNumber(adminStats.basic)} Basic, {formatNumber(adminStats.pro)} Pro
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Revenue Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
              <View style={styles.distributionCard}>
                <View style={styles.distributionRow}>
                  <View style={styles.distributionLeft}>
                    <Ionicons name="calendar-outline" size={20} color="#10B981" />
                    <Text style={styles.distributionLabel}>Monthly</Text>
                  </View>
                  <Text style={[styles.distributionValue, styles.revenueValue]}>
                    {formatCurrency(monthlyRevenue)}
                  </Text>
                </View>
                <View style={styles.distributionRow}>
                  <View style={styles.distributionLeft}>
                    <Ionicons name="calendar" size={20} color="#10B981" />
                    <Text style={styles.distributionLabel}>Yearly</Text>
                  </View>
                  <Text style={[styles.distributionValue, styles.revenueValue]}>
                    {formatCurrency(yearlyRevenue)}
                  </Text>
                </View>
              </View>
            </View>
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
    flex: 1,
  },
  distributionRight: {
    alignItems: "flex-end",
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
  distributionSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
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
