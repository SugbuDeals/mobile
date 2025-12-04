import { useLogin } from "@/features/auth";
import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function AdminDashboard() {
  const { state: authState, action: authActions } = useLogin();
  const { action: storeActions, state: { promotions, products, stores, subscriptions, subscriptionAnalytics, loading: storeLoading } } = useStore();
  const { state: catalogState, action: catalogActions } = useCatalog();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch all data needed for dashboard
    if (authState.allUsers.length === 0) {
      authActions.fetchAllUsers();
    }
    
    storeActions.findPromotions();
    storeActions.findProducts();
    storeActions.findStores();
    storeActions.findSubscriptions();
    storeActions.getSubscriptionAnalytics();
    catalogActions.loadCategories();
    
    // Set loading to false after a short delay
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate today's date for filtering
  const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };
  
  const getTodayEnd = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  };
  
  const isCreatedToday = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    return createdDate >= getTodayStart() && createdDate <= getTodayEnd();
  };

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const totalUsers = authState.allUsers.length;
    const consumers = authState.allUsers.filter(u => (u.role === "CONSUMER" || u.user_type === "consumer")).length;
    const retailers = authState.allUsers.filter(u => (u.role === "RETAILER" || u.user_type === "retailer")).length;
    const admins = authState.allUsers.filter(u => (u.role === "ADMIN" || u.user_type === "admin")).length;
    
    const totalStores = stores.length;
    const verifiedStores = stores.filter(s => s.verificationStatus === "VERIFIED").length;
    const activeStores = stores.filter(s => s.isActive !== false).length;
    
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive !== false).length;
    
    const totalPromotions = promotions.length;
    const activePromotions = promotions.filter(p => p.active).length;
    
    const totalCategories = catalogState.categories.length;
    
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.isActive !== false).length;
    const revenue = typeof subscriptionAnalytics?.totalRevenue === 'number' ? subscriptionAnalytics.totalRevenue : 0;
    
    // Calculate average discount
    const totalDiscount = promotions.reduce((sum, p) => sum + (p.discount || 0), 0);
    const avgDiscount = totalPromotions > 0 ? (totalDiscount / totalPromotions).toFixed(1) : "0.0";
    
    // Recent users today
    const recentUsersToday = authState.allUsers.filter(user => {
      const createdAt = user.createdAt || user.created_at;
      if (!createdAt) return false;
      return isCreatedToday(createdAt);
    });

    return {
      totalUsers,
      consumers,
      retailers,
      admins,
      totalStores,
      verifiedStores,
      activeStores,
      totalProducts,
      activeProducts,
      totalPromotions,
      activePromotions,
      totalCategories,
      totalSubscriptions,
      activeSubscriptions,
      revenue,
      avgDiscount,
      recentUsersToday,
    };
  }, [authState.allUsers, stores, products, promotions, catalogState.categories, subscriptions, subscriptionAnalytics]);

  // Format time ago for recent users
  const getTimeAgo = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 1) return "Less than 1h ago";
    return `${diffHours}h ago`;
  };
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  if (isLoading || authState.usersLoading || storeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B6F5D" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics Cards */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => router.push("/(admin)/users")}
            >
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Total Users</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#D1FAE5" }]}>
                  <Ionicons name="people" size={20} color="#1B6F5D" />
                </View>
              </View>
              <Text style={styles.metricValue}>{formatNumber(metrics.totalUsers)}</Text>
              <View style={styles.metricBreakdown}>
                <Text style={styles.metricBreakdownText}>Consumers: {metrics.consumers}</Text>
                <Text style={styles.metricBreakdownText}>Retailers: {metrics.retailers}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => router.push("/(admin)/deals")}
            >
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Active Deals</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="pricetag" size={20} color="#3B82F6" />
                </View>
              </View>
              <Text style={styles.metricValue}>{formatNumber(metrics.activePromotions)}</Text>
              <Text style={styles.metricChange}>Avg: {metrics.avgDiscount}% off</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => router.push("/(admin)/subscriptions")}
            >
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Revenue</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name="cash" size={20} color="#F59E0B" />
                </View>
              </View>
              <Text style={styles.metricValue}>₱{formatNumber(typeof metrics.revenue === 'number' ? metrics.revenue : 0)}</Text>
              <Text style={styles.metricChange}>{metrics.activeSubscriptions} active plans</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => router.push("/(admin)/view-store")}
            >
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Stores</Text>
                <View style={[styles.metricIcon, { backgroundColor: "#E0E7FF" }]}>
                  <Ionicons name="storefront" size={20} color="#6366F1" />
                </View>
              </View>
              <Text style={styles.metricValue}>{formatNumber(metrics.totalStores)}</Text>
              <Text style={styles.metricChange}>{metrics.verifiedStores} verified</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Overview */}
        <View style={styles.overviewSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>System Overview</Text>
          </View>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Ionicons name="cube-outline" size={24} color="#277874" />
                <Text style={styles.overviewLabel}>Products</Text>
              </View>
              <Text style={styles.overviewValue}>{formatNumber(metrics.totalProducts)}</Text>
              <Text style={styles.overviewSub}>{metrics.activeProducts} active</Text>
              <TouchableOpacity 
                style={styles.overviewButton}
                onPress={() => router.push("/(admin)/view-product")}
              >
                <Text style={styles.overviewButtonText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#277874" />
              </TouchableOpacity>
            </View>

            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Ionicons name="pricetag-outline" size={24} color="#F59E0B" />
                <Text style={styles.overviewLabel}>Promotions</Text>
              </View>
              <Text style={styles.overviewValue}>{formatNumber(metrics.totalPromotions)}</Text>
              <Text style={styles.overviewSub}>{metrics.activePromotions} active</Text>
              <TouchableOpacity 
                style={styles.overviewButton}
                onPress={() => router.push("/(admin)/view-promotion")}
              >
                <Text style={styles.overviewButtonText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
              </TouchableOpacity>
            </View>

            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Ionicons name="albums-outline" size={24} color="#8B5CF6" />
                <Text style={styles.overviewLabel}>Categories</Text>
              </View>
              <Text style={styles.overviewValue}>{formatNumber(metrics.totalCategories)}</Text>
              <Text style={styles.overviewSub}>Total categories</Text>
              <TouchableOpacity 
                style={styles.overviewButton}
                onPress={() => router.push("/(admin)/settings")}
              >
                <Text style={styles.overviewButtonText}>Manage</Text>
                <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>

            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Ionicons name="card-outline" size={24} color="#10B981" />
                <Text style={styles.overviewLabel}>Subscriptions</Text>
              </View>
              <Text style={styles.overviewValue}>{formatNumber(metrics.totalSubscriptions)}</Text>
              <Text style={styles.overviewSub}>{metrics.activeSubscriptions} active</Text>
              <TouchableOpacity 
                style={styles.overviewButton}
                onPress={() => router.push("/(admin)/subscriptions")}
              >
                <Text style={styles.overviewButtonText}>Manage</Text>
                <Ionicons name="chevron-forward" size={16} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Users Section */}
        <View style={styles.usersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Users Today</Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/users")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {metrics.recentUsersToday.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No new users today</Text>
            </View>
          ) : (
          <View style={styles.usersList}>
              {metrics.recentUsersToday.slice(0, 5).map((user) => {
                const createdAt = user.createdAt || user.created_at;
                const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.fullname || user.email || 'U')}&background=random`;
                
                return (
              <View key={user.id} style={styles.userCard}>
                    <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
                <View style={styles.userInfo}>
                      <Text style={styles.userName}>
                        {user.name || user.fullname || user.email || "Unknown"}
                      </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                    {createdAt && (
                      <Text style={styles.userTime}>{getTimeAgo(createdAt)}</Text>
                    )}
              </View>
                );
              })}
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
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  overviewSection: {
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  overviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: (width - 60) / 2,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  overviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  overviewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#277874",
    marginBottom: 4,
  },
  overviewSub: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 10,
  },
  overviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  overviewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#277874",
  },
  metricBreakdown: {
    marginTop: 4,
    gap: 2,
  },
  metricBreakdownText: {
    fontSize: 11,
    color: "#6b7280",
  },
  metricsSection: {
    marginBottom: 8,
    marginTop: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: (width - 60) / 2,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricIcon: {
    width: 35,
    height: 35,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#277874",
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  metricChange: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "500",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#277874",
  },
  viewAllText: {
    fontSize: 14,
    color: "#FFBE5D",
    fontWeight: "500",
  },
  usersSection: {
    marginBottom: 16,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#277874",
  },
  userTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  emptyState: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9ca3af",
  },
});

